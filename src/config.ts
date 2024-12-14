export const DEFAULT_USER_ID = "alice";
export const DEFAULT_COMMENT_TYPE = "user";
export const CYCLE_USER_IDS = ["alice", "bob", "charlie", "donna"];
export const CYCLE_TYPES = ["user", "assistant", "system"];

export interface AIConfig {
  type: "" | "openai" | "window.ai";
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  topK: number;
  maxTokens: number;
  seed: number;
  maxRetries: number;
  retryDelay: number;
  debug: boolean;
  logLevel: "error" | "warn" | "info" | "debug";
  systemPrompt: string;
  storeLocally: boolean;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  type: "window.ai",
  endpoint: "http://localhost:11434/v1/chat/completions",
  apiKey: "",
  model: "llama3.2:latest",
  temperature: 0.7,
  topK: 50,
  maxTokens: 1000,
  seed: 42,
  maxRetries: 3,
  retryDelay: 1000,
  debug: false,
  logLevel: "info",
  systemPrompt:
    "You are a helpful and knowledgeable assistant. Provide clear, accurate, and concise responses that directly address the user's questions or comments. Be professional but friendly in your communication style.",
  storeLocally: false,
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
