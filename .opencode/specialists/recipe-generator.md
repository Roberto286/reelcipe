# Recipe Generator Specialist

## Overview
- **Tech Stack**: Node.js HTTP server, Python (yt-dlp, ffmpeg), OpenAI Whisper API, GPT-4o-mini, TypeScript
- **Port**: 3000
- **Purpose**: Downloads social media reels, transcribes audio, extracts ingredients via AI, and generates formatted recipes

## Key Files
- `src/index.ts` - Main Node HTTP server entry point
- `src/routes/recipe.ts` - POST /recipe endpoint handler
- `src/services/video.ts` - Video download via Python yt-dlp script
- `src/services/audio.ts` - Audio extraction via Python ffmpeg script
- `src/services/transcription.ts` - OpenAI Whisper transcription service
- `src/services/ai.ts` - GPT-4o-mini ingredient extraction and recipe generation
- `src/utils/backend.ts` - Backend API communication helper
- `video/*.py` - Python scripts for video downloading (yt-dlp)
- `audio/*.py` - Python scripts for audio extraction (ffmpeg)

## Boundaries
### What This Package Owns
- Video downloading from social media platforms
- Audio extraction from video files
- Speech-to-text transcription via OpenAI Whisper
- AI-powered ingredient extraction from transcript
- Recipe generation prompt engineering
- Pipeline orchestration (video → audio → transcript → recipe)

### What This Package Does NOT Own
- User authentication (handled by backend)
- Frontend rendering (handled by apps/frontend)
- Telegram bot (handled by apps/telegram-bot)
- Recipe storage (POSTs to backend API)
- User management

### Shared Package Dependencies
- Imports types from `@reelcipe/shared`: `GeneratedRecipe`, `Ingredient`, `Method`, `Tag`
- Recipe data typed using `GeneratedRecipe` interface before sending to backend
- Tags and ingredients follow shared type definitions

## Conventions
### Code Style
- Async/await for all I/O operations
- Python scripts return JSON to Node via stdout
- Error handling: Fail gracefully with descriptive errors, clean up temp files
- Variables: camelCase for JS/TS, snake_case for Python

### Pipeline Flow
```
downloadVideo (Python yt-dlp)
    ↓
extractAudio (Python ffmpeg)
    ↓
transcribeAudio (OpenAI Whisper API)
    ↓
extractIngredients (GPT-4o-mini)
    ↓
generateRecipe (GPT-4o-mini)
    ↓
POST to backend API
```

### API Patterns
- `POST /recipe` - Main endpoint, receives { url, session_token, user_id }
- Request body: `{ url: string, session_token: string, user_id: string }`
- Response: `{ success: boolean, recipe?: GeneratedRecipe, error?: string }`
- Sends `Authorization: Bearer <session_token>` and `X-User-ID: <user_id>` to backend

### Environment Variables
- `OPENAI_API_KEY` - Required for Whisper and GPT calls
- `RECIPE_GENERATOR_BASE_URL` - This server's base URL
- Backend URLs configured via environment

## Common Issues & Debugging
1. **Video download fails**: Check yt-dlp is installed; verify URL is supported; check network connectivity
2. **Audio extraction fails**: Ensure ffmpeg is installed and in PATH; check video file integrity
3. **Whisper transcription fails**: Verify OPENAI_API_KEY; check audio file has audible content; handle rate limits
4. **AI generates incomplete recipe**: Implement retry logic; check prompt engineering; handle timeout errors
5. **Backend POST fails**: Verify backend is running; check auth token validity; validate GeneratedRecipe format

## Code Review Checklist
- [ ] All temp files cleaned up after processing (video/, audio/ directories)
- [ ] Python script errors caught and reported as JSON with error field
- [ ] OpenAI API calls have timeout handling and retry logic
- [ ] GeneratedRecipe matches shared package interface exactly
- [ ] No hardcoded API keys (use OPENAI_API_KEY env var)
- [ ] Rate limiting on /recipe endpoint to prevent abuse
- [ ] Request validation before processing (url format, required fields)
- [ ] Memory cleanup after processing large video files
- [ ] Auth token passed correctly to backend on recipe save
