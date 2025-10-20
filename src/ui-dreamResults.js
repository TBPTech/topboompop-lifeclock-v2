/**
 * UI component for displaying dream analysis results
 * Provides safe HTML rendering and minimal styling
 */

class DreamResultsUI {
  constructor() {
    this.container = null;
    this.isVisible = false;
  }

  /**
   * Initialize the UI component
   * @param {string|HTMLElement} containerId - Container element ID or element
   */
  init(containerId) {
    if (typeof containerId === 'string') {
      this.container = document.getElementById(containerId);
    } else if (containerId instanceof HTMLElement) {
      this.container = containerId;
    } else {
      throw new Error('Invalid container: must be element ID string or HTMLElement');
    }

    if (!this.container) {
      throw new Error('Container element not found');
    }

    this._addStyles();
  }

  /**
   * Show the dream results UI
   * @param {Object} analysisData - Analysis data to display
   */
  show(analysisData) {
    if (!this.container) {
      throw new Error('UI not initialized. Call init() first.');
    }

    this.container.innerHTML = this._renderAnalysis(analysisData);
    this.container.classList.remove('hidden');
    this.isVisible = true;
  }

  /**
   * Hide the dream results UI
   */
  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
      this.isVisible = false;
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (!this.container) {
      throw new Error('UI not initialized. Call init() first.');
    }

    this.container.innerHTML = this._renderLoading();
    this.container.classList.remove('hidden');
    this.isVisible = true;
  }

  /**
   * Show error state
   * @param {string} errorMessage - Error message to display
   */
  showError(errorMessage) {
    if (!this.container) {
      throw new Error('UI not initialized. Call init() first.');
    }

    this.container.innerHTML = this._renderError(errorMessage);
    this.container.classList.remove('hidden');
    this.isVisible = true;
  }

  /**
   * Render analysis results
   * @param {Object} analysisData - Analysis data
   * @returns {string} HTML string
   */
  _renderAnalysis(analysisData) {
    const { emotions, themes, interpretation, symbols, confidence } = analysisData;

    return `
      <div class="dream-results-container">
        <div class="dream-results-header">
          <h4 class="dream-results-title">Dream Analysis</h4>
          <div class="dream-results-confidence">
            Confidence: ${Math.round((confidence || 0) * 100)}%
          </div>
        </div>
        
        <div class="dream-results-content">
          ${this._renderSection('Emotions', emotions)}
          ${this._renderSection('Themes', themes)}
          ${this._renderSection('Interpretation', interpretation, 'text')}
          ${symbols && symbols.length > 0 ? this._renderSection('Key Symbols', symbols) : ''}
        </div>
        
        <div class="dream-results-footer">
          <small class="dream-results-timestamp">
            Analyzed at ${new Date().toLocaleTimeString()}
          </small>
        </div>
      </div>
    `;
  }

  /**
   * Render a section of the analysis
   * @param {string} title - Section title
   * @param {Array|string} content - Section content
   * @param {string} type - Content type ('array' or 'text')
   * @returns {string} HTML string
   */
  _renderSection(title, content, type = 'array') {
    let contentHtml = '';

    if (type === 'array') {
      if (!Array.isArray(content) || content.length === 0) {
        contentHtml = '<span class="no-data">None detected</span>';
      } else {
        contentHtml = content
          .map(item => `<span class="tag">${this._escapeHtml(item)}</span>`)
          .join(' ');
      }
    } else {
      contentHtml = `<p class="interpretation-text">${this._escapeHtml(content)}</p>`;
    }

    return `
      <div class="dream-results-section">
        <div class="dream-results-section-title">${this._escapeHtml(title)}</div>
        <div class="dream-results-section-content">${contentHtml}</div>
      </div>
    `;
  }

  /**
   * Render loading state
   * @returns {string} HTML string
   */
  _renderLoading() {
    return `
      <div class="dream-results-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Analyzing your dream...</div>
      </div>
    `;
  }

  /**
   * Render error state
   * @param {string} errorMessage - Error message
   * @returns {string} HTML string
   */
  _renderError(errorMessage) {
    return `
      <div class="dream-results-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${this._escapeHtml(errorMessage)}</div>
        <div class="error-suggestion">
          Please try again or check your connection.
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  _escapeHtml(text) {
    if (typeof text !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add minimal CSS styles for the component
   */
  _addStyles() {
    if (document.getElementById('dream-results-styles')) {
      return; // Styles already added
    }

    const style = document.createElement('style');
    style.id = 'dream-results-styles';
    style.textContent = `
      .dream-results-container {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 15px;
        margin-top: 15px;
        font-family: 'Poppins', sans-serif;
        color: white;
      }

      .dream-results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dream-results-title {
        margin: 0;
        color: #a6b0ff;
        font-size: 1em;
        font-weight: 600;
      }

      .dream-results-confidence {
        background: rgba(107, 140, 255, 0.2);
        color: #6b8cff;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 500;
      }

      .dream-results-content {
        margin-bottom: 15px;
      }

      .dream-results-section {
        margin-bottom: 12px;
      }

      .dream-results-section:last-child {
        margin-bottom: 0;
      }

      .dream-results-section-title {
        color: #6b8cff;
        font-weight: 600;
        margin-bottom: 5px;
        font-size: 0.9em;
      }

      .dream-results-section-content {
        color: rgba(255, 255, 255, 0.9);
        padding-left: 10px;
      }

      .dream-results-section-content .tag {
        display: inline-block;
        background: rgba(107, 140, 255, 0.2);
        color: #a6b0ff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8em;
        margin-right: 6px;
        margin-bottom: 4px;
      }

      .interpretation-text {
        margin: 0;
        line-height: 1.4;
        font-size: 0.85em;
      }

      .no-data {
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
        font-size: 0.85em;
      }

      .dream-results-footer {
        text-align: center;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dream-results-timestamp {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.75em;
      }

      .dream-results-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: #a6b0ff;
        padding: 20px;
      }

      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(107, 140, 255, 0.3);
        border-top: 2px solid #6b8cff;
        border-radius: 50%;
        animation: dream-spin 1s linear infinite;
      }

      @keyframes dream-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-text {
        font-size: 0.9em;
      }

      .dream-results-error {
        text-align: center;
        padding: 20px;
        color: #ef4444;
      }

      .error-icon {
        font-size: 1.5em;
        margin-bottom: 10px;
      }

      .error-message {
        font-weight: 600;
        margin-bottom: 8px;
      }

      .error-suggestion {
        font-size: 0.85em;
        color: rgba(239, 68, 68, 0.8);
      }

      .dream-results-container.hidden {
        display: none;
      }

      /* Responsive adjustments */
      @media (max-width: 320px) {
        .dream-results-container {
          padding: 12px;
        }
        
        .dream-results-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        
        .dream-results-section-content .tag {
          font-size: 0.75em;
          padding: 1px 4px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Get current visibility state
   * @returns {boolean} True if visible
   */
  isVisible() {
    return this.isVisible;
  }

  /**
   * Clear the container
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container.classList.add('hidden');
      this.isVisible = false;
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    this.clear();
    
    // Remove styles if this was the last instance
    const style = document.getElementById('dream-results-styles');
    if (style) {
      style.remove();
    }
    
    this.container = null;
  }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DreamResultsUI;
} else if (typeof window !== 'undefined') {
  window.DreamResultsUI = DreamResultsUI;
}
