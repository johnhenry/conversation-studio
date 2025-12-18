# Agent System Architecture Design

## Overview

Transform conversation-studio from single AI configuration to multi-agent management system where users can:
- Create multiple AI agent configurations (provider + model + settings + prompt)
- Save and name each agent configuration
- Switch between agents easily
- Set one agent as "active" for conversations

## Current vs Proposed Architecture

### Current (Single Config)
```typescript
interface AppConfig {
  general: {...}
  ai: {
    base: AIBaseConfig // Single config
  }
}
```

### Proposed (Multi-Agent)
```typescript
interface Agent {
  id: string;              // Unique identifier
  name: string;            // User-friendly name
  description?: string;    // Optional description
  config: AIBaseConfig;    // Provider, model, key, settings, prompt
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}

interface AppConfig {
  general: {...}
  ai: {
    agents: Agent[];           // List of saved agents
    activeAgentId: string | null;  // Currently selected agent
  }
}
```

## Design Decisions

### 1. Agent Identity
- **UUID-based IDs**: Use `crypto.randomUUID()` for unique identifiers
- **User-defined names**: Users can name agents (e.g., "GPT-4 Writer", "Claude Code Helper", "Local Llama")
- **Optional descriptions**: For notes about agent purpose

### 2. Data Storage
- **localStorage**: Store all agents in localStorage (same as current config)
- **Size considerations**:
  - Typical agent ~2-5KB (with long system prompt)
  - localStorage limit ~5-10MB
  - Practically supports 100+ agents
- **Migration**: Auto-migrate existing single config to first agent

### 3. Default Behavior
- **First launch**: Create 3-4 example agents (OpenAI, Anthropic, Ollama, Chrome AI)
- **No agents**: Show agent creation wizard
- **Active agent**: Remember last selected agent

### 4. UI/UX Strategy

#### Option A: Simple & Functional (RECOMMENDED)
- Settings modal: "Agents" tab alongside General/AI/Export
- Agent list with radio buttons for active selection
- Edit/Delete buttons per agent
- "New Agent" button to create
- Inline editing or modal for agent details

**Benefits:**
- Simple to implement
- Familiar UI patterns
- Foundation for future enhancements
- Low complexity

#### Option B: Advanced Management
- Separate agent manager with cards/tiles
- Search, filter, tags, favorites
- Drag-to-reorder
- Import/export agents
- Duplicate/clone functionality

**Benefits:**
- Power user features
- Better for many agents
- More professional

**Drawbacks:**
- More complex to build
- Might be overkill initially

#### Option C: Minimal Dropdown
- No dedicated agent manager
- Just a dropdown to select agent
- Edit active agent only
- "Save as new" to duplicate

**Benefits:**
- Minimal changes
- Quick to implement

**Drawbacks:**
- Limited functionality
- Hard to manage multiple agents
- Can't delete/rename easily

**DECISION: Start with Option A, evolve to Option B**

## Implementation Plan

### Phase 1: Core Data Layer ✓

**Files to modify:**
- `src/config.ts`

**Tasks:**
1. Define `Agent` interface
2. Update `AppConfig` interface
3. Create `DEFAULT_AGENTS` array
4. Update `DEFAULT_APP_CONFIG`
5. Add migration utility function

**New interfaces:**
```typescript
export interface Agent {
  id: string;
  name: string;
  description?: string;
  config: AIBaseConfig;
  createdAt: number;
  updatedAt: number;
}

export interface AIConfig {
  agents: Agent[];
  activeAgentId: string | null;
}
```

### Phase 2: Migration & Utilities ✓

**Files to create:**
- `src/utils/agent-migration.ts`
- `src/hooks/useAgents.ts`

**agent-migration.ts:**
```typescript
export function migrateToAgentSystem(oldConfig: any): AppConfig {
  // If already has agents, return as-is
  if (oldConfig.ai.agents) {
    return oldConfig;
  }

  // Create first agent from old single config
  const firstAgent: Agent = {
    id: crypto.randomUUID(),
    name: "Default Agent",
    config: oldConfig.ai.base,
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
```

**useAgents.ts:**
```typescript
export function useAgents() {
  const { appConfig, onAppConfigChange } = useContext(ConfigContext);

  const activeAgent = appConfig.ai.agents.find(
    a => a.id === appConfig.ai.activeAgentId
  );

  const setActiveAgent = (agentId: string) => {...};
  const createAgent = (name: string, config: AIBaseConfig) => {...};
  const updateAgent = (agentId: string, updates: Partial<Agent>) => {...};
  const deleteAgent = (agentId: string) => {...};
  const duplicateAgent = (agentId: string, newName: string) => {...};

  return {
    agents: appConfig.ai.agents,
    activeAgent,
    setActiveAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
  };
}
```

### Phase 3: Update Backend Integration ✓

**Files to modify:**
- `src/App.tsx`

**Tasks:**
1. Import agent utilities
2. Get active agent from config
3. Use active agent's config in `generateComment()`
4. Handle case when no active agent

**Changes:**
```typescript
// OLD
const backend = createBackendAdapter(appConfig.ai.base);

// NEW
const activeAgent = appConfig.ai.agents.find(
  a => a.id === appConfig.ai.activeAgentId
);
if (!activeAgent) {
  throw new Error('No active agent selected');
}
const backend = createBackendAdapter(activeAgent.config);
```

### Phase 4: Agent Management UI ✓

**Files to create:**
- `src/components/AgentManager.tsx`
- `src/components/AgentEditor.tsx`

**AgentManager.tsx:**
- List of all agents
- Show active agent (radio button or highlight)
- Create new agent button
- Edit/Delete buttons per agent
- Click agent to edit

**AgentEditor.tsx:**
- Form with all AIBaseConfig fields
- Agent name field at top
- Optional description
- All existing AI settings (provider, model, key, etc.)
- Save/Cancel buttons
- Reuse existing field components from SettingsModal

### Phase 5: Update Settings Modal ✓

**Files to modify:**
- `src/components/SettingsModal.tsx`

**Tasks:**
1. Add "Agents" tab
2. Replace current "AI" tab with AgentManager
3. Or keep "AI" tab and show AgentManager within it
4. Handle tab navigation

**Approach:**
- Keep tabs: General, AI, Export
- "AI" tab now shows AgentManager instead of single config form
- AgentManager handles all agent CRUD operations

### Phase 6: Main UI Agent Switcher ✓

**Files to modify:**
- `src/App.tsx` (add switcher to header)

**Tasks:**
1. Add agent dropdown in header
2. Show current active agent name + model
3. Allow quick switching between agents
4. Visual indicator when agent is active

**UI Location Options:**
- **Option A**: Top-right near settings button
- **Option B**: Below title, above conversation
- **Option C**: Floating button bottom-right

**DECISION: Option A - Top-right near settings**

### Phase 7: Polish & Testing ✓

**Tasks:**
1. Add default agents on first load
2. Validation (prevent deleting last agent)
3. Confirmation dialogs for delete
4. Error handling for invalid configs
5. Loading states
6. Empty states ("No agents yet")
7. Agent export/import (JSON)
8. Agent duplication with "(Copy)" suffix

## Key Considerations

### 1. Backward Compatibility
- Auto-migrate existing configs on load
- No data loss for existing users
- Preserve all settings from old format

### 2. Data Validation
- Ensure at least one agent exists
- Validate active agent ID points to existing agent
- Handle corrupted data gracefully

### 3. User Experience
- Clear which agent is active
- Easy to create new agents
- Fast switching between agents
- Visual feedback for operations

### 4. Security
- API keys stored per agent
- Don't expose keys in UI (password fields)
- Warning when deleting agent with configured key

### 5. Performance
- Efficient agent lookup (O(n) acceptable for <100 agents)
- Debounce auto-save on edits
- Lazy load agent editor

## File Structure

```
src/
├── config.ts                          [MODIFY] Add Agent interfaces
├── App.tsx                            [MODIFY] Use active agent
├── components/
│   ├── SettingsModal.tsx              [MODIFY] Add Agents tab
│   ├── AgentManager.tsx               [NEW] Manage agent list
│   ├── AgentEditor.tsx                [NEW] Edit single agent
│   └── AgentSwitcher.tsx              [NEW] Quick switcher in header
├── hooks/
│   ├── useAgents.ts                   [NEW] Agent CRUD operations
│   └── useModelFetcher.ts             [KEEP] Still used per agent
└── utils/
    ├── agent-migration.ts             [NEW] Migration logic
    └── backend-factory.ts             [KEEP] No changes needed
```

## Migration Path

### Step 1: Check for existing agents structure
```typescript
if (loadedConfig.ai.agents) {
  // Already migrated
  return loadedConfig;
}
```

### Step 2: Convert old config to first agent
```typescript
const firstAgent: Agent = {
  id: crypto.randomUUID(),
  name: deriveNameFromConfig(loadedConfig.ai.base), // e.g., "OpenAI GPT-4"
  config: loadedConfig.ai.base,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

### Step 3: Return migrated config
```typescript
return {
  ...loadedConfig,
  ai: {
    agents: [firstAgent],
    activeAgentId: firstAgent.id,
  },
};
```

## Default Agents (First Launch)

Create 4 example agents if none exist:

```typescript
const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'default-openai',
    name: 'OpenAI GPT-4',
    description: 'OpenAI GPT-4 for high-quality responses',
    config: {
      type: 'api',
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-4',
      apiKey: '',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      topK: 40,
      maxTokens: 2048,
      // ...
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default-anthropic',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic Claude for coding and analysis',
    config: {
      type: 'api',
      provider: 'anthropic',
      endpoint: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: '',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      topK: 40,
      maxTokens: 2048,
      // ...
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default-ollama',
    name: 'Local Llama',
    description: 'Run models locally with Ollama',
    config: {
      type: 'api',
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
      model: 'llama3.2:latest',
      apiKey: '',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      topK: 40,
      maxTokens: 2048,
      // ...
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default-chrome',
    name: 'Chrome AI',
    description: 'Browser built-in AI (Gemini Nano)',
    config: {
      type: 'window.ai',
      provider: 'openai', // Not used for window.ai
      endpoint: '',
      model: '',
      apiKey: '',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      topK: 40,
      maxTokens: 2048,
      // ...
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
```

## Benefits of Agent System

1. **Multi-Provider Workflow**: Quickly test same prompt across different providers
2. **Use Case Specialization**: Different agents for different tasks (coding, writing, analysis)
3. **Prompt Engineering**: Save different system prompts per agent
4. **Cost Management**: Switch between expensive and cheap models easily
5. **Experimentation**: Try different temperature/topK settings without losing configs
6. **Team Sharing**: Export/import agent configs
7. **Professional UX**: Similar to Postman environments, Bruno collections, etc.

## Potential Future Enhancements

- **Agent tags/categories**: Organize agents by purpose
- **Agent templates**: Pre-built agents for common tasks
- **Agent statistics**: Track usage, costs, response times
- **Agent chaining**: Use multiple agents in sequence
- **Favorite agents**: Pin frequently used agents
- **Search/filter**: Find agents by name/provider/model
- **Agent comparison**: Compare responses from multiple agents
- **Cloud sync**: Sync agents across devices (requires backend)
- **Agent marketplace**: Share/discover agent configs

## Risk Mitigation

### Data Loss Prevention
- Auto-backup before migration
- Export all agents to JSON before major changes
- Validate config after every change

### User Confusion
- Clear labels and descriptions
- Help text and tooltips
- Empty states with guidance
- Confirmation dialogs for destructive actions

### Performance Issues
- Lazy load agent list for 100+ agents
- Debounce search/filter
- Virtualize long lists if needed

## Testing Plan

1. **Migration Testing**
   - Load old config → verify migration
   - Load new config → no migration
   - Corrupted config → fallback to defaults

2. **CRUD Testing**
   - Create agent → appears in list
   - Update agent → changes saved
   - Delete agent → removed from list
   - Duplicate agent → creates copy

3. **Active Agent Testing**
   - Switch agent → updates active ID
   - Generate with agent → uses correct config
   - No active agent → shows error

4. **UI Testing**
   - All agents visible in list
   - Active agent highlighted
   - Edit form populated correctly
   - Validation works

5. **Edge Cases**
   - No agents exist
   - Delete last agent
   - Delete active agent
   - Invalid active agent ID

## Success Criteria

- ✅ Users can create multiple agents
- ✅ Users can switch between agents easily
- ✅ Active agent used for all AI operations
- ✅ All agent settings preserved
- ✅ Existing configs migrated automatically
- ✅ No data loss during migration
- ✅ Clear UI showing which agent is active
- ✅ Build succeeds with no errors
- ✅ All existing features still work

## Timeline Estimate

- **Phase 1-2** (Data layer + Migration): 1-2 hours
- **Phase 3** (Backend integration): 30 mins
- **Phase 4** (Agent Manager UI): 2-3 hours
- **Phase 5** (Settings Modal update): 1 hour
- **Phase 6** (Main UI switcher): 1 hour
- **Phase 7** (Polish & testing): 1-2 hours

**Total: 6-10 hours of focused development**

## Conclusion

This agent system transforms conversation-studio into a professional multi-AI management tool while maintaining simplicity and ease of use. The phased approach ensures we can deliver incrementally and test thoroughly at each step.
