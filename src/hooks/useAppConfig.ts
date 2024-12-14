import { useState, useEffect, useCallback } from "react";
import { AppConfig, DEFAULT_APP_CONFIG } from "../config";

const APP_CONFIG_STORAGE_KEY = "conversation-studio-config";

export function useAppConfig() {
  // Initialize state from localStorage or default
  const [appConfig, setAppConfigState] = useState<AppConfig>(() => {
    const stored = localStorage.getItem(APP_CONFIG_STORAGE_KEY);
    if (stored) {
      try {
        const storedConfig = JSON.parse(stored);
        return {
          ...DEFAULT_APP_CONFIG,
          ...storedConfig,
          ai: {
            ...DEFAULT_APP_CONFIG.ai,
            ...storedConfig.ai,
            base: {
              ...DEFAULT_APP_CONFIG.ai.base,
              ...storedConfig.ai?.base,
            },
          },
        };
      } catch (e) {
        console.error("Failed to parse stored app config:", e);
        return DEFAULT_APP_CONFIG;
      }
    }
    return DEFAULT_APP_CONFIG;
  });

  // Always sync config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(APP_CONFIG_STORAGE_KEY, JSON.stringify(appConfig));
      // Dispatch custom event for cross-component sync
      window.dispatchEvent(
        new CustomEvent("appconfig-changed", { detail: appConfig })
      );
    } catch (e) {
      console.error("Failed to save app config to localStorage:", e);
    }
  }, [appConfig]);

  // Listen for changes from other components
  useEffect(() => {
    const handleConfigChange = (event: CustomEvent<AppConfig>) => {
      setAppConfigState(event.detail);
    };

    window.addEventListener(
      "appconfig-changed",
      handleConfigChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "appconfig-changed",
        handleConfigChange as EventListener
      );
    };
  }, []);

  // Validate config values before updating
  const setAppConfig = useCallback(
    (newConfig: Partial<AppConfig> | ((prev: AppConfig) => AppConfig)) => {
      setAppConfigState((prev) => {
        const nextConfig =
          typeof newConfig === "function"
            ? newConfig(prev)
            : { ...prev, ...newConfig };

        // Validate AI config numeric fields
        if (nextConfig.ai?.base) {
          const base = nextConfig.ai.base;
          if (typeof base.temperature === "number") {
            base.temperature = Math.max(0, Math.min(1, base.temperature));
          }
          if (typeof base.maxTokens === "number") {
            base.maxTokens = Math.max(1, base.maxTokens);
          }
          if (typeof base.maxRetries === "number") {
            base.maxRetries = Math.max(0, Math.floor(base.maxRetries));
          }
          if (typeof base.retryDelay === "number") {
            base.retryDelay = Math.max(0, base.retryDelay);
          }
        }

        return nextConfig;
      });
    },
    []
  );

  // Reset config to defaults
  const resetConfig = useCallback(() => {
    setAppConfig(DEFAULT_APP_CONFIG);
  }, []);

  return {
    appConfig,
    setAppConfig,
    resetConfig,
  };
}
