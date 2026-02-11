/**
 * Voice Calling Skill for OpenClaw
 * 
 * Make and manage AI-powered phone calls using Vapi.ai
 */

const VapiClient = require('./lib/vapi-client');
const WebhookServer = require('./lib/webhook-server');
const fs = require('fs').promises;
const path = require('path');

class VoiceCallingSkill {
  constructor() {
    this.vapi = new VapiClient(process.env.VAPI_API_KEY);
    this.webhook = null;
    this.activeCallsMap = new Map();
    this.callResults = new Map();
  }

  /**
   * Initialize the skill
   */
  async initialize() {
    console.log('🎙️  Initializing Voice Calling Skill...');
    
    // Start webhook server if in server mode
    if (process.env.WEBHOOK_URL && !process.env.WEBHOOK_URL.includes('localhost')) {
      this.webhook = new WebhookServer(parseInt(process.env.WEBHOOK_PORT || 3000));
      this.webhook.on('end-of-call-report', this.handleCallComplete.bind(this));
      this.webhook.on('function-call', this.handleFunctionCall.bind(this));
      this.webhook.start();
      console.log('✅ Webhook server started');
    }
    
    console.log('✅ Voice Calling Skill initialized');
  }

  /**
   * Make an outbound phone call
   * 
   * @param {Object} options Call options
   * @param {string} options.phoneNumber Phone number to call (E.164 format)
   * @param {string} options.template Template name (default: 'default')
   * @param {Object} options.context Variables to inject into template
   * @param {number} options.maxDuration Max call duration in seconds
   * @returns {Promise<Object>} Call information
   */
  async makeCall({ phoneNumber, template = 'default', context = {}, maxDuration = 600 }) {
    try {
      console.log(`📞 Initiating call to ${phoneNumber} with template: ${template}`);
      
      // Validate phone number
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format. Use E.164 format: +81-90-1234-5678');
      }
      
      // Load and configure assistant
      const assistantConfig = await this.loadTemplate(template, context);
      assistantConfig.maxDurationSeconds = maxDuration;
      
      // Create assistant
      const assistant = await this.vapi.createAssistant(assistantConfig);
      console.log(`✅ Created assistant: ${assistant.id}`);
      
      // Initiate call
      const call = await this.vapi.makeCall({
        assistantId: assistant.id,
        phoneNumber,
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID
      });
      
      // Track call
      this.activeCallsMap.set(call.id, {
        phoneNumber,
        template,
        context,
        assistantId: assistant.id,
        startTime: Date.now(),
        status: 'initiated'
      });
      
      console.log(`✅ Call initiated: ${call.id}`);
      
      return {
        callId: call.id,
        status: 'initiated',
        assistantId: assistant.id
      };
    } catch (error) {
      console.error('❌ Error making call:', error);
      throw error;
    }
  }

  /**
   * Get call status
   * 
   * @param {string} callId Call ID
   * @returns {Promise<Object>} Call status
   */
  async getCallStatus(callId) {
    try {
      const call = await this.vapi.getCall(callId);
      const tracked = this.activeCallsMap.get(callId);
      
      return {
        callId: call.id,
        status: call.status,
        duration: call.endedAt ? 
          Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000) : 
          null,
        cost: call.cost,
        endedReason: call.endedReason,
        template: tracked?.template,
        phoneNumber: tracked?.phoneNumber
      };
    } catch (error) {
      console.error(`❌ Error getting call status for ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Get call transcript
   * 
   * @param {string} callId Call ID
   * @returns {Promise<Object>} Transcript data
   */
  async getTranscript(callId) {
    try {
      const call = await this.vapi.getCall(callId);
      
      if (!call.artifact || !call.artifact.transcript) {
        throw new Error('Transcript not available yet');
      }
      
      return {
        callId: call.id,
        transcript: call.artifact.transcript,
        messages: call.artifact.messages || []
      };
    } catch (error) {
      console.error(`❌ Error getting transcript for ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Get structured data extracted from call
   * 
   * @param {string} callId Call ID
   * @returns {Promise<Object>} Structured data
   */
  async getStructuredData(callId) {
    try {
      const call = await this.vapi.getCall(callId);
      
      if (!call.analysis || !call.analysis.structuredData) {
        throw new Error('Structured data not available');
      }
      
      return {
        callId: call.id,
        structuredData: call.analysis.structuredData,
        summary: call.analysis.summary
      };
    } catch (error) {
      console.error(`❌ Error getting structured data for ${callId}:`, error);
      throw error;
    }
  }

  /**
   * Load template and inject context variables
   * 
   * @param {string} templateName Template name
   * @param {Object} context Variables to inject
   * @returns {Promise<Object>} Template configuration
   */
  async loadTemplate(templateName, context = {}) {
    try {
      const templatePath = path.join(__dirname, 'templates', `${templateName}.json`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = JSON.parse(templateContent);
      
      // Replace variables in template
      return this.replaceVariables(template, context);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Template not found: ${templateName}`);
      }
      throw error;
    }
  }

  /**
   * Replace {{variables}} in template with context values
   * 
   * @param {any} obj Template object
   * @param {Object} context Context variables
   * @returns {any} Template with variables replaced
   */
  replaceVariables(obj, context) {
    if (typeof obj === 'string') {
      // Replace {{variable}} syntax
      return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] !== undefined ? context[key] : match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.replaceVariables(item, context));
    } else if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariables(value, context);
      }
      return result;
    }
    return obj;
  }

  /**
   * Validate phone number format
   * 
   * @param {string} phoneNumber Phone number
   * @returns {boolean} Valid or not
   */
  isValidPhoneNumber(phoneNumber) {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber.replace(/[\s-]/g, ''));
  }

  /**
   * Handle call completion webhook event
   * 
   * @param {Object} event Webhook event
   */
  async handleCallComplete(event) {
    const callId = event.call.id;
    console.log(`📊 Call completed: ${callId}`);
    
    // Store results
    this.callResults.set(callId, {
      transcript: event.artifact?.transcript,
      structuredData: event.analysis?.structuredData,
      summary: event.analysis?.summary,
      duration: event.call.duration,
      cost: event.call.cost,
      endedReason: event.call.endedReason
    });
    
    // Update tracking
    if (this.activeCallsMap.has(callId)) {
      const tracked = this.activeCallsMap.get(callId);
      tracked.status = 'completed';
      tracked.endTime = Date.now();
    }
    
    console.log(`✅ Call ${callId} results stored`);
  }

  /**
   * Handle function call from assistant
   * 
   * @param {Object} event Function call event
   */
  async handleFunctionCall(event) {
    const { functionCall, call } = event;
    console.log(`🔧 Function call: ${functionCall.name}`);
    
    // Execute function and return result
    // This is where you'd implement tool integrations
    try {
      const result = await this.executeFunction(functionCall.name, functionCall.parameters);
      
      // Return result to Vapi
      await this.vapi.updateCall(call.id, {
        functionReturn: result
      });
    } catch (error) {
      console.error('❌ Error executing function:', error);
    }
  }

  /**
   * Execute a function called by the assistant
   * 
   * @param {string} functionName Function name
   * @param {Object} parameters Function parameters
   * @returns {Promise<any>} Function result
   */
  async executeFunction(functionName, parameters) {
    // Implement your function handlers here
    // Example:
    switch (functionName) {
      case 'checkAvailability':
        // Call external API to check appointment availability
        return { available: true, slots: ['10:00', '14:00', '16:00'] };
      
      case 'confirmAppointment':
        // Confirm appointment in your system
        return { confirmed: true, confirmationNumber: 'APT-12345' };
      
      default:
        console.warn(`Unknown function: ${functionName}`);
        return { error: 'Function not found' };
    }
  }
}

// Export for use as a skill
module.exports = VoiceCallingSkill;

// If run directly, start the webhook server
if (require.main === module) {
  require('dotenv').config();
  const skill = new VoiceCallingSkill();
  skill.initialize();
}
