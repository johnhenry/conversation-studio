/**
 * Agent Editor Component
 * Form for editing agent configuration
 */

import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import type { Agent, AIBaseConfig, AppConfig } from '../config';
import { useAgents } from '../hooks/useAgents';
import { useModelFetcher } from '../hooks/useModelFetcher';

interface AgentEditorProps {
  agent: Agent;
  appConfig: AppConfig;
  onAppConfigChange: (config: Partial<AppConfig>) => void;
  onClose: () => void;
}

const AgentEditor: React.FC<AgentEditorProps> = ({
  agent,
  appConfig,
  onAppConfigChange,
  onClose,
}) => {
  const { updateAgent } = useAgents(appConfig, onAppConfigChange);

  // Local state for editing
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || '');
  const [config, setConfig] = useState<AIBaseConfig>(agent.config);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Model fetcher
  const { models, isLoading, error, fetchModels } = useModelFetcher(config);

  const handleConfigChange = (field: keyof AIBaseConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    updateAgent(agent.id, {
      name,
      description: description || undefined,
      config,
    });
    onClose();
  };

  const handleProviderChange = (newProvider: typeof config.provider) => {
    const providerDefaults: Record<
      string,
      { endpoint: string; model: string }
    > = {
      openai: {
        endpoint: 'https://api.openai.com/v1',
        model: 'gpt-4',
      },
      anthropic: {
        endpoint: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
      },
      gemini: {
        endpoint: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-pro',
      },
      ollama: {
        endpoint: 'http://localhost:11434',
        model: 'llama3.2:latest',
      },
    };

    const defaults = providerDefaults[newProvider];
    if (defaults) {
      setConfig((prev) => ({
        ...prev,
        provider: newProvider,
        endpoint: defaults.endpoint,
        model: defaults.model,
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
      <div className="bg-[#1A1B1B] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-200">Edit Agent</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-gray-100 bg-[#2A2A2B] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
              placeholder="My AI Agent"
            />
          </div>

          {/* Agent Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
              placeholder="What this agent is for..."
            />
          </div>

          <hr className="border-gray-700" />

          {/* AI Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Type
            </label>
            <select
              value={config.type}
              onChange={(e) =>
                handleConfigChange('type', e.target.value as typeof config.type)
              }
              className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 appearance-none"
            >
              <option value="">[inactive]</option>
              <option value="api">API Provider</option>
              <option value="window.ai">Chrome AI (window.ai)</option>
            </select>
          </div>

          {/* Provider Selection (only for API type) */}
          {config.type === 'api' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Provider
              </label>
              <select
                value={config.provider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as typeof config.provider)
                }
                className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 appearance-none"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {config.provider === 'ollama' && 'Local LLMs via Ollama'}
                {config.provider === 'openai' && 'GPT-4, GPT-3.5-turbo, etc.'}
                {config.provider === 'anthropic' && 'Claude 3.5 Sonnet, etc.'}
                {config.provider === 'gemini' && 'Gemini Pro, etc.'}
              </p>
            </div>
          )}

          {/* Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Endpoint
            </label>
            <input
              type="text"
              value={config.endpoint}
              onChange={(e) => handleConfigChange('endpoint', e.target.value)}
              className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
              placeholder={
                config.provider === 'ollama'
                  ? 'http://localhost:11434'
                  : config.provider === 'openai'
                  ? 'https://api.openai.com/v1'
                  : 'API Endpoint'
              }
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
              placeholder="API Key"
            />
          </div>

          {/* Model with Fetch Button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Model</label>
              {config.type === 'api' && (
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
                  <RefreshCw
                    size={12}
                    className={isLoading ? 'animate-spin' : ''}
                  />
                  {isLoading ? 'Fetching...' : 'Fetch Models'}
                </button>
              )}
            </div>

            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

            {showModelDropdown && models.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={config.model}
                  onChange={(e) => handleConfigChange('model', e.target.value)}
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
                  value={config.model}
                  onChange={(e) => handleConfigChange('model', e.target.value)}
                  className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                  placeholder="Model Name"
                />
                {models.length > 0 && !showModelDropdown && (
                  <button
                    onClick={() => setShowModelDropdown(true)}
                    className="text-xs text-gray-400 hover:text-gray-200 underline"
                  >
                    Choose from {models.length} fetched model
                    {models.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              System Prompt
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) =>
                handleConfigChange('systemPrompt', e.target.value)
              }
              className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300 min-h-[120px]"
              placeholder="System Prompt"
            />
          </div>

          {/* Advanced Parameters */}
          <details>
            <summary className="text-sm font-medium text-gray-300 cursor-pointer mb-4">
              Advanced Parameters
            </summary>
            <div className="space-y-4 pl-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  value={config.temperature}
                  onChange={(e) =>
                    handleConfigChange('temperature', Number(e.target.value))
                  }
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
                  value={config.topK}
                  onChange={(e) =>
                    handleConfigChange('topK', Number(e.target.value))
                  }
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
                  value={config.maxTokens}
                  onChange={(e) =>
                    handleConfigChange('maxTokens', Number(e.target.value))
                  }
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
                  value={config.seed}
                  onChange={(e) =>
                    handleConfigChange('seed', Number(e.target.value))
                  }
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
                  value={config.maxRetries}
                  onChange={(e) =>
                    handleConfigChange('maxRetries', Number(e.target.value))
                  }
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
                  value={config.retryDelay}
                  onChange={(e) =>
                    handleConfigChange('retryDelay', Number(e.target.value))
                  }
                  className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                  min="0"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentEditor;
