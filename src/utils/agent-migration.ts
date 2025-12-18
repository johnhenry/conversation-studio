/**
 * Agent Migration Utility
 * Converts old single AI config format to new multi-agent format
 */

import type { AppConfig, Agent, AIBaseConfig } from '../config';
import { DEFAULT_AGENTS } from '../config';

/**
 * Check if config is already using the new agent system
 */
export function isAgentSystemConfig(config: any): boolean {
  return (
    config?.ai?.agents !== undefined &&
    Array.isArray(config.ai.agents) &&
    config?.ai?.activeAgentId !== undefined
  );
}

/**
 * Generate a descriptive name from an AIBaseConfig
 */
function deriveAgentName(config: AIBaseConfig): string {
  if (config.type === 'window.ai') {
    return 'Chrome AI';
  }

  const providerNames: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Gemini',
    ollama: 'Ollama',
  };

  const providerName = providerNames[config.provider] || config.provider;
  const modelName = config.model || 'Unknown Model';

  return `${providerName} ${modelName}`;
}

/**
 * Migrate old single-config format to new agent system
 */
export function migrateToAgentSystem(oldConfig: any): AppConfig {
  // If already migrated, return as-is
  if (isAgentSystemConfig(oldConfig)) {
    return oldConfig as AppConfig;
  }

  console.log('Migrating config to agent system...');

  // Check if there's an old ai.base config to migrate
  if (oldConfig?.ai?.base) {
    // Create first agent from old config
    const migratedConfig = { ...oldConfig.ai.base };

    // Fix empty type (default to 'api' if empty)
    if (!migratedConfig.type || migratedConfig.type === '') {
      migratedConfig.type = 'api';
    }

    const firstAgent: Agent = {
      id: crypto.randomUUID(),
      name: deriveAgentName(migratedConfig),
      description: 'Migrated from previous configuration',
      config: migratedConfig,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return {
      ...oldConfig,
      ai: {
        agents: [firstAgent],
        activeAgentId: firstAgent.id,
      },
    };
  }

  // No previous config, return defaults with example agents
  return {
    ...oldConfig,
    ai: {
      agents: DEFAULT_AGENTS,
      activeAgentId: DEFAULT_AGENTS[0].id,
    },
  };
}

/**
 * Validate agent system config
 * Ensures data integrity
 */
export function validateAgentConfig(config: AppConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check agents array exists and is not empty
  if (!config.ai.agents || !Array.isArray(config.ai.agents)) {
    errors.push('agents array is missing or invalid');
  } else if (config.ai.agents.length === 0) {
    errors.push('agents array is empty');
  }

  // Check activeAgentId exists and points to valid agent
  if (!config.ai.activeAgentId) {
    errors.push('no active agent selected');
  } else {
    const activeAgent = config.ai.agents.find(
      (a) => a.id === config.ai.activeAgentId
    );
    if (!activeAgent) {
      errors.push(`active agent ID "${config.ai.activeAgentId}" not found in agents list`);
    }
  }

  // Check each agent has required fields
  config.ai.agents?.forEach((agent, index) => {
    if (!agent.id) {
      errors.push(`agent at index ${index} missing id`);
    }
    if (!agent.name) {
      errors.push(`agent at index ${index} missing name`);
    }
    if (!agent.config) {
      errors.push(`agent at index ${index} missing config`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Repair broken agent config by applying fixes
 */
export function repairAgentConfig(config: AppConfig): AppConfig {
  const repaired = { ...config };

  // If no agents, add defaults
  if (!repaired.ai.agents || repaired.ai.agents.length === 0) {
    repaired.ai.agents = DEFAULT_AGENTS;
  }

  // If no active agent or invalid ID, set to first agent
  if (!repaired.ai.activeAgentId) {
    repaired.ai.activeAgentId = repaired.ai.agents[0].id;
  } else {
    const activeExists = repaired.ai.agents.some(
      (a) => a.id === repaired.ai.activeAgentId
    );
    if (!activeExists) {
      repaired.ai.activeAgentId = repaired.ai.agents[0].id;
    }
  }

  // Ensure all agents have required fields
  repaired.ai.agents = repaired.ai.agents.map((agent, index) => {
    const baseConfig = agent.config || DEFAULT_AGENTS[0].config;

    // Fix empty type (default to 'api' if empty)
    const fixedConfig = { ...baseConfig };
    if (!fixedConfig.type || fixedConfig.type === '') {
      fixedConfig.type = 'api';
    }

    return {
      id: agent.id || crypto.randomUUID(),
      name: agent.name || `Agent ${index + 1}`,
      description: agent.description,
      config: fixedConfig,
      createdAt: agent.createdAt || Date.now(),
      updatedAt: agent.updatedAt || Date.now(),
    };
  });

  return repaired;
}
