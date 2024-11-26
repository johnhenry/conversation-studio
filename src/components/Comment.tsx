import React from "react";
import { Trash2, GripVertical, ArrowUp, MessageSquare } from "lucide-react";
import { Comment as CommentType, Attachment } from "../types";
import MarkdownPreview from "./MarkdownPreview";

interface CommentProps {
  comment: CommentType;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, comment: CommentType) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onPopUp: (id: string) => void;
  onReply: (id: string) => void;
  canPopUp: boolean;
  renderAttachment: (attachment: Attachment) => React.ReactNode | null;
  showDelete: boolean;
  level: number;
  isBeingRepliedTo?: boolean;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  onDelete,
  onDragStart,
  onDrop,
  onPopUp,
  onReply,
  canPopUp,
  renderAttachment,
  showDelete,
  level,
  isBeingRepliedTo,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, comment)}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDrop(e, comment.id);
      }}
      className={`relative transition-all duration-200 group ${
        isDragOver ? "ring-2 ring-blue-500 ring-opacity-50" : ""
      }`}
      style={{ marginLeft: `${Math.max(0, level * 20)}px` }}
    >
      {/* Indentation lines for nested comments */}
      {level > 0 && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-700"
            style={{ left: "-10px" }}
          />
          {Array.from({ length: level - 1 }).map((_, index) => (
            <div
              key={index}
              className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-700"
              style={{ left: `${-30 - index * 20}px` }}
            />
          ))}
        </>
      )}

      <div
        className={`relative rounded-md bg-[#1A1A1B] hover:bg-[#222223] border transition-all duration-200 ${
          isBeingRepliedTo
            ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-30"
            : "border-gray-700 hover:border-gray-600"
        } ${isDragOver ? "bg-[#1d2535]" : ""}`}
      >
        {/* Drag handle */}
        <div className="absolute left-0 top-0 bottom-0 px-2 flex items-center opacity-0 group-hover:opacity-100 cursor-move">
          <GripVertical
            size={16}
            className="text-gray-500 hover:text-gray-300"
          />
        </div>

        {/* Move Up button */}
        {canPopUp && (
          <button
            onClick={() => onPopUp(comment.id)}
            title="Move up one level"
            className="absolute right-2 top-2 text-gray-400 hover:text-blue-400 transition-colors z-10"
          >
            <ArrowUp size={16} />
          </button>
        )}

        {/* Delete button */}
        {showDelete && (
          <button
            onClick={() => onDelete(comment.id)}
            title="Delete comment"
            className="absolute right-2 bottom-2 text-gray-400 hover:text-red-400 transition-colors z-10"
          >
            <Trash2 size={16} />
          </button>
        )}

        <div className="flex flex-col pl-8 pr-8 py-3">
          {/* Header section */}
          <div className="flex items-center gap-2 text-xs mb-2">
            <span className="font-medium text-[#4fbcff]">
              User {comment.userId}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500">
              {new Date(comment.timestamp).toLocaleString()}
            </span>
            <span className="text-gray-600 text-xs">
              [{comment.contentHash.slice(0, 6)}]
            </span>
            {isBeingRepliedTo && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-blue-400">Replying to this comment</span>
              </>
            )}
          </div>

          {/* Content section */}
          <div className="text-gray-300 leading-relaxed">
            <MarkdownPreview content={comment.content} />
          </div>

          {/* Attachments */}
          <div className="mt-2">
            {comment.attachments.map((attachment) =>
              renderAttachment(attachment)
            )}
          </div>

          {/* Reply count and button */}
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {comment.children.length > 0 && (
                <span>
                  {comment.children.length}{" "}
                  {comment.children.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
            {showDelete && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 transition-colors"
              >
                <MessageSquare size={14} />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;
