/**
 * Agent Manager Component
 * Displays list of agents with CRUD operations
 */

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Check } from 'lucide-react';
import type { AppConfig, Agent, AIBaseConfig } from '../config';
import { useAgents } from '../hooks/useAgents';
import { DEFAULT_AI_BASE_CONFIG } from '../config';

interface AgentManagerProps {
  appConfig: AppConfig;
  onAppConfigChange: (config: Partial<AppConfig>) => void;
  onEditAgent: (agent: Agent) => void;
}

const AgentManager: React.FC<AgentManagerProps> = ({
  appConfig,
  onAppConfigChange,
  onEditAgent,
}) => {
  const {
    agents,
    activeAgent,
    setActiveAgent,
    createAgent,
    deleteAgent,
    duplicateAgent,
  } = useAgents(appConfig, onAppConfigChange);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleCreateAgent = () => {
    const newAgent = createAgent(
      'New Agent',
      { ...DEFAULT_AI_BASE_CONFIG },
      'Created by user'
    );
    onEditAgent(newAgent);
  };

  const handleDeleteAgent = (agentId: string) => {
    if (agents.length === 1) {
      alert('Cannot delete the last agent');
      return;
    }
    deleteAgent(agentId);
    setShowDeleteConfirm(null);
  };

  const handleDuplicateAgent = (agentId: string) => {
    const duplicated = duplicateAgent(agentId);
    onEditAgent(duplicated);
  };

  const getProviderBadgeColor = (provider: string): string => {
    switch (provider) {
      case 'openai':
        return 'bg-green-700/30 text-green-400';
      case 'anthropic':
        return 'bg-orange-700/30 text-orange-400';
      case 'gemini':
        return 'bg-blue-700/30 text-blue-400';
      case 'ollama':
        return 'bg-purple-700/30 text-purple-400';
      default:
        return 'bg-gray-700/30 text-gray-400';
    }
  };

  const getTypeBadgeColor = (type: string): string => {
    if (type === 'window.ai') {
      return 'bg-yellow-700/30 text-yellow-400';
    }
    return 'bg-blue-700/30 text-blue-400';
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-200">AI Agents</h3>
        <button
          onClick={handleCreateAgent}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
        >
          <Plus size={16} />
          New Agent
        </button>
      </div>

      {/* Agents List */}
      <div className="space-y-3">
        {agents.map((agent) => {
          const isActive = activeAgent?.id === agent.id;

          return (
            <div
              key={agent.id}
              className={`
                p-4 rounded-lg border transition-all cursor-pointer
                ${
                  isActive
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-[#2A2A2B] hover:border-gray-600'
                }
              `}
              onClick={() => setActiveAgent(agent.id)}
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Radio Button */}
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${
                        isActive
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-600'
                      }
                    `}
                  >
                    {isActive && <Check size={12} className="text-white" />}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-200 truncate">
                      {agent.name}
                    </h4>
                    {agent.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {agent.description}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${getTypeBadgeColor(
                          agent.config.type
                        )}`}
                      >
                        {agent.config.type === 'window.ai'
                          ? 'Chrome AI'
                          : agent.config.provider}
                      </span>
                      {agent.config.model && (
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-700/30 text-gray-400">
                          {agent.config.model}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAgent(agent);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-colors"
                    title="Edit agent"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateAgent(agent.id);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-colors"
                    title="Duplicate agent"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (agents.length === 1) {
                        alert('Cannot delete the last agent');
                        return;
                      }
                      setShowDeleteConfirm(agent.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                    title="Delete agent"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm === agent.id && (
                <div
                  className="mt-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-sm text-gray-300 mb-3">
                    Delete &quot;{agent.name}&quot;?{' '}
                    {isActive && 'This is your active agent. '}
                    This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {agents.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-4">No agents configured</p>
          <button
            onClick={handleCreateAgent}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create Your First Agent
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentManager;
