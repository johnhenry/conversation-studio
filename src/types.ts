export interface Comment {
  id: string;
  content: string;
  children: Comment[];
  userId: string;
  timestamp: number;
  contentHash: string;
  attachments: Attachment[];
}

export interface Attachment {
  type: string;
  url: string;
}
