/**
 * Backend Factory
 * Creates appropriate ai.matey backend adapters based on provider configuration
 */

import { OpenAIBackendAdapter } from 'ai.matey.backend/openai';
import { AnthropicBackendAdapter } from 'ai.matey.backend/anthropic';
import { GeminiBackendAdapter } from 'ai.matey.backend/gemini';
import { OllamaBackendAdapter } from 'ai.matey.backend/ollama';
import type { BackendAdapter } from 'ai.matey.types';
import type { AIBaseConfig } from '../config';

/**
 * Get default endpoint for a provider
 *
 * Note: Each adapter has its own URL structure:
 * - OpenAI: baseURL includes /v1
 * - Anthropic: baseURL includes /v1, adapter appends /messages
 * - Gemini: baseURL includes version
 * - Ollama: just base URL, adapter handles paths
 *
 * Leave empty to use adapter's built-in defaults
 */
function getDefaultEndpoint(provider: AIBaseConfig['provider']): string {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'anthropic':
      return 'https://api.anthropic.com/v1'; // Adapter appends /messages
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1beta';
    case 'ollama':
      return 'http://localhost:11434';
    default:
      return '';
  }
}

/**
 * Create a backend adapter based on the provider configuration
 *
 * @param config - AI configuration from settings
 * @returns Backend adapter instance
 * @throws Error if provider is not supported
 */
export function createBackendAdapter(config: AIBaseConfig): BackendAdapter {
  // Use provider-specific default if no endpoint specified
  const baseURL = config.endpoint || getDefaultEndpoint(config.provider);

  switch (config.provider) {
    case 'openai':
      return new OpenAIBackendAdapter({
        apiKey: config.apiKey,
        baseURL,
      });

    case 'anthropic':
      return new AnthropicBackendAdapter({
        apiKey: config.apiKey,
        browserMode: true, // Required for direct browser usage
        baseURL,
      });

    case 'gemini':
      return new GeminiBackendAdapter({
        apiKey: config.apiKey,
        baseURL,
      });

    case 'ollama':
      return new OllamaBackendAdapter({
        baseURL,
      });

    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
