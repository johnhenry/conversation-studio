interface Window {
  ai?: {
    languageModel: {
      create: (options: {
        temperature?: number;
        topK?: number;
        systemPrompt?: string;
      }) => Promise<{
        prompt: (
          text: string,
          options?: { signal?: AbortSignal }
        ) => Promise<string>;
        destroy: () => void;
      }>;
    };
  };
}
