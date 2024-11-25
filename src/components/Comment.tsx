import React from "react";
import { Trash2, GripVertical, ArrowUp } from "lucide-react";
import { Comment as CommentType, Attachment } from "../types";
import MarkdownPreview from "./MarkdownPreview";

interface CommentProps {
  comment: CommentType;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, comment: CommentType) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onPopUp: (id: string) => void;
  canPopUp: boolean;
  renderAttachment: (attachment: Attachment) => React.ReactNode | null;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  onDelete,
  onDragStart,
  onDrop,
  onPopUp,
  canPopUp,
  renderAttachment,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, comment)}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e, comment.id);
      }}
      className={`relative p-4 rounded-lg border shadow-sm transition-all duration-200 border-gray-200 bg-white hover:border-blue-300 group`}
    >
      <div className="absolute left-0 top-0 bottom-0 px-2 flex items-center opacity-0 group-hover:opacity-100 cursor-move">
        <GripVertical size={18} className="text-gray-400" />
      </div>
      <div className="flex justify-between items-start gap-4 pl-6">
        <div className="flex-1">
          <div>
            <p className="font-bold">User ID: {comment.userId}</p>
            <p>Timestamp: {new Date(comment.timestamp).toLocaleString()}</p>
            <p>Content Hash: {comment.contentHash}</p>
          </div>
          <MarkdownPreview content={comment.content} />
          {comment.attachments.map((attachment) =>
            renderAttachment(attachment)
          )}
          {comment.children.length > 0 && (
            <div className="mt-1 text-sm text-gray-500">
              {comment.children.length}{" "}
              {comment.children.length === 1 ? "reply" : "replies"}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {canPopUp && (
            <button
              onClick={() => onPopUp(comment.id)}
              title="Move up one level"
              className="text-blue-500 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50"
            >
              <ArrowUp size={18} />
            </button>
          )}
          <button
            onClick={() => onDelete(comment.id)}
            title="Delete comment"
            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comment;
