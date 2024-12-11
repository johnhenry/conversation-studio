import React from 'react';
import { X } from 'lucide-react';
import type { AIConfig } from '../config';

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

    const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onAIConfigChange({ ...aiConfig, endpoint: e.target.value });
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onAIConfigChange({ ...aiConfig, model: e.target.value });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-[#1A1A1B] rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-100">Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            AI Endpoint
                        </label>
                        <input
                            type="text"
                            value={aiConfig.endpoint}
                            onChange={handleEndpointChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            AI Model
                        </label>
                        <input
                            type="text"
                            value={aiConfig.model}
                            onChange={handleModelChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
