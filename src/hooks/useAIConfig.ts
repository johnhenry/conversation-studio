import { useState, useEffect, useCallback } from "react";
import { AIConfig, DEFAULT_AI_CONFIG } from "../config";

const AI_CONFIG_STORAGE_KEY = "conversation-studio-ai-config";

export function useAIConfig() {
  // Initialize state from localStorage or default
  const [aiConfig, setAIConfigState] = useState<AIConfig>(() => {
    const stored = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (stored) {
      try {
        const storedConfig = JSON.parse(stored);
        return { ...DEFAULT_AI_CONFIG, ...storedConfig };
      } catch (e) {
        console.error("Failed to parse stored AI config:", e);
        return DEFAULT_AI_CONFIG;
      }
    }
    return DEFAULT_AI_CONFIG;
  });

  // Sync to localStorage whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(aiConfig));
      // Dispatch custom event for cross-component sync
      window.dispatchEvent(
        new CustomEvent("aiconfig-changed", { detail: aiConfig })
      );
    } catch (e) {
      console.error("Failed to save AI config to localStorage:", e);
    }
  }, [aiConfig]);

  // Listen for changes from other components
  useEffect(() => {
    const handleConfigChange = (event: CustomEvent<AIConfig>) => {
      setAIConfigState(event.detail);
    };

    window.addEventListener(
      "aiconfig-changed",
      handleConfigChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "aiconfig-changed",
        handleConfigChange as EventListener
      );
    };
  }, []);

  // Validate config values before updating
  const setAIConfig = useCallback(
    (newConfig: Partial<AIConfig> | ((prev: AIConfig) => AIConfig)) => {
      setAIConfigState((prev) => {
        const nextConfig =
          typeof newConfig === "function"
            ? newConfig(prev)
            : { ...prev, ...newConfig };

        // Validate numeric fields
        if (typeof nextConfig.temperature === "number") {
          nextConfig.temperature = Math.max(
            0,
            Math.min(1, nextConfig.temperature)
          );
        }
        if (typeof nextConfig.maxTokens === "number") {
          nextConfig.maxTokens = Math.max(1, nextConfig.maxTokens);
        }
        if (typeof nextConfig.maxRetries === "number") {
          nextConfig.maxRetries = Math.max(
            0,
            Math.floor(nextConfig.maxRetries)
          );
        }
        if (typeof nextConfig.retryDelay === "number") {
          nextConfig.retryDelay = Math.max(0, nextConfig.retryDelay);
        }

        return nextConfig;
      });
    },
    []
  );

  // Reset config to defaults
  const resetConfig = useCallback(() => {
    setAIConfig(DEFAULT_AI_CONFIG);
  }, []);

  return {
    aiConfig,
    setAIConfig,
    resetConfig,
  };
}
