/**
 * Vapi.ai API Client Wrapper
 */

const axios = require('axios');

class VapiClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Vapi API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseURL = 'https://api.vapi.ai';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a new assistant
   * 
   * @param {Object} config Assistant configuration
   * @returns {Promise<Object>} Created assistant
   */
  async createAssistant(config) {
    try {
      const response = await this.client.post('/assistant', config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create assistant');
    }
  }

  /**
   * Get assistant by ID
   * 
   * @param {string} assistantId Assistant ID
   * @returns {Promise<Object>} Assistant data
   */
  async getAssistant(assistantId) {
    try {
      const response = await this.client.get(`/assistant/${assistantId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get assistant');
    }
  }

  /**
   * Make an outbound call
   * 
   * @param {Object} options Call options
   * @param {string} options.assistantId Assistant ID to use
   * @param {string} options.phoneNumber Phone number to call
   * @param {string} options.phoneNumberId Vapi phone number ID
   * @returns {Promise<Object>} Call data
   */
  async makeCall({ assistantId, phoneNumber, phoneNumberId }) {
    try {
      const response = await this.client.post('/call', {
        assistantId,
        customer: {
          number: phoneNumber
        },
        phoneNumberId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to make call');
    }
  }

  /**
   * Get call by ID
   * 
   * @param {string} callId Call ID
   * @returns {Promise<Object>} Call data
   */
  async getCall(callId) {
    try {
      const response = await this.client.get(`/call/${callId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get call');
    }
  }

  /**
   * List calls
   * 
   * @param {Object} options Query options
   * @returns {Promise<Array>} List of calls
   */
  async listCalls(options = {}) {
    try {
      const response = await this.client.get('/call', { params: options });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list calls');
    }
  }

  /**
   * Update call (e.g., return function result)
   * 
   * @param {string} callId Call ID
   * @param {Object} updates Updates to apply
   * @returns {Promise<Object>} Updated call data
   */
  async updateCall(callId, updates) {
    try {
      const response = await this.client.patch(`/call/${callId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update call');
    }
  }

  /**
   * Handle API errors
   * 
   * @param {Error} error Original error
   * @param {string} message Error message
   * @returns {Error} Enhanced error
   */
  handleError(error, message) {
    if (error.response) {
      // API returned error
      const apiError = new Error(`${message}: ${error.response.data.message || error.response.statusText}`);
      apiError.status = error.response.status;
      apiError.data = error.response.data;
      return apiError;
    } else if (error.request) {
      // No response received
      return new Error(`${message}: No response from Vapi API`);
    } else {
      // Other error
      return new Error(`${message}: ${error.message}`);
    }
  }
}

module.exports = VapiClient;
