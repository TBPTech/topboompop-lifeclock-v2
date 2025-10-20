# TOPBOOMPOP Life Clock v2.0

A Chrome extension that visualizes your lifetime and structures your daily sessions with mindful time segmentation, now including AI-powered dream analysis.

## Features

### 🕒 Life Clock
- Visualize your lifetime progress with animated countdown
- Customizable 90-year lifespan assumption
- Real-time updates showing years, months, days, hours, minutes, and seconds remaining

### ⏱️ Segmented Timer
- Productivity timer with work/break segments
- Background notifications for segment transitions
- Pause/resume functionality
- Progress tracking

### 📝 Daily Journal
- Mood tracking with 5 emotion categories
- Daily goals and gratitude recording
- Date navigation to review past entries
- Data persistence across sessions

### 🧠 Dream Analysis (NEW!)
- AI-powered dream interpretation using OpenAI GPT
- Emotion and theme detection
- Symbol extraction and psychological insights
- API integration with fallback to local analysis

## Installation

### Chrome Extension
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder
5. The extension will appear in your Chrome toolbar

### API Backend (Optional)
For full dream analysis functionality, deploy the API backend:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file with:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   NODE_ENV=production
   ```

3. **Deploy to Vercel:**
   ```bash
   npm run deploy
   ```

4. **Update API URL:**
   In `popup.js`, update the `API_BASE_URL` with your Vercel deployment URL.

## API Endpoints

### POST `/api/analyzeDream`
Analyzes dream text using OpenAI GPT.

**Request:**
```json
{
  "dreamText": "I was flying over a beautiful landscape...",
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emotions": ["joy", "peace"],
    "themes": ["flying", "freedom"],
    "interpretation": "This dream suggests feelings of liberation and positive emotions...",
    "symbols": ["landscape", "sky", "flight"],
    "confidence": 0.85,
    "timestamp": 1703123456789
  },
  "requestId": "req_1703123456789_abc123"
}
```

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Dream analysis API is healthy",
  "timestamp": 1703123456789,
  "version": "1.0.0"
}
```

## Development

### Local Development
1. **Start the API server:**
   ```bash
   npm run dev
   ```

2. **Load the Chrome extension:**
   - Follow the Chrome extension installation steps above
   - Update `API_BASE_URL` in `popup.js` to `http://localhost:3000`

### File Structure
```
topboompop-lifeclock-v1.1/
├── api/
│   └── analyzeDream.js          # Express API server
├── src/
│   ├── journal.js               # API client library
│   └── ui-dreamResults.js       # UI component for results
├── popup.html                   # Chrome extension popup
├── popup.js                     # Extension logic
├── manifest.json                # Chrome extension manifest
├── styles.css                   # Extension styles
├── package.json                 # Node.js dependencies
├── vercel.json                  # Vercel deployment config
└── README.md                    # This file
```

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Required for dream analysis API
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Rate Limiting
- 10 requests per 15 minutes per IP address
- Configurable in `api/analyzeDream.js`

### CORS
- Configured for Chrome extensions and localhost
- Update origins in `api/analyzeDream.js` for production

## Security Features

### Input Validation
- Dream text length validation (20-2000 characters)
- JSON schema validation using Zod
- XSS prevention with HTML escaping

### Error Handling
- Comprehensive error messages
- Graceful fallback to local analysis
- Request timeout handling

### Rate Limiting
- IP-based rate limiting
- Configurable quotas for future user-based limits

## Future Enhancements

### Authentication
- User accounts and JWT authentication
- Per-user quota management
- Dream history and analytics

### Enhanced Analysis
- More sophisticated dream interpretation
- Pattern recognition across multiple dreams
- Integration with mood tracking

### Analytics
- Usage statistics
- Performance monitoring
- User engagement metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-username/topboompop-lifeclock/issues)
- Email: support@topboompop.com
- Website: [TOPBOOMPOP.COM](https://www.topboompop.com)

---

**Stay consistent. Time = Legacy.** ⏰
