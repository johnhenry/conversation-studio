/**
 * Hook for managing AI agents
 * Provides CRUD operations and active agent management
 */

import type { Agent, AIBaseConfig, AppConfig } from '../config';

export interface UseAgentsResult {
  agents: Agent[];
  activeAgent: Agent | undefined;
  setActiveAgent: (agentId: string) => void;
  createAgent: (name: string, config: AIBaseConfig, description?: string) => Agent;
  updateAgent: (agentId: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>) => void;
  deleteAgent: (agentId: string) => void;
  duplicateAgent: (agentId: string, newName?: string) => Agent;
}

export function useAgents(
  appConfig: AppConfig,
  onAppConfigChange: (config: Partial<AppConfig>) => void
): UseAgentsResult {
  const agents = appConfig.ai.agents;
  const activeAgent = agents.find((a) => a.id === appConfig.ai.activeAgentId);

  /**
   * Set the active agent
   */
  const setActiveAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      console.error(`Agent with ID "${agentId}" not found`);
      return;
    }

    onAppConfigChange({
      ai: {
        ...appConfig.ai,
        activeAgentId: agentId,
      },
    });
  };

  /**
   * Create a new agent
   */
  const createAgent = (
    name: string,
    config: AIBaseConfig,
    description?: string
  ): Agent => {
    const newAgent: Agent = {
      id: crypto.randomUUID(),
      name,
      description,
      config,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedAgents = [...agents, newAgent];

    onAppConfigChange({
      ai: {
        agents: updatedAgents,
        activeAgentId: appConfig.ai.activeAgentId || newAgent.id,
      },
    });

    return newAgent;
  };

  /**
   * Update an existing agent
   */
  const updateAgent = (
    agentId: string,
    updates: Partial<Omit<Agent, 'id' | 'createdAt'>>
  ) => {
    const updatedAgents = agents.map((agent) => {
      if (agent.id === agentId) {
        return {
          ...agent,
          ...updates,
          updatedAt: Date.now(),
        };
      }
      return agent;
    });

    onAppConfigChange({
      ai: {
        ...appConfig.ai,
        agents: updatedAgents,
      },
    });
  };

  /**
   * Delete an agent
   * Prevents deleting the last agent
   */
  const deleteAgent = (agentId: string) => {
    if (agents.length === 1) {
      console.error('Cannot delete the last agent');
      return;
    }

    const updatedAgents = agents.filter((a) => a.id !== agentId);

    // If deleting active agent, switch to first available
    let newActiveId = appConfig.ai.activeAgentId;
    if (agentId === appConfig.ai.activeAgentId) {
      newActiveId = updatedAgents[0].id;
    }

    onAppConfigChange({
      ai: {
        agents: updatedAgents,
        activeAgentId: newActiveId,
      },
    });
  };

  /**
   * Duplicate an existing agent
   */
  const duplicateAgent = (agentId: string, newName?: string): Agent => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent with ID "${agentId}" not found`);
    }

    const duplicatedAgent: Agent = {
      id: crypto.randomUUID(),
      name: newName || `${agent.name} (Copy)`,
      description: agent.description,
      config: { ...agent.config },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedAgents = [...agents, duplicatedAgent];

    onAppConfigChange({
      ai: {
        ...appConfig.ai,
        agents: updatedAgents,
      },
    });

    return duplicatedAgent;
  };

  return {
    agents,
    activeAgent,
    setActiveAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
  };
}
