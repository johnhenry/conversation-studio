export interface Comment {
  id: string;
  content: string;
  children: Comment[];
}