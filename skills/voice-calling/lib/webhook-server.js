/**
 * Webhook Server for Vapi.ai Events
 */

const express = require('express');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class WebhookServer extends EventEmitter {
  constructor(port = 3000) {
    super();
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Add request logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup webhook routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Main Vapi webhook endpoint
    this.app.post('/vapi/webhook', async (req, res) => {
      try {
        // Verify webhook signature (security)
        if (process.env.WEBHOOK_SECRET) {
          const signature = req.headers['x-vapi-signature'];
          if (!this.verifySignature(req.body, signature)) {
            console.error('❌ Invalid webhook signature');
            return res.status(401).send('Invalid signature');
          }
        }

        // Process event
        await this.handleEvent(req.body);
        
        // Always respond quickly
        res.sendStatus(200);
      } catch (error) {
        console.error('❌ Error handling webhook:', error);
        res.sendStatus(500);
      }
    });

    // Fallback for unknown routes
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  /**
   * Verify webhook signature
   * 
   * @param {Object} body Request body
   * @param {string} signature Signature from header
   * @returns {boolean} Valid or not
   */
  verifySignature(body, signature) {
    if (!process.env.WEBHOOK_SECRET || !signature) {
      return false;
    }

    const computed = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  }

  /**
   * Handle incoming webhook event
   * 
   * @param {Object} event Webhook event
   */
  async handleEvent(event) {
    const eventType = event.message?.type;
    
    if (!eventType) {
      console.warn('⚠️  Received event without type:', event);
      return;
    }

    console.log(`📨 Webhook event: ${eventType}`);

    // Emit event for listeners
    this.emit(eventType, event);
    this.emit('*', event); // Wildcard listener

    // Log specific important events
    switch (eventType) {
      case 'transcript':
        const { role, message } = event.message;
        console.log(`💬 ${role}: ${message}`);
        break;
      
      case 'function-call':
        const { functionCall } = event.message;
        console.log(`🔧 Function: ${functionCall.name}`, functionCall.parameters);
        break;
      
      case 'end-of-call-report':
        const { call } = event.message;
        console.log(`📊 Call ended: ${call.id} (${call.endedReason})`);
        console.log(`   Duration: ${call.duration}s, Cost: $${call.cost}`);
        break;
      
      case 'status-update':
        const status = event.message.status;
        console.log(`📞 Status: ${status}`);
        break;
    }
  }

  /**
   * Start the webhook server
   */
  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🚀 Webhook server listening on port ${this.port}`);
      console.log(`   Endpoint: http://localhost:${this.port}/vapi/webhook`);
    });
  }

  /**
   * Stop the webhook server
   */
  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('🛑 Webhook server stopped');
      });
    }
  }
}

module.exports = WebhookServer;

// If run directly, start standalone
if (require.main === module) {
  require('dotenv').config();
  const server = new WebhookServer(process.env.WEBHOOK_PORT || 3000);
  
  // Log all events
  server.on('*', (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
  });
  
  server.start();
}
