export interface Comment {
  id: string;
  userId: string;
  timestamp: number;
  content: string;
  contentHash: string;
  attachments: Attachment[];
  children: Comment[];
  parentId?: string | null;
  deleted?: boolean;
  renderAttachment?: (attachment: Attachment) => React.ReactNode | null; // Add renderAttachment to CommentType
}

export interface Attachment {
  url: string;
  type?: string;
  name: string;
  file: File;
}

export type ExportFormat = "text" | "json" | "xml";
