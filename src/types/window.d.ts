interface Window {
  ai?: {
    languageModel: {
      // New API (Chrome 138+)
      create?: (options?: {
        temperature?: number;
        topK?: number;
        systemPrompt?: string;
      }) => Promise<{
        prompt: (
          text: string,
          options?: { signal?: AbortSignal }
        ) => Promise<string>;
        promptStreaming?: (text: string) => ReadableStream<string>;
        destroy: () => void;
        clone?: () => any;
      }>;
      availability?: () => Promise<"readily" | "after-download" | "no">;
      params?: () => Promise<{
        defaultTopK: number;
        maxTopK: number;
        defaultTemperature: number;
        maxTemperature: number;
      }>;

      // Legacy API (Chrome 129-137) - for backward compatibility
      createTextSession?: (options?: {
        temperature?: number;
        topK?: number;
      }) => Promise<{
        prompt: (text: string) => Promise<string>;
        promptStreaming: (text: string) => ReadableStream;
        destroy: () => void;
      }>;
      capabilities?: () => Promise<{ available: "readily" | "after-download" | "no" }>;
    };
  };
}

// Also support the new global `ai` (Chrome 138+)
declare var ai:
  | {
      languageModel: {
        create: (options?: {
          temperature?: number;
          topK?: number;
          systemPrompt?: string;
        }) => Promise<{
          prompt: (
            text: string,
            options?: { signal?: AbortSignal }
          ) => Promise<string>;
          promptStreaming: (text: string) => ReadableStream<string>;
          destroy: () => void;
          clone?: () => any;
        }>;
        availability: () => Promise<"readily" | "after-download" | "no">;
        params?: () => Promise<{
          defaultTopK: number;
          maxTopK: number;
          defaultTemperature: number;
          maxTemperature: number;
        }>;
      };
    }
  | undefined;
