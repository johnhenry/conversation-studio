import React, { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import type { AppConfig, ExportSettings } from "../types";
import { DEFAULT_APP_CONFIG } from "../config";
import { useModelFetcher } from "../hooks/useModelFetcher";

type SettingsTab = "general" | "ai" | "export";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appConfig: AppConfig;
  onAppConfigChange: (config: Partial<AppConfig>) => void;
  exportSettings: ExportSettings;
  onExportSettingsChange: (settings: ExportSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  appConfig,
  onAppConfigChange,
  exportSettings,
  onExportSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Hook for fetching models from the provider
  const { models, isLoading, error, fetchModels } = useModelFetcher(appConfig.ai.base);

  if (!isOpen) return null;

  const handleGeneralChange = (
    field: keyof typeof appConfig.general,
    value: any
  ) => {
    onAppConfigChange({
      general: {
        ...appConfig.general,
        [field]: value,
      },
    });
  };

  const handleAIChange = (
    field: keyof typeof appConfig.ai.base,
    value: any
  ) => {
    // Validate and convert numeric values
    let processedValue = value;
    if (
      [
        "temperature",
        "topK",
        "maxTokens",
        "seed",
        "maxRetries",
        "retryDelay",
      ].includes(field)
    ) {
      const num = Number(value);
      if (!isNaN(num)) {
        processedValue = num;
      }
    }

    onAppConfigChange({
      ai: {
        base: {
          ...appConfig.ai.base,
          [field]: processedValue,
        },
      },
    });
  };

  const handleExportChange = (field: keyof ExportSettings, value: any) => {
    onExportSettingsChange({
      ...exportSettings,
      [field]: value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-10 flex items-center justify-center p-4">
      <div className="bg-[#1A1B1B] rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center gap-2 w-full md:w-auto justify">
                Settings
        <button
          onClick={onClose}
          className="p-2 text-gray-300 hover:text-gray-100 bg-[#2A2A2B] rounded-lg transition-colors ml-auto"
        >
          <X size={20} />
        </button>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="w-full md:w-auto overflow-x-auto flex items-center gap-4 pb-2 md:pb-0">
            <div className="flex gap-4 min-w-max">
              <button
                onClick={() => setActiveTab("general")}
                className={`text-base md:text-lg font-semibold px-2 py-1 rounded-lg transition-colors ${
                  activeTab === "general"
                    ? "text-gray-100 bg-gray-800"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`text-base md:text-lg font-semibold px-2 py-1 rounded-lg transition-colors ${
                  activeTab === "ai"
                    ? "text-gray-100 bg-gray-800"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                AI
              </button>
              <button
                onClick={() => setActiveTab("export")}
                className={`text-base md:text-lg font-semibold px-2 py-1 rounded-lg transition-colors ${
                  activeTab === "export"
                    ? "text-gray-100 bg-gray-800"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Export
              </button>
            </div>
          </div>
        </div>

        {activeTab === "general" && (
          <div className="space-y-6 px-1">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-300">
                Store Locally
              </label>
              <input
                type="checkbox"
                checked={appConfig.general.storeLocally}
                onChange={(e) =>
                  handleGeneralChange("storeLocally", e.target.checked)
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Log Level
              </label>
              <select
                value={appConfig.general.logLevel}
                onChange={(e) => handleGeneralChange("logLevel", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 appearance-none"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-300">
                Debug Mode
              </label>
              <input
                type="checkbox"
                checked={appConfig.general.debug}
                onChange={(e) => handleGeneralChange("debug", e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={appConfig.general.userId || ""}
                onChange={(e) => handleGeneralChange("userId", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
              />
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-6 px-1">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                AI Type
              </label>
              <select
                value={appConfig.ai.base.type}
                onChange={(e) => handleAIChange("type", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 appearance-none"
              >
                <option value="">[inactive]</option>
                <option value="api">API Provider</option>
                <option value="window.ai">Chrome AI (window.ai)</option>
              </select>
            </div>
            {appConfig.ai.base.type === "api" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Provider
                </label>
                <select
                  value={appConfig.ai.base.provider}
                  onChange={(e) => {
                    const newProvider = e.target.value as typeof appConfig.ai.base.provider;
                    handleAIChange("provider", newProvider);

                    // Set provider-specific defaults when switching
                    const providerDefaults: Record<string, { endpoint: string; model: string }> = {
                      openai: {
                        endpoint: 'https://api.openai.com/v1',
                        model: 'gpt-4'
                      },
                      anthropic: {
                        endpoint: 'https://api.anthropic.com/v1',
                        model: 'claude-3-5-sonnet-20241022'
                      },
                      gemini: {
                        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
                        model: 'gemini-pro'
                      },
                      ollama: {
                        endpoint: 'http://localhost:11434',
                        model: 'llama3.2:latest'
                      },
                    };

                    const defaults = providerDefaults[newProvider];
                    if (defaults) {
                      handleAIChange("endpoint", defaults.endpoint);
                      handleAIChange("model", defaults.model);
                    }
                  }}
                  className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 appearance-none"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {appConfig.ai.base.provider === 'ollama' && 'Local LLMs via Ollama'}
                  {appConfig.ai.base.provider === 'openai' && 'GPT-4, GPT-3.5-turbo, etc.'}
                  {appConfig.ai.base.provider === 'anthropic' && 'Claude 3.5 Sonnet, etc.'}
                  {appConfig.ai.base.provider === 'gemini' && 'Gemini Pro, etc.'}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Endpoint
              </label>
              <input
                type="text"
                value={appConfig.ai.base.endpoint}
                onChange={(e) => handleAIChange("endpoint", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                placeholder={
                  appConfig.ai.base.provider === 'ollama'
                    ? 'http://localhost:11434'
                    : appConfig.ai.base.provider === 'openai'
                    ? 'https://api.openai.com/v1'
                    : appConfig.ai.base.provider === 'anthropic'
                    ? 'https://api.anthropic.com/v1'
                    : 'API Endpoint'
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                {appConfig.ai.base.provider === 'ollama' && 'Default: http://localhost:11434'}
                {appConfig.ai.base.provider === 'openai' && 'Default: https://api.openai.com/v1'}
                {appConfig.ai.base.provider === 'anthropic' && 'Default: https://api.anthropic.com/v1 (becomes /v1/messages)'}
                {appConfig.ai.base.provider === 'gemini' && 'Default: https://generativelanguage.googleapis.com/v1beta'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={appConfig.ai.base.apiKey}
                onChange={(e) => handleAIChange("apiKey", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                placeholder="API Key"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">
                  Model
                </label>
                {appConfig.ai.base.type === "api" && (
                  <button
                    onClick={async () => {
                      await fetchModels();
                      if (models.length > 0) {
                        setShowModelDropdown(true);
                      }
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-gray-300 hover:text-gray-100 bg-[#3A3A3B] hover:bg-[#4A4A4B] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                    {isLoading ? "Fetching..." : "Fetch Models"}
                  </button>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-400 mb-2">{error}</p>
              )}

              {showModelDropdown && models.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={appConfig.ai.base.model}
                    onChange={(e) => handleAIChange("model", e.target.value)}
                    className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 appearance-none"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name || model.id}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowModelDropdown(false)}
                    className="text-xs text-gray-400 hover:text-gray-200 underline"
                  >
                    Enter model manually
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={appConfig.ai.base.model}
                    onChange={(e) => handleAIChange("model", e.target.value)}
                    className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                    placeholder="Model Name"
                  />
                  {models.length > 0 && !showModelDropdown && (
                    <button
                      onClick={() => setShowModelDropdown(true)}
                      className="text-xs text-gray-400 hover:text-gray-200 underline"
                    >
                      Choose from {models.length} fetched model{models.length !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                System Prompt
              </label>
              <textarea
                value={appConfig.ai.base.systemPrompt}
                onChange={(e) => handleAIChange("systemPrompt", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 min-h-[120px]"
                placeholder="System Prompt"
              />
            </div>
            <details>
              <summary>Parameters</summary>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Temperature
              </label>
              <input
                type="number"
                value={appConfig.ai.base.temperature}
                onChange={(e) => handleAIChange("temperature", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                min="0"
                max="1"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Top K
              </label>
              <input
                type="number"
                value={appConfig.ai.base.topK}
                onChange={(e) => handleAIChange("topK", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={appConfig.ai.base.maxTokens}
                onChange={(e) => handleAIChange("maxTokens", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seed
              </label>
              <input
                type="number"
                value={appConfig.ai.base.seed}
                onChange={(e) => handleAIChange("seed", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Retries
              </label>
              <input
                type="number"
                value={appConfig.ai.base.maxRetries}
                onChange={(e) => handleAIChange("maxRetries", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Retry Delay (ms)
              </label>
              <input
                type="number"
                value={appConfig.ai.base.retryDelay}
                onChange={(e) => handleAIChange("retryDelay", e.target.value)}
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                min="0"
              />
            </div>
            </details>
          </div>
        )}

        {activeTab === "export" && (
          <div className="space-y-6 px-1">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-300">
                Include Attachments
              </label>
              <input
                type="checkbox"
                checked={exportSettings.includeAttachmentUrls}
                onChange={(e) =>
                  handleExportChange("includeAttachmentUrls", e.target.checked)
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-300">
                Truncate Content
              </label>
              <input
                type="checkbox"
                checked={exportSettings.truncateContent}
                onChange={(e) =>
                  handleExportChange("truncateContent", e.target.checked)
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            {exportSettings.truncateContent && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Content Length
                </label>
                <input
                  type="number"
                  value={exportSettings.maxContentLength}
                  onChange={(e) =>
                    handleExportChange(
                      "maxContentLength",
                      Number(e.target.value)
                    )
                  }
                  className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                  min="1"
                />
              </div>
            )}
          </div>
        )}
        <div className="flex pt-4">
        <button
              onClick={() => {
                if (activeTab === "general") {
                  onAppConfigChange({ general: DEFAULT_APP_CONFIG.general });
                } else if (activeTab === "ai") {
                  onAppConfigChange({ ai: DEFAULT_APP_CONFIG.ai });
                } else {
                  onExportSettingsChange({
                    includeAttachmentUrls: true,
                    truncateContent: false,
                    maxContentLength: 1000,
                  });
                }
              }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-800 rounded-lg transition-colors"
            >
              Reset to Default
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
