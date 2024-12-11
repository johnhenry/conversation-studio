import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AIConfig, ExportSettings } from '../types';

const DEFAULT_AI_CONFIG: AIConfig = {
    type: '',
    model: '',
    endpoint: '',
    apiKey: '',
    temperature: 0.5,
    topK: 40,
    maxTokens: 2048,
    seed: 0,
    maxRetries: 3,
    retryDelay: 500,
    logLevel: 'error',
    debug: false,
    systemPrompt: '',
};

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    aiConfig: AIConfig;
    onAIConfigChange: (config: AIConfig) => void;
    exportSettings: ExportSettings;
    onExportSettingsChange: (settings: ExportSettings) => void;
}

type SettingsTab = 'ai' | 'export';

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    aiConfig,
    onAIConfigChange,
    exportSettings,
    onExportSettingsChange,
}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('ai');

    if (!isOpen) return null;

    const handleAIChange = (field: keyof AIConfig, value: any) => {
        // Validate and convert numeric values
        let processedValue = value;
        if (['temperature', 'topK', 'maxTokens', 'seed', 'maxRetries', 'retryDelay'].includes(field)) {
            const num = Number(value);
            if (!isNaN(num)) {
                processedValue = num;
            }
        }

        onAIConfigChange({
            ...aiConfig,
            [field]: processedValue
        });
    };

    const handleExportChange = (field: keyof ExportSettings, value: any) => {
        onExportSettingsChange({
            ...exportSettings,
            [field]: value
        });
    };

    const handleDebugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleAIChange('debug', e.target.checked);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-[#1A1A1B] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`text-lg font-semibold ${
                                activeTab === 'ai' ? 'text-gray-100' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            AI Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('export')}
                            className={`text-lg font-semibold ${
                                activeTab === 'export' ? 'text-gray-100' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Export Settings
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (activeTab === 'ai') {
                                    onAIConfigChange({ ...DEFAULT_AI_CONFIG });
                                } else {
                                    onExportSettingsChange({
                                        includeAttachmentUrls: true,
                                        truncateContent: false,
                                    });
                                }
                            }}
                            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200"
                        >
                            Reset to Defaults
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {activeTab === 'ai' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Provider Type
                                    </label>
                                    <select
                                        value={aiConfig.type}
                                        onChange={(e) => handleAIChange('type', e.target.value)}
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
                                        onChange={(e) => handleAIChange('model', e.target.value)}
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
                                        onChange={(e) => handleAIChange('endpoint', e.target.value)}
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
                                        onChange={(e) => handleAIChange('apiKey', e.target.value)}
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
                                            onChange={(e) => handleAIChange('temperature', e.target.value)}
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
                                            onChange={(e) => handleAIChange('topK', e.target.value)}
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
                                            onChange={(e) => handleAIChange('maxTokens', e.target.value)}
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
                                            onChange={(e) => handleAIChange('seed', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        System Prompt
                                    </label>
                                    <textarea
                                        value={aiConfig.systemPrompt}
                                        onChange={(e) => handleAIChange('systemPrompt', e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                        placeholder="Enter a system prompt..."
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={aiConfig.debug}
                                            onChange={handleDebugChange}
                                            className="w-4 h-4 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                                        />
                                        <span>Debug Mode</span>
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.includeAttachmentUrls}
                                        onChange={(e) => handleExportChange('includeAttachmentUrls', e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-700 bg-gray-800 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-300">Include Attachment URLs in Export</span>
                                </label>
                                <p className="text-sm text-gray-400 mt-1 ml-6">
                                    When enabled, attachment URLs will be included in the exported data
                                </p>
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.truncateContent}
                                        onChange={(e) => handleExportChange('truncateContent', e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-700 bg-gray-800 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-300">Truncate Long Content</span>
                                </label>
                                <p className="text-sm text-gray-400 mt-1 ml-6">
                                    Truncate content that exceeds the maximum length
                                </p>
                            </div>

                            {exportSettings.truncateContent && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Maximum Content Length
                                    </label>
                                    <input
                                        type="number"
                                        min="100"
                                        value={exportSettings.maxContentLength || 1000}
                                        onChange={(e) => handleExportChange('maxContentLength', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                                    />
                                    <p className="text-sm text-gray-400 mt-1">
                                        Maximum number of characters for each comment's content
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
