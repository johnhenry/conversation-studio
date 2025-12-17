/**
 * Hook for fetching available models from AI providers
 */

import { useState } from 'react';
import { createBackendAdapter } from '../utils/backend-factory';
import type { AIBaseConfig } from '../config';
import type { AIModel } from 'ai.matey.types';

export interface UseModelFetcherResult {
  models: AIModel[];
  isLoading: boolean;
  error: string | null;
  fetchModels: () => Promise<void>;
}

/**
 * Hook to fetch available models from the configured provider
 */
export function useModelFetcher(config: AIBaseConfig): UseModelFetcherResult {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    if (!config.provider) {
      setError('No provider selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create backend adapter for the provider
      const backend = createBackendAdapter(config);

      // Check if backend supports model listing
      if (!backend.listModels) {
        setError(`Model listing not supported by ${config.provider}`);
        setModels([]);
        setIsLoading(false);
        return;
      }

      // Fetch models from the provider
      const result = await backend.listModels({
        forceRefresh: true, // Always fetch fresh list
      });

      setModels(result.models);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
      setModels([]);
      console.error('Error fetching models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    models,
    isLoading,
    error,
    fetchModels,
  };
}
