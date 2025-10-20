/**
 * Journal API client for dream analysis
 * Handles communication with the dream analysis API
 */

class JournalAPI {
  constructor() {
    // API configuration
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://your-vercel-app.vercel.app' 
      : 'http://localhost:3000';
    
    this.endpoints = {
      analyzeDream: '/api/analyzeDream',
      health: '/api/health'
    };
    
    // Request timeout (30 seconds)
    this.timeout = 30000;
  }

  /**
   * Analyze a dream using the API
   * @param {string} dreamText - The dream text to analyze
   * @param {string} userId - Optional user ID for quota tracking
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeDream(dreamText, userId = null) {
    try {
      // Validate input
      if (!dreamText || typeof dreamText !== 'string') {
        throw new Error('Dream text is required and must be a string');
      }

      if (dreamText.length < 20) {
        throw new Error('Dream text must be at least 20 characters long');
      }

      if (dreamText.length > 2000) {
        throw new Error('Dream text cannot exceed 2000 characters');
      }

      // Prepare request payload
      const payload = {
        dreamText: dreamText.trim(),
        timestamp: Date.now()
      };

      // Add userId if provided (for future quota tracking)
      if (userId) {
        payload.userId = userId;
      }

      // Make API request
      const response = await this._makeRequest(this.endpoints.analyzeDream, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication header when auth is implemented
          // 'Authorization': `Bearer ${this.getAuthToken()}`
          ...(userId && { 'X-User-ID': userId })
        },
        body: JSON.stringify(payload)
      });

      // Validate response structure
      if (!response.success) {
        throw new Error(response.error || 'Dream analysis failed');
      }

      if (!response.data) {
        throw new Error('Invalid response: missing analysis data');
      }

      // Validate analysis data structure
      this._validateAnalysisData(response.data);

      return {
        success: true,
        data: response.data,
        requestId: response.requestId
      };

    } catch (error) {
      console.error('Dream analysis error:', error);
      
      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to dream analysis service');
      }
      
      if (error.message.includes('429') || error.message.includes('quota')) {
        throw new Error('Rate limit exceeded. Please try again in a few minutes.');
      }
      
      if (error.message.includes('401')) {
        throw new Error('Authentication required. Please log in.');
      }
      
      if (error.message.includes('500')) {
        throw new Error('Server error. Please try again later.');
      }

      // Re-throw with original message for validation errors
      throw error;
    }
  }

  /**
   * Check API health
   * @returns {Promise<boolean>} True if API is healthy
   */
  async checkHealth() {
    try {
      const response = await this._makeRequest(this.endpoints.health, {
        method: 'GET'
      });
      
      return response.success === true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Make HTTP request with error handling and timeout
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async _makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        // Add credentials for CORS
        credentials: 'include'
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse error response, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // Parse JSON response
      const data = await response.json();
      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      
      throw error;
    }
  }

  /**
   * Validate analysis data structure
   * @param {Object} data - Analysis data to validate
   */
  _validateAnalysisData(data) {
    const requiredFields = ['emotions', 'themes', 'interpretation', 'symbols', 'confidence'];
    
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Invalid response: missing ${field}`);
      }
    }

    // Validate field types
    if (!Array.isArray(data.emotions)) {
      throw new Error('Invalid response: emotions must be an array');
    }

    if (!Array.isArray(data.themes)) {
      throw new Error('Invalid response: themes must be an array');
    }

    if (!Array.isArray(data.symbols)) {
      throw new Error('Invalid response: symbols must be an array');
    }

    if (typeof data.interpretation !== 'string') {
      throw new Error('Invalid response: interpretation must be a string');
    }

    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
      throw new Error('Invalid response: confidence must be a number between 0 and 1');
    }
  }

  /**
   * Get authentication token (placeholder for future auth implementation)
   * @returns {string|null} Auth token
   */
  getAuthToken() {
    // TODO: Implement authentication
    // Example: return localStorage.getItem('authToken');
    return null;
  }

  /**
   * Set authentication token (placeholder for future auth implementation)
   * @param {string} token - Auth token
   */
  setAuthToken(token) {
    // TODO: Implement authentication
    // Example: localStorage.setItem('authToken', token);
  }
}

// Render helper integration for Chrome extension
class JournalRenderer {
  constructor() {
    this.api = new JournalAPI();
  }

  /**
   * Render dream analysis results in the UI
   * @param {Object} analysis - Analysis results
   * @param {HTMLElement} container - Container element to render into
   */
  renderDreamAnalysis(analysis, container) {
    if (!analysis || !analysis.data) {
      this.renderError('No analysis data available', container);
      return;
    }

    const { emotions, themes, interpretation, symbols, confidence } = analysis.data;

    const html = `
      <div class="dream-analysis-results">
        <div class="analysis-section">
          <div class="section-title">Emotions</div>
          <div class="section-content">${this._formatArray(emotions)}</div>
        </div>
        
        <div class="analysis-section">
          <div class="section-title">Themes</div>
          <div class="section-content">${this._formatArray(themes)}</div>
        </div>
        
        <div class="analysis-section">
          <div class="section-title">Interpretation</div>
          <div class="section-content">${this._escapeHtml(interpretation)}</div>
        </div>
        
        ${symbols && symbols.length > 0 ? `
        <div class="analysis-section">
          <div class="section-title">Key Symbols</div>
          <div class="section-content">${this._formatArray(symbols)}</div>
        </div>
        ` : ''}
        
        <div class="analysis-section">
          <div class="section-title">Confidence</div>
          <div class="section-content">${Math.round(confidence * 100)}%</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Render loading state
   * @param {HTMLElement} container - Container element
   */
  renderLoading(container) {
    container.innerHTML = `
      <div class="dream-analysis-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Analyzing your dream...</div>
      </div>
    `;
  }

  /**
   * Render error state
   * @param {string} message - Error message
   * @param {HTMLElement} container - Container element
   */
  renderError(message, container) {
    container.innerHTML = `
      <div class="dream-analysis-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${this._escapeHtml(message)}</div>
      </div>
    `;
  }

  /**
   * Format array for display
   * @param {Array} array - Array to format
   * @returns {string} Formatted string
   */
  _formatArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return 'None detected';
    }
    return array.map(item => this._escapeHtml(item)).join(', ');
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { JournalAPI, JournalRenderer };
} else if (typeof window !== 'undefined') {
  window.JournalAPI = JournalAPI;
  window.JournalRenderer = JournalRenderer;
}
