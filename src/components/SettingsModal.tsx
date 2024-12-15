import React, { useState } from "react";
import { X } from "lucide-react";
import type { AppConfig, ExportSettings } from "../types";
import { DEFAULT_APP_CONFIG } from "../config";

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
      <div className="bg-[#1A1A1B] rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center gap-2 w-full md:w-auto justify">
                Settings
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-200 bg-gray-800 rounded-lg transition-colors ml-auto"
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
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 appearance-none"
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
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
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
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 appearance-none"
              >
                <option value="">[inactive]</option>
                <option value="openai">OpenAI</option>
                <option value="window.ai">Window AI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Endpoint
              </label>
              <input
                type="text"
                value={appConfig.ai.base.endpoint}
                onChange={(e) => handleAIChange("endpoint", e.target.value)}
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                placeholder="API Endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={appConfig.ai.base.apiKey}
                onChange={(e) => handleAIChange("apiKey", e.target.value)}
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                placeholder="API Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model
              </label>
              <input
                type="text"
                value={appConfig.ai.base.model}
                onChange={(e) => handleAIChange("model", e.target.value)}
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                placeholder="Model Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                System Prompt
              </label>
              <textarea
                value={appConfig.ai.base.systemPrompt}
                onChange={(e) => handleAIChange("systemPrompt", e.target.value)}
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 min-h-[120px]"
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
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
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
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
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
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
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
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
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
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
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
                className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
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
                  className="w-full p-3 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
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
