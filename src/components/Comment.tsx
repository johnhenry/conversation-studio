import React, { useState } from "react";
import { Trash2, GripVertical, ArrowUp, MessageSquare, Edit2, X, Check, File } from "lucide-react";
import { Comment as CommentType, Attachment } from "../types";
import MarkdownPreview from "./MarkdownPreview";

interface CommentProps {
  comment: CommentType;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, comment: CommentType) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onPopUp: (id: string) => void;
  onReply: (id: string) => void;
  onUserIdChange?: (commentId: string, newUserId: string) => void;
  onUpdate?: (commentId: string, content: string, attachments: Attachment[]) => void;
  onAttachmentUpload?: (commentId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachmentRemove?: (commentId: string, index: number) => void;
  canPopUp: boolean;
  renderAttachment: (attachment: Attachment) => React.ReactNode | null;
  showDelete: boolean;
  level: number;
  isBeingRepliedTo?: boolean;
}

const CYCLE_USER_IDS = ["user", "assistant", "system"];

const Comment: React.FC<CommentProps> = ({
  comment,
  onDelete,
  onDragStart,
  onDrop,
  onPopUp,
  onReply,
  onUserIdChange,
  onUpdate,
  onAttachmentUpload,
  onAttachmentRemove,
  canPopUp,
  renderAttachment,
  showDelete,
  level,
  isBeingRepliedTo,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleUserIdClick = () => {
    if (CYCLE_USER_IDS.includes(comment.userId)) {
      const currentIndex = CYCLE_USER_IDS.indexOf(comment.userId);
      const nextIndex = (currentIndex + 1) % CYCLE_USER_IDS.length;
      const newUserId = CYCLE_USER_IDS[nextIndex];
      onUserIdChange?.(comment.id, newUserId);
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
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(comment.content);
    }
  };

  return (
    <div
      draggable={!isEditing}
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
        className={`relative bg-[#1A1A1B] hover:bg-[#222223] transition-all duration-200 ${
          isBeingRepliedTo ? "ring-2 ring-blue-500 ring-opacity-30" : ""
        } ${isDragOver ? "bg-[#1d2535]" : ""}`}
      >
        {/* Drag handle */}
        {!isEditing && (
          <div className="absolute left-0 top-0 bottom-0 px-2 flex items-center opacity-0 group-hover:opacity-100 cursor-move">
            <GripVertical
              size={16}
              className="text-gray-500 hover:text-gray-300"
            />
          </div>
        )}

        {/* Move Up button */}
        {canPopUp && !isEditing && (
          <button
            onClick={() => onPopUp(comment.id)}
            title="Move up one level"
            className="absolute right-8 top-2 text-gray-400 hover:text-blue-400 transition-colors z-10"
          >
            <ArrowUp size={16} />
          </button>
        )}

        {/* Reply button */}
        {showDelete && !isEditing && (
          <button
            onClick={() => onReply(comment.id)}
            title="Reply"
            className="absolute right-2 top-2 text-gray-400 hover:text-blue-400 transition-colors z-10"
          >
            <MessageSquare size={16} />
          </button>
        )}

        {/* Edit/Save buttons */}
        {showDelete && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            title="Edit comment"
            className="absolute right-8 bottom-2 text-gray-400 hover:text-blue-400 transition-colors z-10"
          >
            <Edit2 size={16} />
          </button>
        )}

        {isEditing && (
          <>
            <button
              onClick={handleEditSubmit}
              title="Save changes"
              className="absolute right-8 bottom-2 text-gray-400 hover:text-green-400 transition-colors z-10"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              title="Cancel editing"
              className="absolute right-2 bottom-2 text-gray-400 hover:text-red-400 transition-colors z-10"
            >
              <X size={16} />
            </button>
          </>
        )}

        {/* Delete button */}
        {showDelete && !isEditing && (
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
            <span
              className={`font-medium text-[#4fbcff] ${
                CYCLE_USER_IDS.includes(comment.userId)
                  ? "cursor-pointer hover:text-[#7fccff]"
                  : ""
              }`}
              onClick={handleUserIdClick}
            >
              {comment.userId}
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
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full min-h-[100px] bg-[#2A2A2B] text-gray-200 p-2 rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Write your comment..."
                />
                
                {/* Attachment section in edit mode */}
                <div className="space-y-2">
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

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <MarkdownPreview content={comment.content} />
            )}
          </div>

          {/* Attachments */}
          <div className="mt-2">
            {comment.attachments.map((attachment, index) => (
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
        </div>
      </div>
    </div>
  );
};

export default Comment;
