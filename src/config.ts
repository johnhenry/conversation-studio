export const DEFAULT_USER_ID = "alice";
export const DEFAULT_COMMENT_TYPE = "user";
export const CYCLE_USER_IDS = ["alice", "bob", "charlie", "donna"];
export const CYCLE_TYPES = ["user", "assistant", "system"];

export interface GeneralConfig {
  storeLocally: boolean;
  logLevel: "error" | "warn" | "info" | "debug";
  debug: boolean;
  userId: string;
}

export interface AIBaseConfig {
  type: "openai" | "window.ai" | "";
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

export interface AIConfig {
  base: AIBaseConfig;
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

export const DEFAULT_AI_CONFIG: AIConfig = {
  base: DEFAULT_AI_BASE_CONFIG,
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
