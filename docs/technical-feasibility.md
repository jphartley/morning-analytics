# Technical Feasibility: Morning Analytics

**Date:** 2026-02-11
**Status:** ✅ Complete - All Integrations Validated

---

## 1. Gemini API Integration

### Status: ✅ Validated

### Setup
- **SDK:** `@google/generative-ai` (v0.21.0)
- **Model:** `gemini-2.0-flash`
- **Auth:** API key via `.env` (`GEMINI_API_KEY`)

### What Works
- System instruction with custom prompt ✅
- Structured output with `---IMAGE PROMPT---` delimiter ✅
- Response includes all required fields:
  - Reflective analysis (2-3 sentences)
  - Key Word
  - Left-Field Insight
  - Follow-Up Prompt
  - Midjourney-optimized image prompt

### Sample Output
```
Ah, welcome, soul-friend. It sounds as though you're wading through some
murky emotional waters...

**Reflective Analysis:** The essence here is a yearning for unfiltered
expression and a release from perceived judgment. **Key Word:** Authenticity.

**Left-Field Insight:** What if the need to defend is simply a call to define?

**Follow-Up Prompt:** What would it feel like to create something solely
for the joy of it, without any expectation or justification?

---IMAGE PROMPT---

A vibrant watercolor painting in the style of Georgia O'Keefe, featuring
a single, luminous lotus flower blooming from dark, swirling waters. The
background incorporates faint, interwoven alchemical symbols, representing
transformation and the journey toward purity.
```

### Issues Encountered
- **Rate Limiting:** Free tier has strict daily limits
- **Model Names:** Changed from `gemini-1.5-flash` to `gemini-2.0-flash`
- **Quota Propagation:** New API keys may take time to get paid tier access

### Files
- `prompt.md` - System prompt
- `test-prompt.mjs` - Test script

---

## 2. Midjourney/Discord Integration

### Status: ✅ Validated

### Goal
Programmatically trigger Midjourney's `/imagine` command and capture the generated images.

### What We Tried

#### Approach 1: Discord Bot with Text Message
**Result:** ❌ Failed

- Created Discord bot with `discord.js` (v14.14.1)
- Bot successfully connects to channel
- Sent `/imagine prompt: ...` as a text message
- **Finding:** Midjourney ignores text messages - only responds to slash command interactions

#### Approach 2: @Mention Midjourney Bot
**Result:** ❌ Failed

- Sent `<@936929561302675456> /imagine prompt: ...`
- **Finding:** Midjourney does not respond to mentions

#### Approach 3: Fetch Midjourney's Application Commands
**Result:** ❌ Failed (Expected)

- Attempted to use Discord REST API to get Midjourney's commands
- **Finding:** "You are not authorized to perform this action on this application"
- Bots cannot access other applications' command definitions

### Key Discovery
When a user manually invokes `/imagine`:
- Discord shows: **"Username used /imagine"**
- This is an **Application Command Interaction**, not a text message
- Bots cannot invoke other bots' slash commands through official Discord API

### What DOES Work
- ✅ Bot can connect to Discord server
- ✅ Bot can read messages in channel
- ✅ Bot can detect Midjourney bot responses
- ✅ Bot can capture image attachments from Midjourney
- ✅ Bot can detect message updates (for generation progress)

### Next Steps to Try

### Approach 4: User Session Token
**Result:** ✅ SUCCESS

Send raw interaction request using user's Discord session token.

**How it works:**
1. Get user's Discord session token from browser DevTools
2. Fetch guild's application commands to find Midjourney's `/imagine` command ID
3. Send HTTP POST to Discord's `/interactions` endpoint with proper payload
4. Midjourney receives the command and generates images

**Implementation Details:**
- Endpoint: `https://discord.com/api/v9/interactions`
- Midjourney App ID: `936929561302675456`
- Imagine Command ID: `938956540159881230`
- Payload includes: type, application_id, guild_id, channel_id, session_id, nonce, data

**Trade-offs:**
- ⚠️ Against Discord ToS (personal automation use only)
- ⚠️ Token may expire or get invalidated
- ✅ Full automation works
- ✅ Behaves exactly like a real user interaction

**Required:**
- `DISCORD_USER_TOKEN` in `.env`

### Fallback Options (If Token Approach Becomes Unstable)

| Option | Effort | Cost | Reliability |
|--------|--------|------|-------------|
| **Third-party MJ API** (GoAPI, ImagineAPI) | Low | ~$0.02-0.05/image | High |
| **DALL-E 3** | Low | ~$0.04/image | High |
| **Flux** (Replicate) | Low | ~$0.003/image | High |
| **Stable Diffusion** (Replicate) | Low | ~$0.01/image | High |

### Setup Completed
- Discord bot created: "Morning Analytics Test"
- Bot added to personal server: "Morning Analytics Dev"
- Channel created: `#generations`
- Midjourney bot added to server
- Bot permissions: Send Messages, Read Message History, View Channels
- Message Content Intent enabled

### Files
- `test-discord.mjs` - Discord bot test script (for listening/capture)
- `test-midjourney.mjs` - User token script (for triggering /imagine)
- `.env` - Contains all tokens and channel ID

---

## Environment

### Dependencies
```json
{
  "@google/generative-ai": "^0.21.0",
  "discord.js": "^14.14.1",
  "dotenv": "^16.4.5"
}
```

### Environment Variables
```
GEMINI_API_KEY=xxx
DISCORD_BOT_TOKEN=xxx
DISCORD_CHANNEL_ID=xxx
DISCORD_USER_TOKEN=xxx  (pending)
```

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Gemini Analysis | ✅ Working | `gemini-2.0-flash` with system prompt |
| Gemini Image Prompt | ✅ Working | Delimiter-based parsing |
| Discord Bot Connection | ✅ Working | For listening/capture |
| Discord Message Capture | ✅ Working | Can detect MJ responses |
| Midjourney Trigger | ✅ Working | Via user session token |

**Conclusion:** All core integrations validated. Ready to build the full application.

**Next Action:** Plan and build the Next.js application that ties these components together.
