export const DEFAULT_USER_ID = "Samantha";
export const DEFAULT_COMMENT_TYPE = "user";
export const CYCLE_TYPES = ["user", "assistant", "system"];

const ENGLISH_VOICES = globalThis.speechSynthesis.getVoices().filter(({lang}) => lang === "en-US").map(({name})=>name);
console.log("ENGLISH_VOICES", ENGLISH_VOICES)
export const CYCLE_USER_IDS = ENGLISH_VOICES;

export interface GeneralConfig {
  storeLocally: boolean;
  logLevel: "error" | "warn" | "info" | "debug";
  debug: boolean;
  userId: string;
}

export interface AIBaseConfig {
  type: "api" | "window.ai" | "";
  provider: "openai" | "anthropic" | "gemini" | "ollama";
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  topK: number;
  maxTokens: number;
  seed: number;
  maxRetries: number;
  retryDelay: number;
  systemPrompt: string;
}

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

export interface ExportConfig {
  includeAttachment: boolean;
}

export interface AppConfig {
  general: GeneralConfig;
  ai: AIConfig;
  export: ExportConfig;
}

export const DEFAULT_GENERAL_CONFIG: GeneralConfig = {
  storeLocally: true,
  logLevel: "info",
  debug: false,
  userId: DEFAULT_USER_ID,
};

export const DEFAULT_AI_BASE_CONFIG: AIBaseConfig = {
  type: "",
  provider: "ollama",
  endpoint: "http://localhost:11434/v1/chat/completions",
  apiKey: "",
  model: "llama3.2:latest",
  temperature: 0.7,
  topK: 50,
  maxTokens: 1000,
  seed: 42,
  maxRetries: 3,
  retryDelay: 1000,
  systemPrompt:
    "You are a helpful and knowledgeable assistant. Provide clear, accurate, and concise responses that directly address the user's questions or comments. Be professional but friendly in your communication style.",
};

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'default-openai',
    name: 'OpenAI GPT-4',
    description: 'OpenAI GPT-4 for high-quality responses',
    config: {
      type: 'api',
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4',
      temperature: 0.7,
      topK: 50,
      maxTokens: 2048,
      seed: 42,
      maxRetries: 3,
      retryDelay: 1000,
      systemPrompt: 'You are a helpful and knowledgeable assistant. Provide clear, accurate, and concise responses that directly address the user\'s questions or comments. Be professional but friendly in your communication style.',
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
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      topK: 50,
      maxTokens: 2048,
      seed: 42,
      maxRetries: 3,
      retryDelay: 1000,
      systemPrompt: 'You are a helpful and knowledgeable assistant. Provide clear, accurate, and concise responses that directly address the user\'s questions or comments. Be professional but friendly in your communication style.',
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
      apiKey: '',
      model: 'llama3.2:latest',
      temperature: 0.7,
      topK: 50,
      maxTokens: 2048,
      seed: 42,
      maxRetries: 3,
      retryDelay: 1000,
      systemPrompt: 'You are a helpful and knowledgeable assistant. Provide clear, accurate, and concise responses that directly address the user\'s questions or comments. Be professional but friendly in your communication style.',
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
      provider: 'openai',
      endpoint: '',
      apiKey: '',
      model: '',
      temperature: 0.7,
      topK: 50,
      maxTokens: 2048,
      seed: 42,
      maxRetries: 3,
      retryDelay: 1000,
      systemPrompt: 'You are a helpful and knowledgeable assistant. Provide clear, accurate, and concise responses that directly address the user\'s questions or comments. Be professional but friendly in your communication style.',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const DEFAULT_AI_CONFIG: AIConfig = {
  agents: DEFAULT_AGENTS,
  activeAgentId: 'default-ollama', // Local Ollama as default
};

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  includeAttachment: true,
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  general: DEFAULT_GENERAL_CONFIG,
  ai: DEFAULT_AI_CONFIG,
  export: DEFAULT_EXPORT_CONFIG,
};

export const DEPTH_COLORS = [
  "bg-gray-700", // Level 0
  "bg-blue-700", // Level 1
  "bg-green-700", // Level 2
  "bg-purple-700", // Level 3
  "bg-orange-700", // Level 4
  "bg-red-700", // Level 5
];

export const DEPTH_TEXT = [
  "text-gray-700", // Level 0
  "text-blue-700", // Level 1
  "text-green-700", // Level 2
  "text-purple-700", // Level 3
  "text-orange-700", // Level 4
  "text-red-700", // Level 5
];
