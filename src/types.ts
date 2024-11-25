export interface Comment {
  id: string;
  userId: string;
  timestamp: number;
  content: string;
  contentHash: string;
  attachments: Attachment[];
  children: Comment[];
  parentId?: string | null;
}

export interface Attachment {
  url: string;
  type?: string;
  name: string;
  file: File;
}
