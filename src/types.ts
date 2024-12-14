import { ReactNode } from "react";

// Base attachment type
export interface Attachment {
  url: string;
  type?: string;
  name: string;
  file: File;
}

// Base comment type without UI-specific properties
export interface CommentData {
  id: string;
  userId: string;
  type: string;
  timestamp: number;
  content: string;
  contentHash: string;
  attachments: Attachment[];
  children: CommentData[];
  parentId?: string | null;
  deleted?: boolean;
  newAction?: "" | "auto-reply";
}

// UI-specific comment type
export interface Comment extends CommentData {
  renderAttachment?: (attachment: Attachment) => ReactNode | null;
}

// Export format type
export type ExportFormat = "text" | "json" | "xml";

// Props type for ExportPreview component
export interface ExportPreviewProps {
  comments: CommentData[];
  format: ExportFormat;
  exportSettings: ExportSettings;
}

// Props type for CommentTree component
export interface CommentTreeProps {
  comments: Comment[];
  updateComments: (comments: Comment[]) => void;
  level: number;
  parentId?: string | null;
  rootComments?: Comment[];
  rootUpdateComments?: (comments: Comment[]) => void;
  isPreview?: boolean;
  renderAttachment: (attachment: Attachment) => ReactNode | null;
  onReply?: (id: string) => void;
  replyToId?: string;
}

// Props type for CommentEditor component
export interface CommentEditorProps {
  onSubmit: (
    content: string,
    attachments: Attachment[],
    parentId?: string,
    type?: string
  ) => void;
  userId: string;
  setUserId: (userId: string) => void;
  commentType: string;
  setCommentType: (type: string) => void;
  attachments: Attachment[];
  onAttachmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachmentRemove: (index: number) => void;
  content: string;
  setContent: (content: string) => void;
  buttonText?: string;
  parentId?: string;
  onCancel?: () => void;
  rootComments?: Comment[];
  autoSetUserId?: string;
  autoGenerate?: boolean;
}

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
  systemPrompt?: string;
}

// Export settings type
export interface ExportSettings {
  includeAttachmentUrls: boolean;
  truncateContent: boolean;
  maxContentLength?: number;
}

// Props type for SettingsModal component
export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIConfig;
  onAIConfigChange: (config: AIConfig) => void;
  exportSettings: ExportSettings;
  onExportSettingsChange: (settings: ExportSettings) => void;
}

export type ADD_COMMENT_PROPS = {
  content: string;
  attachments: Attachment[];
  parentId?: string;
  commentType: string;
  // autoReply?: boolean,
  // autoGenerate?: boolean,
  // generateContent?:boolean
  // abortController?: AbortController
};
