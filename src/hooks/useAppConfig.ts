import { useState, useEffect, useCallback } from "react";
import { AppConfig, DEFAULT_APP_CONFIG } from "../config";
import { migrateToAgentSystem, validateAgentConfig, repairAgentConfig } from "../utils/agent-migration";

const APP_CONFIG_STORAGE_KEY = "conversation-studio-config";

export function useAppConfig() {
  // Initialize state from localStorage or default
  const [appConfig, setAppConfigState] = useState<AppConfig>(() => {
    const stored = localStorage.getItem(APP_CONFIG_STORAGE_KEY);
    if (stored) {
      try {
        const storedConfig = JSON.parse(stored);

        // Apply migration to agent system
        let migratedConfig = migrateToAgentSystem(storedConfig);

        // Validate and repair if needed
        const validation = validateAgentConfig(migratedConfig);
        if (!validation.valid) {
          console.warn('Agent config validation failed:', validation.errors);
          console.warn('Attempting to repair config...');
          migratedConfig = repairAgentConfig(migratedConfig);
        }

        return migratedConfig;
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

        // Validate AI config numeric fields in all agents
        if (nextConfig.ai?.agents) {
          nextConfig.ai.agents = nextConfig.ai.agents.map((agent) => ({
            ...agent,
            config: {
              ...agent.config,
              temperature:
                typeof agent.config.temperature === "number"
                  ? Math.max(0, Math.min(1, agent.config.temperature))
                  : agent.config.temperature,
              maxTokens:
                typeof agent.config.maxTokens === "number"
                  ? Math.max(1, agent.config.maxTokens)
                  : agent.config.maxTokens,
              maxRetries:
                typeof agent.config.maxRetries === "number"
                  ? Math.max(0, Math.floor(agent.config.maxRetries))
                  : agent.config.maxRetries,
              retryDelay:
                typeof agent.config.retryDelay === "number"
                  ? Math.max(0, agent.config.retryDelay)
                  : agent.config.retryDelay,
            },
          }));
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
