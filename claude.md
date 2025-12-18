# Conversation Studio - Claude Context File

## Project Overview

**Conversation Studio** is a sophisticated web application for creating, managing, and exporting conversational data structures. It provides a visual forum-like interface for building multi-threaded conversations with AI assistance, supporting multiple AI providers through a unified agent-based system.

## Core Purpose

- **Visual conversation builder**: Create hierarchical comment threads with drag-and-drop
- **Multi-AI support**: Switch between OpenAI, Anthropic, Google Gemini, Ollama, and Chrome AI
- **Agent management**: Save multiple AI configurations as named agents
- **Export capabilities**: Export conversations to JSON, XML, or plain text
- **Local-first**: All data stored in browser localStorage

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build**: Vite 5.4.8
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: ai.matey (universal AI adapter library)
- **Storage**: Browser localStorage

## Project Structure

```
conversation-studio/
├── src/
│   ├── components/
│   │   ├── Comment.tsx              # Individual comment component
│   │   ├── CommentTree.tsx          # Recursive tree renderer
│   │   ├── CommentEditor.tsx        # Comment creation/editing form
│   │   ├── ExportPreview.tsx        # Export format previews
│   │   ├── Header.tsx               # Top navigation bar
│   │   ├── SettingsModal.tsx        # Settings dialog
│   │   ├── AgentManager.tsx         # Agent list and CRUD
│   │   ├── AgentEditor.tsx          # Agent editing form
│   │   └── AgentSwitcher.tsx        # Quick agent selector
│   ├── hooks/
│   │   ├── useAppConfig.ts          # Config state management
│   │   ├── useAgents.ts             # Agent CRUD operations
│   │   └── useModelFetcher.ts       # Fetch models from providers
│   ├── utils/
│   │   ├── backend-factory.ts       # Create AI backend adapters
│   │   ├── ir-helpers.ts            # IR format conversions
│   │   ├── agent-migration.ts       # Config migration utilities
│   │   └── import.ts                # Import functionality
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── config.ts                    # App configuration
│   └── App.tsx                      # Main application component
├── AGENT_SYSTEM_DESIGN.md           # Agent architecture documentation
├── AGENT_SYSTEM_IMPLEMENTED.md      # Implementation summary
├── FIXES_APPLIED.md                 # Bug fixes documentation
└── ARCHITECTURE_ANALYSIS.md         # ai.matey integration notes
```

## Key Features

### 1. View Modes

**Forum Mode (Default):**
- Hierarchical tree view of all conversations
- Color-coded nesting levels (blue → green → yellow → purple → orange → red)
- Navigate entire conversation structure
- Arrow keys navigate between threads/replies

**Chat Mode:**
- Linear conversation view focused on single thread
- Follow one conversation path
- Press 'm' or click forum/chat icon to toggle

### 2. Speech Synthesis

**Text-to-Speech:**
- Read conversations aloud
- Multiple English voices (cycles through available system voices)
- Voice per speaker/user ID
- Press 's' on selected comment to speak
- Automatic voice switching based on userId

### 3. Multi-Agent AI System

The application uses an **agent-based architecture** where each agent is a complete AI configuration:

```typescript
interface Agent {
  id: string;                  // Unique identifier (UUID)
  name: string;                // User-defined name
  description?: string;        // Optional notes
  config: AIBaseConfig;        // Provider settings
  createdAt: number;           // Timestamp
  updatedAt: number;           // Timestamp
}
```

**Default Agents:**
- OpenAI GPT-4
- Claude 3.5 Sonnet (Anthropic)
- Local Llama (Ollama)
- Chrome AI (window.ai)

### 2. AI Provider Support

**Supported Providers:**
- **OpenAI**: GPT-4, GPT-3.5-turbo, etc.
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus
- **Google Gemini**: Gemini Pro, Gemini Flash
- **Ollama**: Local LLMs (Llama, Mistral, etc.)
- **Chrome AI**: Browser built-in Gemini Nano (experimental)

**Features:**
- Auto-detect provider endpoints
- Fetch available models via API
- Custom endpoint configuration
- Per-agent API keys
- Temperature, Top-K, Max Tokens controls

### 4. Visual Design

**Color-Coded Nesting:**
- Each nesting level has unique color
- Depth 0 (root): Gray
- Depth 1: Blue
- Depth 2: Green
- Depth 3: Purple
- Depth 4: Orange
- Depth 5: Red
- Visual indicator makes navigation easy

**Fonts:**
- Primary: Montserrat
- Fallback: Inter

**Theme:**
- Dark mode design
- Gray/black backgrounds
- Color accents for hierarchy
- Tailwind CSS utility classes

### 5. Conversation Management

**Comment Structure:**
```typescript
interface Comment {
  id: string;
  userId: string;
  timestamp: number;
  content: string;
  contentHash: string;
  type: "user" | "assistant" | "system";
  attachments: Attachment[];
  children: Comment[];
  parentId?: string;
  deleted?: boolean;
}
```

**Operations:**
- Create, edit, delete comments
- Double-click comment to edit
- Nested replies (unlimited depth)
- Drag-and-drop reorganization
- Clone comments (with/without children)
- Auto-reply with AI (configurable depth and count)
- Type cycling (user → assistant → system)
- User ID customization (for multi-voice conversations)
- Speak comment (text-to-speech)
- Selection and focus management

### 4. Export Formats

**JSON Export:**
```json
{
  "comments": [...],
  "metadata": {
    "exportedAt": "timestamp",
    "totalComments": 10
  }
}
```

**XML Export:**
```xml
<conversation>
  <comment id="...">
    <userId>...</userId>
    <content>...</content>
    <children>...</children>
  </comment>
</conversation>
```

**Text Export:**
```
[User] Content here...
  [Assistant] Reply here...
    [User] Nested reply...
```

## Architecture

### Data Flow

```
User Action → App.tsx → State Update → Component Re-render
                ↓
         AI Generation (if needed)
                ↓
         Backend Adapter (ai.matey)
                ↓
         Provider API (OpenAI/Anthropic/etc.)
                ↓
         Response → State Update → UI Update
```

### AI Integration (ai.matey)

The app uses **ai.matey** for universal AI provider support:

**Backend Adapters:**
- `OpenAIBackendAdapter` - OpenAI API
- `AnthropicBackendAdapter` - Anthropic API
- `GeminiBackendAdapter` - Google Gemini API
- `OllamaBackendAdapter` - Local Ollama
- `ChromeAIBackendAdapter` - Browser window.ai

**IR Format (Intermediate Representation):**
```typescript
interface IRChatRequest {
  messages: IRMessage[];
  parameters: {
    model?: string;
    temperature?: number;
    topK?: number;
    maxTokens?: number;
  };
  metadata: {
    requestId: string;
    timestamp: number;
  };
  stream: boolean;
}
```

### State Management

**App Configuration:**
```typescript
interface AppConfig {
  general: {
    storeLocally: boolean;
    logLevel: "error" | "warn" | "info" | "debug";
    debug: boolean;
    userId: string;
  };
  ai: {
    agents: Agent[];
    activeAgentId: string | null;
  };
  export: {
    includeAttachment: boolean;
  };
}
```

**Storage:**
- All data persists to `localStorage`
- Key: `"conversation-studio-config"`
- Auto-save on every change
- Cross-tab sync via custom events

### Migration System

**Auto-migration from old config format:**
```typescript
// Old format (single AI config)
{ ai: { base: AIBaseConfig } }

// New format (multi-agent)
{ ai: { agents: Agent[], activeAgentId: string } }
```

**Migration process:**
1. Detect old format on load
2. Convert `ai.base` to first agent
3. Fix empty/invalid types (default to 'api')
4. Validate and repair
5. Save migrated config

## Component Guide

### AgentManager
**Location**: `src/components/AgentManager.tsx`

Displays list of all agents with management controls:
- Radio button selection for active agent
- Edit button (opens AgentEditor)
- Duplicate button (clones agent)
- Delete button (with confirmation)
- "New Agent" button

### AgentEditor
**Location**: `src/components/AgentEditor.tsx`

Modal form for editing agent configuration:
- Name and description fields
- AI type selector (API / Chrome AI)
- Provider dropdown (OpenAI/Anthropic/Gemini/Ollama)
- Endpoint, API key, model fields
- "Fetch Models" button (queries provider API)
- System prompt textarea
- Advanced parameters (collapsible)

### AgentSwitcher
**Location**: `src/components/AgentSwitcher.tsx`

Header dropdown for quick agent switching:
- Shows current agent name + provider + model
- Hover to reveal dropdown
- Click agent to switch instantly
- Visual indicator for active agent

### Comment
**Location**: `src/components/Comment.tsx`

Individual comment display with actions:
- Markdown rendering
- Reply, Auto-reply, Clone, Delete buttons
- Type cycling (user/assistant/system)
- User ID editing
- Attachment display
- Keyboard shortcuts

### CommentEditor
**Location**: `src/components/CommentEditor.tsx`

Comment creation/editing interface:
- Markdown editor with preview
- Attachment upload
- Auto-reply depth/count controls
- Submit/Cancel buttons
- Keyboard shortcuts (Cmd+Enter, Esc)

## Usage Guide

### Getting Started

1. **First Launch**: App loads with 4 default agents
2. **Select Agent**: Use header dropdown or Settings → AI
3. **Add API Key**: Edit agent, add your API key
4. **Create Comment**: Click "+" button or press 'n'
5. **Generate AI Reply**: Click sparkles icon or press Shift+R

### Creating an Agent

1. Settings → AI tab → "New Agent"
2. Set name (e.g., "GPT-4 Writer")
3. Choose provider (OpenAI)
4. Click "Fetch Models" to see available models
5. Select model (gpt-4)
6. Add API key
7. Customize system prompt
8. Save

### Switching Agents

**Method 1 - Header Switcher:**
- Hover over agent dropdown
- Click desired agent
- Instant switch

**Method 2 - Settings:**
- Settings → AI tab
- Click agent card
- Auto-switches

### Keyboard Shortcuts

**Comment Actions:**
- **n**: New comment
- **r**: Reply to selected comment
- **Shift+R**: AI auto-reply
- **c**: Clone comment
- **Shift+C**: Clone comment with children
- **e**: Edit comment (or double-click)
- **t**: Cycle comment type (user → assistant → system)
- **Delete**: Delete selected comment

**Navigation:**
- **↑/↓**: Navigate up/down comments
- **→/←**: Navigate next/previous thread (in chat mode)
- **m**: Toggle forum/chat mode

**Editor:**
- **Cmd/Ctrl+Enter**: Submit comment
- **Esc**: Cancel/close editor

**Other:**
- **s**: Speak selected conversation (text-to-speech)

### Exporting Conversations

1. Switch to desired format tab (Text/JSON/XML)
2. Copy from preview
3. Or use Settings → Export to configure options:
   - Include attachments
   - Truncate content
   - Max content length

## Configuration

### Environment Setup

No environment variables needed - all config in UI.

**For Development:**
```bash
npm install
npm run dev
```

**For Production:**
```bash
npm run build
npm run preview
```

### Provider Setup

**OpenAI:**
1. Get API key from https://platform.openai.com
2. Create agent with provider: OpenAI
3. Endpoint: `https://api.openai.com/v1` (default)
4. Add API key

**Anthropic:**
1. Get API key from https://console.anthropic.com
2. Create agent with provider: Anthropic
3. Endpoint: `https://api.anthropic.com/v1` (default)
4. Add API key

**Ollama (Local):**
1. Install Ollama: https://ollama.ai
2. Pull model: `ollama pull llama3.2`
3. Start server: `ollama serve`
4. Create agent with provider: Ollama
5. Endpoint: `http://localhost:11434` (default)
6. No API key needed

**Chrome AI:**
1. Chrome 129+ or Chrome Canary
2. Enable flags:
   - `chrome://flags/#optimization-guide-on-device-model`
   - `chrome://flags/#prompt-api-for-gemini-nano`
3. Download Gemini Nano
4. Create agent with type: Chrome AI
5. No API key needed

## Development Notes

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Tailwind for styling
- Lucide icons
- JSX/TSX files

### Key Patterns

**Hook Usage:**
- `useAppConfig()` - Global config state
- `useAgents()` - Agent CRUD operations
- `useModelFetcher()` - Fetch models from providers

**Backend Creation:**
```typescript
import { createBackendAdapter } from './utils/backend-factory';

const backend = createBackendAdapter(agentConfig);
const response = await backend.execute(irRequest);
```

**IR Conversion:**
```typescript
import { commentsToIRMessages, createIRRequest } from './utils/ir-helpers';

const irMessages = commentsToIRMessages(conversationMessages);
const request = createIRRequest(irMessages, { model, temperature });
```

### Testing Checklist

- [ ] Create agent
- [ ] Edit agent
- [ ] Delete agent
- [ ] Duplicate agent
- [ ] Switch active agent
- [ ] Fetch models
- [ ] Generate AI response
- [ ] Create comment
- [ ] Reply to comment
- [ ] Auto-reply (depth)
- [ ] Export JSON
- [ ] Export XML
- [ ] Export Text
- [ ] Import JSON
- [ ] Drag-and-drop comments
- [ ] Clone comment
- [ ] Delete comment

## Ollama CORS Configuration

When using Ollama (local LLM server), you must configure CORS origins:

**For Web Deployment:**
```bash
# MacOS/Linux
export OLLAMA_ORIGINS="https://conversation-studio.succinct.link"

# Windows (PowerShell)
$env:OLLAMA_ORIGINS="https://conversation-studio.succinct.link"

# Then start Ollama
ollama serve
```

**For Local Development:**
```bash
# MacOS/Linux
export OLLAMA_ORIGINS="https://localhost:5173"

# Windows (PowerShell)
$env:OLLAMA_ORIGINS="https://localhost:5173"

# Then start Ollama
ollama serve
```

**Installing Models:**
```bash
ollama pull llama3.2
ollama pull mistral
ollama list  # Show installed models
```

## Known Issues

### Import Functionality
- **JSON Import**: Works once, but requires page reload for subsequent imports
- **XML Import**: Currently not functional
- **Text Import**: Currently not functional

### Mobile Support
- **UI**: Controls are functional but somewhat clunky on mobile
- **Local AI**: Cannot connect to local OpenAI-compatible APIs from mobile devices on local network
- **Recommended**: Use cloud-based providers (OpenAI, Anthropic) on mobile

### Export
- All export formats work correctly
- Copy from preview or configure via Settings → Export

## Roadmap

### Planned Features

**Import Improvements:**
- Merge algorithm for importing (currently replaces all data)
- Fix XML and Text import
- Support for more formats

**Storage Options:**
- PGLite database integration
- External service connections:
  - Minio/AWS S3
  - IPFS
  - PostgreSQL
  - MCP (Model Context Protocol) servers

**AntiSocial Network Integration:**
- Original vision: interface for [AntiSocial Network](https://github.com/johnhenry/antisocial-network)
- Bring full circle integration

**Agent System Enhancements:**
- Agent tags/categories
- Agent templates library
- Usage statistics
- Cloud sync

**UI Improvements:**
- Better mobile experience
- Image attachments
- Code syntax highlighting
- Conversation templates
- Real-time collaboration

## Troubleshooting

### Agent shows "[inactive]"
- Edit agent
- Select "API Provider" from AI Type dropdown
- Choose provider and configure

### AI generation fails
- Check API key is set
- Verify endpoint is correct
- Check browser console for errors
- Ensure active agent has type set

### Model fetch fails
- Verify API key is valid
- Check network connectivity
- Some providers don't support model listing
- Check provider-specific documentation

### Chrome AI not available
- Requires Chrome 129+ or Canary
- Enable flags in chrome://flags
- Download Gemini Nano
- Check chrome://on-device-ai-internals

### Config reset to defaults
- Check localStorage quota
- Verify browser allows localStorage
- Check browser console for errors

## Recent Changes

### Agent System Implementation
- Replaced single AI config with multi-agent system
- Added AgentManager, AgentEditor, AgentSwitcher components
- Implemented migration from old config format
- Added model fetching per provider
- Auto-repair for invalid configs

### Bug Fixes
- Fixed `appConfig.ai.base` references in Comment/CommentEditor
- Fixed empty agent type defaulting to 'api'
- Fixed Ollama 404 errors with correct endpoint
- Fixed Anthropic CORS by provider-specific defaults
- Improved Chrome AI error messages

## Future Enhancements

**Potential Features:**
- Agent tags/categories
- Agent templates library
- Usage statistics per agent
- Agent export/import (JSON)
- Favorite/starred agents
- Search/filter agents
- Agent comparison view
- Cloud sync (requires backend)
- Real-time collaboration
- Voice input/output
- Image attachments
- Code syntax highlighting
- Conversation templates

## Contributing

When adding new features:
1. Follow existing code patterns
2. Update TypeScript types
3. Add to this claude.md
4. Test across all providers
5. Document in comments

## License

See LICENSE file in repository.

## Deployment

**Live Demo:**
- Web: https://conversation-studio.succinct.link
- Hosted on GitHub Pages (or similar)
- Fully client-side, no server required

**Local Development:**
```bash
git clone github.com/johnhenry/conversation-studio.git
cd conversation-studio
npm install
npm run dev
# Opens at https://localhost:5173
```

**Production Build:**
```bash
npm run build
npm run preview
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/johnhenry/conversation-studio/issues
- Documentation: See README.md
- Live Demo: https://conversation-studio.succinct.link

## Project History

**Key Milestones:**
- Initial release with forum-like interface
- Multi-provider AI support (OpenAI compatible)
- Speech synthesis with multiple voices
- Chat mode vs Forum mode
- Auto-reply with configurable depth
- Color-coded nesting levels
- Mobile responsiveness improvements
- Agent system implementation (multi-agent management)
- Model fetching from providers
- Migration system for backward compatibility

**Based on git log, notable features added:**
- Lateral comments management
- Type cycling (user/assistant/system)
- Selection and focus system
- Export settings configuration
- Attachment support
- Clone with children
- Double-click to edit
- Keyboard shortcut improvements
- Mobile UI enhancements
- Montserrat/Inter font integration

---

**Last Updated**: 2025-01-17
**Version**: Agent System v1.0
**Build**: TypeScript + React + Vite + ai.matey
**Repository**: https://github.com/johnhenry/conversation-studio
