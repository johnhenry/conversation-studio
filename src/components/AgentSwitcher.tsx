/**
 * Agent Switcher Component
 * Quick dropdown to switch between agents in the header
 */

import React from 'react';
import { Bot, Check } from 'lucide-react';
import type { AppConfig } from '../config';
import { useAgents } from '../hooks/useAgents';

interface AgentSwitcherProps {
  appConfig: AppConfig;
  onAppConfigChange: (config: Partial<AppConfig>) => void;
}

const AgentSwitcher: React.FC<AgentSwitcherProps> = ({
  appConfig,
  onAppConfigChange,
}) => {
  const { agents, activeAgent, setActiveAgent } = useAgents(
    appConfig,
    onAppConfigChange
  );

  if (agents.length === 0) {
    return null;
  }

  const getProviderLabel = (agent: typeof agents[0]): string => {
    if (agent.config.type === 'window.ai') {
      return 'Chrome AI';
    }
    const providerNames: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      gemini: 'Gemini',
      ollama: 'Ollama',
    };
    return providerNames[agent.config.provider] || agent.config.provider;
  };

  return (
    <div className="relative group">
      {/* Current Agent Display */}
      <button className="flex items-center gap-2 px-3 py-2 bg-[#2A2A2B] hover:bg-[#3A3A3B] rounded-lg transition-colors border border-gray-700">
        <Bot size={16} className="text-blue-400" />
        <div className="text-left min-w-0">
          <div className="text-sm font-medium text-gray-200 truncate max-w-[150px]">
            {activeAgent?.name || 'No Agent'}
          </div>
          {activeAgent && (
            <div className="text-xs text-gray-400 truncate">
              {getProviderLabel(activeAgent)}
              {activeAgent.config.model && ` • ${activeAgent.config.model}`}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-72 bg-[#1A1B1B] border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-2 max-h-96 overflow-y-auto">
          {/* Agent List */}
          {agents.map((agent) => {
            const isActive = activeAgent?.id === agent.id;

            return (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={`
                  w-full p-3 rounded-lg text-left transition-colors flex items-start gap-2
                  ${
                    isActive
                      ? 'bg-blue-900/30 border border-blue-700/50'
                      : 'hover:bg-[#2A2A2B] border border-transparent'
                  }
                `}
              >
                {/* Check Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isActive ? (
                    <Check size={16} className="text-blue-400" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-200 truncate">
                    {agent.name}
                  </div>
                  {agent.description && (
                    <div className="text-xs text-gray-400 truncate mt-0.5">
                      {agent.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {getProviderLabel(agent)}
                    </span>
                    {agent.config.model && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className="text-xs text-gray-500 truncate">
                          {agent.config.model}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgentSwitcher;
