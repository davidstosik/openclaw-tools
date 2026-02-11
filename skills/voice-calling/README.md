# Voice Calling Skill - Quick Start

AI-powered phone calling for OpenClaw using Vapi.ai

## 🚀 Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Vapi API key
   ```

3. **Test the webhook server:**
   ```bash
   npm run webhook
   ```

4. **Make a test call:**
   ```bash
   node examples/clinic-appointment.js
   ```

## 📚 Full Documentation

See [SKILL.md](./SKILL.md) for complete documentation.

## 🎯 Use Cases

- ✅ **Appointment Booking** - Book doctor appointments, reservations
- ✅ **Information Gathering** - Check business hours, availability
- ✅ **Customer Service** - Answer common questions (inbound)
- ⚠️ **Complex Conversations** - Multi-turn negotiations (advanced)

## 💰 Estimated Costs

- **Per-minute:** ~$0.05-0.15
- **5-minute call:** ~$0.25-0.75
- **10 calls/month:** ~$2.50-7.50

## 🇯🇵 Japanese Support

Fully supported! Just use Japanese templates (see `templates/clinic-blood-test.json`).

## 🛠️ Development

```bash
# Start webhook server with auto-reload
npm run dev

# Run tests
npm test
```

## 📝 Templates

Available templates:
- `clinic-blood-test` - Book blood test appointment (Japanese)
- `information-gathering` - General info gathering (Japanese)

Create your own in `templates/`!

## ⚠️ Important Notes

1. **Test thoroughly** before calling real businesses
2. **Monitor costs** closely, especially during testing
3. **Respect privacy** - some businesses may not accept AI callers
4. **Use Japanese numbers** - Requires Twilio integration for Japan

## 🆘 Troubleshooting

**Call not connecting?**
- Check phone number format (+81-90-xxxx-xxxx)
- Verify Vapi API key is correct
- Check account balance

**High costs?**
- Use cheaper models (Haiku instead of Opus)
- Shorten system prompts
- Use Azure TTS instead of ElevenLabs

**Poor Japanese quality?**
- Try different TTS voices
- Adjust speech speed
- Test with different transcription providers

## 📖 Resources

- [Vapi.ai Documentation](https://docs.vapi.ai)
- [Full Research Report](../../projects/voice-calling-agent.md)
- [SKILL.md](./SKILL.md) - Complete API documentation

---

**Version:** 1.0.0 (Beta)  
**Last Updated:** 2026-02-11
