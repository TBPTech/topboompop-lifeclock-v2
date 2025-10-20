import express from 'express';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { inject } from '@vercel/speed-insights';

const app = express();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Input validation schema
const DreamAnalysisSchema = z.object({
  dreamText: z.string().min(20, 'Dream text must be at least 20 characters').max(2000, 'Dream text cannot exceed 2000 characters'),
  userId: z.string().optional(), // Optional for future per-user quotas
  timestamp: z.number().optional(),
});

// Response schema for JSON-only output
const DreamAnalysisResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    emotions: z.array(z.string()),
    themes: z.array(z.string()),
    interpretation: z.string(),
    symbols: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    timestamp: z.number(),
  }).optional(),
  error: z.string().optional(),
  requestId: z.string().optional(),
});

// Rate limiting: 10 requests per 15 minutes per IP
const dreamAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many dream analysis requests. Please try again in 15 minutes.',
    requestId: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Vercel Speed Insights
app.use(inject());

// CORS middleware for Chrome extension
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow requests from Chrome extensions and localhost
  if (!origin || 
      origin.includes('chrome-extension://') || 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Dream analysis endpoint
app.post('/api/analyzeDream', dreamAnalysisLimiter, async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Validate input
    const validationResult = DreamAnalysisSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${errors.join(', ')}`,
        requestId,
      });
    }

    const { dreamText, userId } = validationResult.data;
    
    // TODO: Add authentication middleware here
    // Example: const user = await authenticateUser(req.headers.authorization);
    // if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // TODO: Add per-user quota checking here
    // Example: const quotaUsed = await checkUserQuota(userId);
    // if (quotaUsed >= userQuotaLimit) return res.status(429).json({ success: false, error: 'Quota exceeded' });

    // OpenAI API call with structured prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional dream analyst. Analyze the provided dream text and return ONLY a valid JSON object with the following structure:
          {
            "emotions": ["array of detected emotions"],
            "themes": ["array of dream themes"],
            "interpretation": "detailed psychological interpretation",
            "symbols": ["array of key symbols"],
            "confidence": 0.85
          }
          
          Guidelines:
          - Emotions: fear, joy, sadness, anger, anxiety, peace, confusion, etc.
          - Themes: flying, falling, chase, water, home, transformation, etc.
          - Interpretation: 2-3 sentences explaining psychological meaning
          - Symbols: concrete objects, people, places mentioned
          - Confidence: 0.0-1.0 based on clarity and detail of dream
          
          Return ONLY the JSON object, no other text.`
        },
        {
          role: 'user',
          content: `Analyze this dream: ${dreamText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    // Parse OpenAI response
    let analysisData;
    try {
      analysisData = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse dream analysis response',
        requestId,
      });
    }

    // Validate OpenAI response structure
    const responseValidation = z.object({
      emotions: z.array(z.string()),
      themes: z.array(z.string()),
      interpretation: z.string(),
      symbols: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    }).safeParse(analysisData);

    if (!responseValidation.success) {
      console.error('OpenAI response validation failed:', responseValidation.error);
      return res.status(500).json({
        success: false,
        error: 'Invalid dream analysis response format',
        requestId,
      });
    }

    // TODO: Log usage for quota tracking
    // await logDreamAnalysisUsage(userId, requestId);

    // Return successful response
    const response = {
      success: true,
      data: {
        ...responseValidation.data,
        timestamp: Date.now(),
      },
      requestId,
    };

    // Validate final response
    const finalValidation = DreamAnalysisResponseSchema.safeParse(response);
    if (!finalValidation.success) {
      console.error('Final response validation failed:', finalValidation.error);
      return res.status(500).json({
        success: false,
        error: 'Response validation failed',
        requestId,
      });
    }

    res.json(response);

  } catch (error) {
    console.error('Dream analysis error:', error);
    
    // Handle OpenAI API errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        error: 'API quota exceeded. Please try again later.',
        requestId,
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again in a moment.',
        requestId,
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Internal server error during dream analysis',
      requestId,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dream analysis API is healthy',
    timestamp: Date.now(),
    version: '1.0.0',
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: null,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    requestId: null,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dream analysis API running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});

export default app;
