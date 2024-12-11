export const DEFAULT_USER_ID = "alice";
export const DEFAULT_COMMENT_TYPE =  "user";
export const CYCLE_USER_IDS =  [
    "alice",
    "bob",
    "charlie",
    "donna",
];
export const CYCLE_TYPES =["user", "assistant", "system"];

export interface AIConfig {
    endpoint: string;
    model: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
    endpoint: "http://localhost:11434/v1/chat/completions",
    model: "llama3.2:latest"
};
