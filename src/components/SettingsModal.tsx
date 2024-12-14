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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-[#1A1A1B] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("general")}
              className={`text-lg font-semibold ${
                activeTab === "general"
                  ? "text-gray-100"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`text-lg font-semibold ${
                activeTab === "ai"
                  ? "text-gray-100"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              AI Settings
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className={`text-lg font-semibold ${
                activeTab === "export"
                  ? "text-gray-100"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Export Settings
            </button>
          </div>
          <div className="flex items-center gap-2">
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
              className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200"
            >
              Reset to Default
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {activeTab === "general" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Store Locally
              </label>
              <input
                type="checkbox"
                checked={appConfig.general.storeLocally}
                onChange={(e) =>
                  handleGeneralChange("storeLocally", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Log Level
              </label>
              <select
                value={appConfig.general.logLevel}
                onChange={(e) =>
                  handleGeneralChange("logLevel", e.target.value)
                }
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Debug Mode
              </label>
              <input
                type="checkbox"
                checked={appConfig.general.debug}
                onChange={(e) => handleGeneralChange("debug", e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                AI Type
              </label>
              <select
                value={appConfig.ai.base.type}
                onChange={(e) => handleAIChange("type", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
              >
                <option value="">[inactive]</option>
                <option value="openai">OpenAI</option>
                <option value="window.ai">Window AI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Endpoint
              </label>
              <input
                type="text"
                value={appConfig.ai.base.endpoint}
                onChange={(e) => handleAIChange("endpoint", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                placeholder="API Endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={appConfig.ai.base.apiKey}
                onChange={(e) => handleAIChange("apiKey", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                placeholder="API Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Model
              </label>
              <input
                type="text"
                value={appConfig.ai.base.model}
                onChange={(e) => handleAIChange("model", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                placeholder="Model Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Temperature
              </label>
              <input
                type="number"
                value={appConfig.ai.base.temperature}
                onChange={(e) => handleAIChange("temperature", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                min="0"
                max="1"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Top K
              </label>
              <input
                type="number"
                value={appConfig.ai.base.topK}
                onChange={(e) => handleAIChange("topK", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={appConfig.ai.base.maxTokens}
                onChange={(e) => handleAIChange("maxTokens", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Seed
              </label>
              <input
                type="number"
                value={appConfig.ai.base.seed}
                onChange={(e) => handleAIChange("seed", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Retries
              </label>
              <input
                type="number"
                value={appConfig.ai.base.maxRetries}
                onChange={(e) => handleAIChange("maxRetries", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Retry Delay (ms)
              </label>
              <input
                type="number"
                value={appConfig.ai.base.retryDelay}
                onChange={(e) => handleAIChange("retryDelay", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                System Prompt
              </label>
              <textarea
                value={appConfig.ai.base.systemPrompt}
                onChange={(e) => handleAIChange("systemPrompt", e.target.value)}
                className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                rows={4}
                placeholder="System Prompt"
              />
            </div>
          </div>
        )}

        {activeTab === "export" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Include Attachments
              </label>
              <input
                type="checkbox"
                checked={exportSettings.includeAttachmentUrls}
                onChange={(e) =>
                  handleExportChange("includeAttachmentUrls", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Truncate Content
              </label>
              <input
                type="checkbox"
                checked={exportSettings.truncateContent}
                onChange={(e) =>
                  handleExportChange("truncateContent", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
            {exportSettings.truncateContent && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
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
                  className="w-full p-2 bg-[#2A2A2B] rounded border border-gray-700 text-gray-300"
                  min="1"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
