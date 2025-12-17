# Upgrade Notes: Chrome AI API & ai.matey Integration

## Summary

This project has been updated to:
1. Support the latest Chrome AI API (Prompt API, Chrome 138+)
2. Maintain backward compatibility with legacy Chrome AI API (Chrome 129-137)
3. Add support for multiple AI providers via ai.matey
4. Use local ai.matey packages from `../ai.matey`

## Architecture Changes

### AI Provider System

The application now uses a **two-tier provider system**:

#### 1. Chrome AI (Browser Built-in)
- **Type**: `window.ai`
- **Access**: Direct access to browser's native AI
- **API Support**: Both new (`ai.languageModel.create()`) and legacy (`window.ai.languageModel.createTextSession()`)
- **No API Key Required**: Runs locally on-device

#### 2. API Providers (via ai.matey)
- **Type**: `api`
- **Supported Providers**:
  - **OpenAI** - GPT-4, GPT-3.5, etc.
  - **Anthropic** - Claude 3.5, Claude 3, etc.
  - **Google Gemini** - Gemini Pro, Ultra, etc.
  - **Ollama** - Local models (Llama, Mistral, etc.)
- **Requires**: API key (except Ollama)

### Code Flow

```
User selects AI Type in Settings
  ↓
If type === "window.ai":
  → Use browser's native Chrome AI (window.ai or globalThis.ai)
  → Supports both new create() and legacy createTextSession()

If type === "api":
  → Create AI instance via ai-compat.ts
  → Select provider (openai/anthropic/gemini/ollama)
  → Create appropriate backend adapter
  → Wrap with ChromeAILanguageModel for uniform interface
  → All providers expose same languageModel.create() API
```

## Key Files Modified

### 1. `/src/utils/ai-compat.ts` (NEW)
**Purpose**: Compatibility layer that provides window.ai-like interface for all API providers

**Functions**:
- `createBackend()`: Factory function to create appropriate backend adapter
- `AI` class: Wrapper that exposes `languageModel.create()` interface
- Supports: OpenAI, Anthropic, Gemini, Ollama

**Usage**:
```typescript
const ai = new AI({
  provider: 'anthropic',
  endpoint: 'https://api.anthropic.com',
  credentials: { apiKey: 'sk-...' },
  model: 'claude-3-5-sonnet-20241022'
});

const session = await ai.languageModel.create({
  temperature: 0.7,
  topK: 40,
  systemPrompt: 'You are a helpful assistant'
});

const response = await session.prompt('Hello!');
```

### 2. `/src/config.ts`
**Changes**:
- Added `provider` field to `AIBaseConfig`
- Changed `type` from `"openai" | "window.ai"` to `"api" | "window.ai"`
- Default provider is now `ollama` for local-first approach

### 3. `/src/components/SettingsModal.tsx`
**Changes**:
- Updated AI Type selector: `[inactive]`, `API Provider`, `Chrome AI (window.ai)`
- Added Provider dropdown (visible only when type is `api`)
- Shows: OpenAI, Anthropic (Claude), Google Gemini, Ollama (Local)

### 4. `/src/App.tsx`
**Changes**:
- Updated `generateComment()` to use new provider system
- Passes `provider` field to AI constructor
- Maintains backward compatibility with both Chrome AI APIs

### 5. `/src/types/window.d.ts`
**Changes**:
- Added new Chrome AI API types (`create`, `availability`, `params`)
- Added legacy API types (`createTextSession`, `capabilities`)
- Added global `ai` declaration (Chrome 138+)

### 6. `../ai.matey/packages/backend-browser/src/chrome-ai.ts`
**Changes**:
- Updated to support both `create()` and `createTextSession()`
- Checks both `window.ai` and `globalThis.ai`
- Uses `availability()` or `capabilities()` depending on API version
- Supports `systemPrompt` parameter in new API

## Testing Guide

### Test 1: Chrome AI (Native)
1. Open Chrome 138+ or Canary
2. Navigate to Settings → AI
3. Select "Chrome AI (window.ai)"
4. Try generating responses
5. **Expected**: Works with native Chrome AI

### Test 2: Ollama (Local)
1. Start Ollama: `ollama serve`
2. Pull a model: `ollama pull llama3.2`
3. Settings → AI Type: "API Provider"
4. Provider: "Ollama (Local)"
5. Endpoint: `http://localhost:11434`
6. Model: `llama3.2:latest`
7. **Expected**: Generates responses using local model

### Test 3: OpenAI
1. Settings → AI Type: "API Provider"
2. Provider: "OpenAI"
3. Endpoint: `https://api.openai.com/v1`
4. API Key: Your OpenAI key
5. Model: `gpt-4` or `gpt-3.5-turbo`
6. **Expected**: Generates responses via OpenAI API

### Test 4: Anthropic (Claude)
1. Settings → AI Type: "API Provider"
2. Provider: "Anthropic (Claude)"
3. API Key: Your Anthropic key
4. Model: `claude-3-5-sonnet-20241022`
5. **Expected**: Generates responses via Claude API

### Test 5: Provider Switching
1. Generate a response with one provider
2. Switch to different provider in settings
3. Generate another response
4. **Expected**: Both work correctly, no errors

## Backward Compatibility

✅ **Existing localStorage data**: Automatically migrated (adds default `provider` field)
✅ **Chrome 129-137**: Falls back to `createTextSession()` API
✅ **Chrome 138+**: Uses new `create()` API with system prompts
✅ **OpenAI/Ollama users**: Seamlessly works with new provider system

## Breaking Changes

⚠️ **AI Type Values Changed**:
- Old: `type: "openai"`
- New: `type: "api"` + `provider: "openai"`

If you have saved settings, the "openai" type will need to be changed to "api" in settings.

## Dependencies Added

```json
"ai.matey": "file:../ai.matey/packages/ai.matey",
"ai.matey.backend": "file:../ai.matey/packages/backend",
"ai.matey.wrapper": "file:../ai.matey/packages/wrapper"
```

## Next Steps

### Potential Enhancements

1. **Add More Providers**:
   - Groq, Mistral, Cohere, etc.
   - Just add to `createBackend()` switch in `ai-compat.ts`

2. **Provider-Specific Settings**:
   - Different defaults per provider
   - Provider-specific parameter validation

3. **Model Selection UI**:
   - Fetch available models from provider
   - Dropdown with available models

4. **Streaming Support**:
   - Use `session.promptStreaming()` for real-time responses
   - Show tokens as they arrive

5. **Error Handling**:
   - Better error messages per provider
   - Retry logic with fallback providers

## Troubleshooting

### Chrome AI Not Available
- **Check**: Chrome version (138+ required)
- **Check**: Device requirements (GPU/CPU/RAM)
- **Check**: Chrome flags enabled
- **Try**: `chrome://flags/#optimization-guide-on-device-model`

### API Provider Errors
- **Check**: API key is valid
- **Check**: Endpoint URL is correct
- **Check**: Model name matches provider's models
- **Check**: Network connectivity

### Build Errors
- **Solution**: `cd ../ai.matey && npm run build`
- **Solution**: `npm install` in conversation-studio

## References

- [Chrome Prompt API Docs](https://developer.chrome.com/docs/ai/prompt-api)
- [ai.matey GitHub](https://github.com/johnhenry/ai.matey)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Ollama Docs](https://ollama.ai/)
