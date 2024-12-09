import React, { useState, useEffect, useRef } from "react";
import { Trash2, GripVertical, ArrowBigUpDash, MessageSquare, Edit2, X, Check, File, Copy, Sparkles, CopyPlus } from "lucide-react";
import { Comment as CommentType, Attachment } from "../types";
import MarkdownPreview from "./MarkdownPreview";
import { CYCLE_USER_IDS, CYCLE_TYPES } from "src:/config";

interface CommentProps {
  comment: CommentType;
  onDelete?: (id: string) => void;
  onDragStart: (e: React.DragEvent, comment: CommentType) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onPopUp?: (id: string) => void;
  onReply?: (id: string, autoReply?: boolean) => void;
  onUserIdChange?: (id: string, newUserId: string) => void;
  onTypeChange?: (id: string, newType: string) => void;
  onUpdate?: (id: string, newContent: string, newAttachments: Attachment[]) => void;
  onClone?: (id: string, comment: CommentType) => void;
  onAttachmentUpload?: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachmentRemove?: (id: string, index: number) => void;
  canPopUp?: boolean;
  renderAttachment: (attachment: Attachment) => React.ReactNode;
  showDelete?: boolean;
  level: number;
  isBeingRepliedTo?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  disableEditing?: boolean;
}

const DEPTH_COLORS = [
  "bg-gray-700",     // Level 0
  "bg-blue-700",     // Level 1
  "bg-green-700",    // Level 2
  "bg-purple-700",   // Level 3
  "bg-orange-700",   // Level 4
  "bg-red-700",      // Level 5
];

const Comment: React.FC<CommentProps> = ({
  comment,
  onDelete,
  onDragStart,
  onDrop,
  onPopUp,
  onReply,
  onUserIdChange,
  onTypeChange,
  onUpdate,
  onClone,
  onAttachmentUpload,
  onAttachmentRemove,
  canPopUp,
  renderAttachment,
  showDelete,
  level,
  isBeingRepliedTo,
  isSelected,
  onSelect,
  disableEditing,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const commentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && commentRef.current) {
      const textarea = commentRef.current.querySelector('textarea');
      textarea?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isSelected && commentRef.current) {
      commentRef.current.focus();
    }
  }, [isSelected]);

  const handleUserIdClick = () => {
    if (!disableEditing && CYCLE_USER_IDS.includes(comment.userId)) {
      const currentIndex = CYCLE_USER_IDS.indexOf(comment.userId);
      const nextIndex = (currentIndex + 1) % CYCLE_USER_IDS.length;
      const newUserId = CYCLE_USER_IDS[nextIndex];
      onUserIdChange?.(comment.id, newUserId);
    }
  };

  const handleTypeClick = () => {
    if (!disableEditing && CYCLE_TYPES.includes(comment.type)) {
      const currentIndex = CYCLE_TYPES.indexOf(comment.type);
      const nextIndex = (currentIndex + 1) % CYCLE_TYPES.length;
      const newType = CYCLE_TYPES[nextIndex];
      onTypeChange?.(comment.id, newType);
    }
  };

  const handleEditSubmit = () => {
    if (onUpdate) {
      onUpdate(comment.id, editContent, comment.attachments);
      setIsEditing(false);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onAttachmentUpload) {
      onAttachmentUpload(comment.id, e);
    }
  };

  const handleAttachmentRemove = (index: number) => {
    if (onAttachmentRemove) {
      onAttachmentRemove(comment.id, index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleEditSubmit();
      } 
      else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditContent(comment.content);
      }
    } else {
      if (e.key === 'e' && !disableEditing) {
        e.preventDefault();
        setIsEditing(true);
      }
      else if (e.key === 'r' && onReply) {
        e.preventDefault();
        onReply(comment.id);
      }
      else if (e.key === 'a' && onReply) {
        e.preventDefault();
        onReply(comment.id, true); // Auto-reply
      }
      else if (e.key === 'l' && onClone) {
        e.preventDefault();
        onClone(comment.id, comment);
      }
      else if (e.key === 't' && !disableEditing) {
        e.preventDefault();
        handleTypeClick();
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(comment.content);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleAutoReply = () => {
    onReply?.(comment.id, true);
  };

  const handleClone = () => {
    onClone?.(comment.id, comment);
  };

  return (
    <div
      ref={commentRef}
      draggable={!isEditing && !disableEditing}
      onDragStart={(e) => !disableEditing && onDragStart(e, comment)}
      onDragOver={(e) => {
        if (!disableEditing) {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }
      }}
      onDragLeave={() => !disableEditing && setIsDragOver(false)}
      onDrop={(e) => {
        if (!disableEditing) {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          onDrop(e, comment.id);
        }
      }}
      className={`relative transition-all duration-200 group ${
        isDragOver ? "ring-2 ring-blue-500 ring-opacity-50" : ""
      }`}
      style={{ marginLeft: `${Math.max(0, level * 24)}px` }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`Comment by ${comment.userId}`}
    >
      {/* Indentation lines for nested comments */}
      {level > 0 && (
        <>
          {/* Current level connector */}
          <div className="absolute left-0 top-0 bottom-0 flex">
            <div 
              className={`w-[2px] relative ${DEPTH_COLORS[level % DEPTH_COLORS.length]}`}
              style={{ left: "-12px" }}
            >
              {/* Horizontal line */}
              <div
                className={`absolute top-[20px] w-[10px] h-[2px] ${DEPTH_COLORS[level % DEPTH_COLORS.length]}`}
                style={{ left: "0px" }}
              />
            </div>
          </div>
          
          {/* Parent level connectors */}
          {Array.from({ length: level - 1 }).map((_, index) => (
            <div
              key={index}
              className={`absolute left-0 top-0 bottom-0 w-[2px] ${DEPTH_COLORS[(level - index - 1) % DEPTH_COLORS.length]}`}
              style={{ left: `${-36 - index * 24}px` }}
            />
          ))}
        </>
      )}

      <div
        ref={commentRef}
        className={`relative rounded-lg transition-colors cursor-all-scroll outline-none
          ${isBeingRepliedTo ? "ring-2 ring-blue-500 ring-opacity-30 ring-inset" : ""}
          ${isDragOver ? "bg-[#1d2535]" : ""}
          ${isSelected 
            ? `${DEPTH_COLORS[level % DEPTH_COLORS.length]} bg-opacity-30` 
            : `hover:${DEPTH_COLORS[level % DEPTH_COLORS.length]} hover:bg-opacity-30`
          }
          focus-visible:ring-2 focus-visible:ring-blue-500
        `}
        draggable
        onDragStart={(e) => onDragStart(e, comment)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, comment.id)}
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          e.currentTarget.focus();
          onSelect?.();
        }}
        tabIndex={0}
        role="article"
        aria-selected={isSelected}
        data-comment-id={comment.id}
      >
        {/* Comment content section with proper padding to avoid grip overlap */}
        <div className="pl-8 pr-3 pt-3 pb-3">
          {/* Continuation line for comments with children */}
          <div
                className={`absolute top-[50%] w-[12px] h-[12px]  ${DEPTH_COLORS[(level + 1)  % DEPTH_COLORS.length]}`}
                style={{ left: "7px" }}
              />
          {comment.children.length > 0 && (
            <>

            <div
              className={`absolute w-[2px] ${DEPTH_COLORS[(level + 1) % DEPTH_COLORS.length]}`}
              style={{
                left: "12px",
                height: "50%",
                top: "50%"
              }}
            /></>
          )}

          {/* Header section with metadata */}
          <div className="flex items-center gap-2 text-xs mb-2">
          {canPopUp && !isEditing && !disableEditing && (
            <button
              onClick={() => onPopUp?.(comment.id)}
              title="Move up one level"
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <ArrowBigUpDash size={16} />
            </button>
          )}
            <button
              onClick={handleTypeClick}
              className="text-blue-400 hover:text-blue-300 cursor-pointer"
              title="Click to change type"
            >
              {comment.type}
            </button>
            <span className="text-gray-500">·</span>
            <button
              onClick={handleUserIdClick}
              className="text-blue-400 hover:text-blue-300 cursor-pointer"
              title="Click to change user ID"
            >
              {comment.userId}
            </button>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">
              {new Date(comment.timestamp).toLocaleString()}
            </span>
            <span className="text-gray-600 text-xs">
              [{comment.contentHash}]
            </span>
            {isBeingRepliedTo && (
              <>
                <span className="text-gray-500">·</span>
                <span className="text-blue-400">Replying to this comment</span>
              </>
            )}

          </div>

          {/* Content section */}
          <div 
            className="text-gray-300 leading-relaxed"
            onDoubleClick={() => !disableEditing && !isEditing && setIsEditing(true)}
          >
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[100px] p-2 bg-[#2A2A2B] text-gray-200 rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Write your comment..."
              />
            ) : (
              <>
                <MarkdownPreview content={comment.content} />
                {/* Attachments display in view mode */}
                <div className="mt-2 space-y-2">
                  {comment.attachments?.map((attachment, index) => (
                    <div key={index} className="relative">
                      {renderAttachment(attachment)}
                    </div>
                  ))}
                </div>
                {/* Reply count */}
                <div className="mt-2">
                  <div className="text-xs text-gray-500">
                    {comment.children.length > 0 && (
                      <span>
                        {comment.children.length}{" "}
                        {comment.children.length === 1 ? "reply" : "replies"}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex justify-end gap-2 p-2">
          {showDelete && !isEditing && !disableEditing && (
            <>
              <button
                onClick={handleAutoReply}
                title="Auto Reply"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Sparkles size={16} />
              </button>
              <button
                onClick={() => onReply?.(comment.id)}
                title="Reply"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <MessageSquare size={16} />
              </button>
              <button
                onClick={handleCopy}
                title="Copy content"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={handleClone}
                title="Clone comment (creates copy at same level)"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <CopyPlus size={16} />
              </button>
              <button
                onClick={() => onDelete?.(comment.id)}
                title="Delete comment"
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}

          {isEditing && (
            <>
              <button
                onClick={handleEditSubmit}
                title="Save changes"
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                title="Cancel editing"
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>

        {/* Attachment section in edit mode */}
        {isEditing && (
          <div className="space-y-2 p-2 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm text-gray-200">
                <File size={16} />
                <span>Add Attachment</span>
                <input
                  type="file"
                  onChange={handleAttachmentUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Display existing attachments */}
            {comment.attachments.length > 0 && (
              <div className="space-y-2">
                {comment.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="flex-1">
                      {renderAttachment(attachment)}
                    </div>
                    <button
                      onClick={() => handleAttachmentRemove(index)}
                      className="text-gray-400 hover:text-red-400"
                      title="Remove attachment"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
