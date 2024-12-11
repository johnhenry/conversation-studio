import React from 'react';
import { X } from 'lucide-react';
import type { AIConfig } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    aiConfig: AIConfig;
    onAIConfigChange: (config: AIConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    aiConfig,
    onAIConfigChange,
}) => {
    if (!isOpen) return null;

    const handleChange = (field: keyof AIConfig, value: any) => {
        onAIConfigChange({
            ...aiConfig,
            [field]: value
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-[#1A1A1B] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-100">AI Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Provider Type
                            </label>
                            <select
                                value={aiConfig.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                            >
                                <option value="">None</option>
                                <option value="openai">OpenAI</option>
                                <option value="window.ai">Window.ai</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Model
                            </label>
                            <input
                                type="text"
                                value={aiConfig.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Endpoint
                            </label>
                            <input
                                type="text"
                                value={aiConfig.endpoint}
                                onChange={(e) => handleChange('endpoint', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                API Key
                            </label>
                            <input
                                type="password"
                                value={aiConfig.apiKey}
                                onChange={(e) => handleChange('apiKey', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-medium text-gray-200 mb-4">Model Settings</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Temperature
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={aiConfig.temperature}
                                    onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Top K
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={aiConfig.topK}
                                    onChange={(e) => handleChange('topK', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Max Tokens
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={aiConfig.maxTokens}
                                    onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Seed
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={aiConfig.seed}
                                    onChange={(e) => handleChange('seed', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-medium text-gray-200 mb-4">Advanced Settings</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Max Retries
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={aiConfig.maxRetries}
                                    onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Retry Delay (ms)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={aiConfig.retryDelay}
                                    onChange={(e) => handleChange('retryDelay', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Log Level
                                </label>
                                <select
                                    value={aiConfig.logLevel}
                                    onChange={(e) => handleChange('logLevel', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="error">Error</option>
                                    <option value="warn">Warning</option>
                                    <option value="info">Info</option>
                                    <option value="debug">Debug</option>
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={aiConfig.debug}
                                        onChange={(e) => handleChange('debug', e.target.checked)}
                                        className="w-4 h-4 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                                    />
                                    <span>Debug Mode</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-medium text-gray-200 mb-4">System Prompt</h3>
                        <div>
                            <textarea
                                value={aiConfig.systemPrompt}
                                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                placeholder="Enter system prompt..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
