# Voice Calling Skill

Make and manage AI-powered phone calls using Vapi.ai for appointment booking, information gathering, and autonomous conversations.

## Description

This skill integrates Vapi.ai's voice AI platform to enable OpenClaw to make and receive phone calls. It supports:
- 📞 Outbound calls (booking appointments, asking questions)
- 📥 Inbound call handling
- 🌏 Japanese language support (and 100+ other languages)
- 📊 Structured data extraction from conversations
- 📝 Full transcripts and call recordings
- 🔧 Custom conversation templates

Perfect for automating routine calls like booking doctor appointments, checking business hours, or gathering information over the phone.

## Installation

```bash
cd skills/voice-calling
npm install
```

## Setup

1. **Get Vapi.ai API Key:**
   - Sign up at https://dashboard.vapi.ai
   - Copy your API key from the dashboard

2. **Configure Phone Number:**
   - Create a phone number in Vapi dashboard (free US number available)
   - For Japan: integrate Twilio and get a Japanese number

3. **Set up Webhook:**
   - Deploy webhook server (see `lib/webhook-server.js`)
   - Use Railway, Cloudflare Workers, or ngrok for development
   - Update webhook URL in Vapi dashboard

4. **Environment Variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials:
   # VAPI_API_KEY=your_api_key_here
   # VAPI_PHONE_NUMBER_ID=your_phone_number_id
   # WEBHOOK_URL=https://your-server.com/vapi/webhook
   # WEBHOOK_SECRET=random_secret_string
   ```

## Usage

### Make an Outbound Call

**Basic call:**
```
call make +81-90-1234-5678
```

**Using a template:**
```
call make +81-90-1234-5678 --template clinic-blood-test --patient "Yamada Taro" --date "2026-02-15"
```

**From code:**
```javascript
const result = await skills.voiceCalling.makeCall({
  phoneNumber: '+81-90-1234-5678',
  template: 'clinic-blood-test',
  context: {
    patientName: 'Yamada Taro',
    clinicName: 'Miyashita Clinic',
    preferredDate: '2026-02-15',
    purpose: 'blood test'
  }
});

console.log('Call ID:', result.callId);
```

### Check Call Status

```
call status <callId>
```

Returns:
- Current status (queued, ringing, in-progress, ended)
- Duration
- Cost
- Transcript (if completed)
- Structured data extracted

### Get Call Transcript

```
call transcript <callId>
```

Returns full conversation transcript with timestamps.

### List Recent Calls

```
call list [--limit 10]
```

## Templates

Templates define the conversation flow and behavior for specific use cases.

### Available Templates

1. **clinic-blood-test** - Book blood test appointments (Japanese)
2. **information-gathering** - General information gathering
3. **appointment-booking** - Generic appointment booking
4. **business-hours** - Check business operating hours

### Creating Custom Templates

```json
{
  "name": "My Custom Template",
  "transcriber": {
    "provider": "deepgram",
    "language": "ja"
  },
  "model": {
    "provider": "anthropic",
    "model": "claude-3-haiku-20240307",
    "messages": [{
      "role": "system",
      "content": "Your system prompt here with {{variables}}"
    }]
  },
  "voice": {
    "provider": "azure",
    "voiceId": "ja-JP-NanamiNeural"
  },
  "firstMessage": "Opening greeting",
  "analysisPlan": {
    "structuredDataPlan": {
      "enabled": true,
      "schema": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean" },
          "data": { "type": "string" }
        }
      }
    }
  }
}
```

Save to `templates/my-custom-template.json`

## API

### `makeCall(options)`

Make an outbound call.

**Parameters:**
- `phoneNumber` (string, required): Phone number to call (E.164 format)
- `template` (string, optional): Template name (default: 'default')
- `context` (object, optional): Variables to inject into template
- `maxDuration` (number, optional): Max call duration in seconds (default: 600)

**Returns:**
```javascript
{
  callId: 'call-abc123',
  status: 'initiated',
  assistantId: 'assistant-xyz789'
}
```

### `getCallStatus(callId)`

Get current status of a call.

**Returns:**
```javascript
{
  callId: 'call-abc123',
  status: 'ended',
  duration: 327,
  cost: 0.82,
  endedReason: 'assistant-ended-call'
}
```

### `getTranscript(callId)`

Get full transcript of a completed call.

**Returns:**
```javascript
{
  callId: 'call-abc123',
  transcript: '...',
  messages: [
    { role: 'assistant', message: 'もしもし...', time: 0 },
    { role: 'user', message: 'はい...', time: 2.3 }
  ]
}
```

### `getStructuredData(callId)`

Get extracted structured data from a call.

**Returns:**
```javascript
{
  callId: 'call-abc123',
  structuredData: {
    appointmentConfirmed: true,
    date: '2026-02-15',
    time: '10:00',
    notes: '空腹での来院が必要'
  }
}
```

## Configuration

### Cost Optimization

To minimize costs, configure:

```javascript
// Use cheapest providers
const costOptimizedConfig = {
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2-general' // $0.0043/min
  },
  model: {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307', // Cheapest Claude
    maxTokens: 500 // Limit response length
  },
  voice: {
    provider: 'azure', // $0.015/min vs ElevenLabs $0.18/min
    voiceId: 'ja-JP-NanamiNeural'
  }
};
```

**Estimated cost:** ~$0.05-0.10 per minute

### Language Support

Change `transcriber.language` and `voice.voiceId`:

**Japanese:**
```json
{
  "transcriber": { "language": "ja" },
  "voice": { "voiceId": "ja-JP-NanamiNeural" }
}
```

**English:**
```json
{
  "transcriber": { "language": "en" },
  "voice": { "voiceId": "en-US-JennyNeural" }
}
```

Supported languages: 100+ including Japanese, English, Spanish, Mandarin, French, German, etc.

## Webhooks

The skill runs a webhook server to receive real-time events from Vapi:

- `transcript`: Real-time conversation updates
- `function-call`: When assistant needs to call a tool
- `end-of-call-report`: Complete call summary with costs, transcript, structured data
- `status-update`: Call status changes

Events are automatically processed and stored for later retrieval.

## Costs

**Estimated per-minute cost breakdown:**

| Component | Provider | Cost/min |
|-----------|----------|----------|
| Telephony | Twilio | $0.0085 |
| STT | Deepgram Nova | $0.0043 |
| LLM | Claude Haiku | ~$0.01-0.03 |
| TTS | Azure | $0.015 |
| Vapi Platform | Vapi | ~$0.01-0.02 |
| **Total** | | **~$0.05-0.10** |

**Example costs:**
- 5-minute call: $0.25-0.50
- 10 calls × 5 min: $2.50-5.00/month ✅ Within budget

## Limitations

1. **Japanese business acceptance:** Some businesses may not accept AI callers
2. **Complex IVR systems:** May struggle with complicated phone menus
3. **Voicemail:** Detection is not 100% accurate
4. **Latency:** 600ms+ response time may feel slightly delayed
5. **Background noise:** Can affect transcription accuracy

## Troubleshooting

**Call not connecting:**
- Check phone number format (must be E.164: +81-90-1234-5678)
- Verify Vapi phone number is active
- Check account balance

**Poor Japanese recognition:**
- Try different STT provider (AssemblyAI vs Deepgram)
- Increase `confidenceThreshold`
- Add custom vocabulary/wordBoost

**High costs:**
- Use cheaper model (Haiku instead of Opus)
- Shorten system prompts
- Reduce maxTokens
- Use Azure instead of ElevenLabs for TTS

**Webhook not receiving events:**
- Check webhook URL is publicly accessible (HTTPS)
- Verify webhook signature
- Check server logs

## Examples

See `examples/` directory for:
- `clinic-appointment.js` - Book a doctor appointment
- `business-info.js` - Call a business to check hours
- `simple-call.js` - Minimal example

## Development

**Run webhook server locally:**
```bash
npm run dev
```

**Test with ngrok:**
```bash
ngrok http 3000
# Update WEBHOOK_URL to ngrok URL
```

**Run tests:**
```bash
npm test
```

## Resources

- Vapi.ai Documentation: https://docs.vapi.ai
- Vapi.ai Dashboard: https://dashboard.vapi.ai
- Community Discord: https://discord.gg/vapi
- Appointment Booking Example: https://docs.vapi.ai/assistants/examples/appointment-scheduling

## Support

For issues specific to this skill, check logs in `logs/voice-calling.log`

For Vapi.ai platform issues, contact support@vapi.ai

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-11  
**Status:** Beta - Test thoroughly before production use
