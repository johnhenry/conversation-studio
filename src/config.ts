export const DEFAULT_USER_ID = "alice";
export const DEFAULT_COMMENT_TYPE = "user";
export const CYCLE_USER_IDS = ["alice", "bob", "charlie", "donna"];
export const CYCLE_TYPES = ["user", "assistant", "system"];

export interface AIConfig {
  type: string;
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
  logLevel: string;
  systemPrompt: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  type: "window.ai", // Set a default AI provider
  endpoint: "http://localhost:11434/v1/chat/completions", // OpenAI's standard endpoint
  apiKey: "", // This should be provided by the user
  model: "llama3.2:latest", // A good default model that balances capability and cost
  temperature: 0.7, // Good balance between creativity and consistency
  topK: 50, // Reasonable value for diverse but relevant responses
  maxTokens: 1000, // Sufficient for most responses while managing costs
  seed: 42, // Standard seed for reproducibility
  maxRetries: 3, // Reasonable number of retries for failed requests
  retryDelay: 1000, // 1 second delay between retries
  debug: false, // Debug off by default
  logLevel: "info", // Informative logging by default
  systemPrompt:
    "You are a helpful and knowledgeable assistant. Provide clear, accurate, and concise responses that directly address the user's questions or comments. Be professional but friendly in your communication style.",
};


export const DEPTH_COLORS = [
    "bg-gray-700",     // Level 0
    "bg-blue-700",     // Level 1
    "bg-green-700",    // Level 2
    "bg-purple-700",   // Level 3
    "bg-orange-700",   // Level 4
    "bg-red-700",      // Level 5
  ];
export const DEPTH_TEXT = [
    "text-gray-700",     // Level 0
    "text-blue-700",     // Level 1
    "text-green-700",    // Level 2
    "text-purple-700",   // Level 3
    "text-orange-700",   // Level 4
    "text-red-700",      // Level 5
];