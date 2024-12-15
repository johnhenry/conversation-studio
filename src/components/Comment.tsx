import React, { useState, useRef, useEffect } from "react";
import {
  Trash2,
  ChartNoAxesGantt,
  ArrowBigUpDash,
  MessageSquare,
  Speech,
  Menu,
  X,
  Check,
  File,
  Copy,
  Sparkles,
  CopyPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Comment as CommentType, Attachment } from "../types";
import MarkdownPreview from "./MarkdownPreview";
import { CYCLE_TYPES } from "src:/config";
import { DEPTH_COLORS, DEPTH_TEXT } from "src:/config";
import { AppConfig } from "../config";

interface CommentProps {
  comment: CommentType;
  onDelete?: (id: string) => void;
  onDragStart: (e: React.DragEvent, comment: CommentType) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onPopUp?: (id: string) => void;
  onReply?: (id: string, autoReply?: number) => void;
  onTypeChange?: (id: string, newType: string) => void;
  onUpdate?: (
    id: string,
    newContent: string,
    newAttachments: Attachment[]
  ) => void;
  onClone?: (id: string, comment: CommentType, cloneChildren?: boolean) => void;
  onAttachmentUpload?: (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onAttachmentRemove?: (id: string, index: number) => void;
  canPopUp?: boolean;
  renderAttachment: (attachment: Attachment) => React.ReactNode;
  showDelete?: boolean;
  level: number;
  isBeingRepliedTo?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  disableEditing?: boolean;
  appConfig: AppConfig;
  chatFocustId: string;
  setChatFocustId: (mode: string) => void;
  siblingInfo?: {
    currentIndex: number;
    totalSiblings: number;
    onNavigate: (direction: "prev" | "next") => void;
  };
  onGenerate: (props: {
    parentId: string;
    attachments?: Attachment[];
    userId?: string;
    autoReply?: number;
  }) => void;
  onSpeak: (commentId: string) => void;
  isSpeaking: boolean;
  comments: CommentType[];
}

const Comment: React.FC<CommentProps> = ({
  comment,
  onDelete,
  onDragStart,
  onDrop,
  onPopUp,
  onReply,
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
  appConfig,
  chatFocustId,
  setChatFocustId,
  siblingInfo,
  onGenerate,
  onSpeak,
  isSpeaking,
  comments,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const commentRef = useRef<HTMLDivElement>(null);
  const indent = !chatFocustId ? 24 : 0;

  useEffect(() => {
    setEditContent(comment.content);
  }, [comment.content]);

  const handleUserIdClick = () => {
    // No longer cycles through user IDs
    return;
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
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    if (e.key === "Enter" && !e.shiftKey && !isEditing) {
      e.preventDefault();
      setIsEditing(true);
    } else if (e.key === "r" && onReply && !isEditing) {
      e.preventDefault();
      onReply(comment.id, 0);
    } else if (e.key === "R" && onReply && !isEditing) {
      e.preventDefault();
      onGenerate?.({ parentId: comment.id });
    } else if (e.key === "s" && !isEditing) {
      e.preventDefault();
      onSpeak(comment.id);
    } else if (e.key === "c" && onClone && !isEditing) {
      e.preventDefault();
      onClone(comment.id, comment, false);
    } else if (e.key === "C" && onClone && !isEditing) {
      e.preventDefault();
      onClone(comment.id, comment, true);
    } else if (e.key === "t" && !disableEditing && !isEditing) {
      e.preventDefault();
      handleTypeClick();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(comment.content);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleAutoReply = () => {
    onGenerate?.({ parentId: comment.id });
  };

  const handleClone = () => {
    onClone?.(comment.id, comment, false);
  };

  const depth_bg = chatFocustId
    ? DEPTH_COLORS[0]
    : DEPTH_COLORS[(level + 1) % DEPTH_COLORS.length];
  const depth_text = chatFocustId
    ? DEPTH_TEXT[0]
    : DEPTH_TEXT[(level + 1) % DEPTH_TEXT.length];

  const prev_depth_bg = chatFocustId
    ? DEPTH_COLORS[0]
    : DEPTH_COLORS[level % DEPTH_COLORS.length];

  let commentTitle = "User Type";
  switch (comment.type) {
    case "user":
      commentTitle += "\nClick -> assistant";
      break;
    case "assistant":
      commentTitle += "\nClick -> system";
      break;
    case "system":
      commentTitle += "\nClick -> user";
      break;
  }

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
        isDragOver ? "ring-2 ring-gray-700" : ""
      }`}
      style={{ marginLeft: `${Math.max(0, level * indent)}px` }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`Comment by ${comment.userId}`}
    >
      {/* Indentation lines for nested comments */}
      {comment.children.length > 0 && !chatFocustId && (
        <>
          <div
            className={`absolute w-[2px] ${depth_bg}`}
            style={{
              left: indent / 2 + "px",
              height: "50%",
              top: "50%",
            }}
          />
        </>
      )}
      {level > 0 && !chatFocustId && (
        <>
          {/* Current level connector */}
          <div className="absolute left-0 top-0 bottom-0 flex">
            <div
              className={`w-[2px] relative ${prev_depth_bg}`}
              style={{ left: (-1 * indent) / 2 + "px" }}
            >
              {/* Horizontal line */}
              <div
                className={`absolute top-[20px] w-[12px] h-[2px] ${prev_depth_bg}`}
                style={{ left: "0px" }}
              />
            </div>
          </div>

          {/* Parent level connectors */}
          {Array.from({ length: level - 1 }).map((_, index) => (
            <div
              key={index}
              className={`absolute left-0 top-0 bottom-0 w-[2px] ${
                DEPTH_COLORS[(level - index - 1) % DEPTH_COLORS.length]
              }`}
              style={{ left: `${-(1.5 + index) * indent}px` }}
            />
          ))}
        </>
      )}

      <div
        ref={commentRef}
        className={`relative transition-colors cursor-all-scroll outline-none rounded-lg
          ${
            isBeingRepliedTo
              ? "ring-2 ring-gray-700"
              : ""
          }
          ${isDragOver ? "bg-[#2A2A2B]" : ""}
          ${
            isSelected
              ? "bg-[#2A2A2B]"
              : "hover:bg-[#2A2A2B]"
          }
          focus-visible:ring-2 focus-visible:ring-gray-700 level-${level}
        `}
        draggable
        onDragStart={(e) => onDragStart(e, comment)}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragOver) {
            setIsDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          onDrop(e, comment.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        tabIndex={0}
        role="article"
        aria-selected={isSelected ? true : false}
        data-comment-id={comment.id}
      >
        {/* Comment content section with proper padding to avoid grip overlap */}
        <div className="pl-8 pr-3 pt-3 pb-3">
          {/* Continuation line for comments with children */}
          <div
            className={`absolute top-[50%] w-[12px] h-[12px] rounded-full ${depth_bg}`}
            style={{ left: "7px" }}
          />

          {/* Header section with metadata */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 text-xs mb-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Sibling Navigation Controls in Chat Mode */}
              {chatFocustId && siblingInfo && siblingInfo.totalSiblings > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => siblingInfo.onNavigate("prev")}
                    className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-700"
                    title="Previous sibling"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-gray-400 min-w-[3ch] text-center">
                    {siblingInfo.currentIndex + 1}/{siblingInfo.totalSiblings}
                  </span>
                  <button
                    onClick={() => siblingInfo.onNavigate("next")}
                    className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-700"
                    title="Next sibling"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2 flex-wrap">
                {canPopUp && !isEditing && !disableEditing && (
                  <button
                    onClick={() => onPopUp?.(comment.id)}
                    title="Move up one level"
                    className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-700"
                  >
                    <ArrowBigUpDash size={16} />
                  </button>
                )}
                <button
                  onClick={handleTypeClick}
                  className={`text-gray-300 hover:text-gray-100 transition-colors`}
                  title={commentTitle}
                >
                  {comment.type}
                </button>
                <button
                  onClick={handleUserIdClick}
                  className={`text-gray-300 hover:text-gray-100 transition-colors`}
                  title="User Id"
                >
                  {comment.userId}
                </button>
                <span className="text-gray-500 hidden md:inline">·</span>
                <span className="text-gray-500 text-[11px]">
                  {new Date(comment.timestamp).toLocaleString()}
                </span>
                <span className="text-gray-600 text-[11px] hidden md:inline">
                  [{comment.contentHash}]
                </span>
              </div>
            </div>

            {/* Action buttons */}
            {showDelete && !isEditing && !disableEditing && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2 md:mt-0 md:ml-auto">
                <button
                  title={chatFocustId === "" ? "Forum Mode" : "Chat Mode"}
                  onClick={() => {
                    if (chatFocustId) {
                      setChatFocustId("");
                    } else {
                      setChatFocustId(comment.id);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-700"
                >
                  {!chatFocustId ? (
                    <ChartNoAxesGantt size={16} />
                  ) : (
                    <Menu size={16} />
                  )}
                </button>
                <button
                  onClick={() => onReply?.(comment.id, 0)}
                  title={`Reply\nkey: r`}
                  className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-700"
                >
                  <MessageSquare size={16} />
                </button>
                {appConfig.ai.base.type && (
                  <button
                    onClick={handleAutoReply}
                    title={`Auto Reply\nkey: shift + r`}
                    className="p-1.5 text-gray-400 hover:text-green-400 transition-colors rounded-lg hover:bg-gray-700"
                  >
                    <Sparkles size={16} />
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  title={`Copy Text`}
                  className="p-1.5 text-gray-400 hover:text-yellow-400 transition-colors rounded-lg hover:bg-gray-700"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={handleClone}
                  title={`Clone\nkey: c\n---\nw/ replies\nkey: shift + c`}
                  className="p-1.5 text-gray-400 hover:text-orange-400 transition-colors rounded-lg hover:bg-gray-700"
                >
                  <CopyPlus size={16} />
                </button>
                <button
                  onClick={() => onSpeak(comment.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title={isSpeaking ? "Stop Speaking" : "Speak Messages"}
                >
                  {isSpeaking ? <X size={16} /> : <Speech size={16} />}
                </button>
                <button
                  onClick={() => onDelete?.(comment.id)}
                  title="Delete"
                  className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {isEditing && (
              <div className="flex items-center gap-1.5 mt-2 md:mt-0 md:ml-auto">
                <button
                  onClick={handleEditSubmit}
                  title={`Save changes\nkey: cmd + enter`}
                  className="p-1.5 text-gray-400 hover:text-green-400 transition-colors rounded-lg hover:bg-gray-700"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  title={`Cancel editing\nkey: esc`}
                  className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Content section */}
          <div
            className="text-gray-300 leading-relaxed"
            onDoubleClick={() =>
              !disableEditing && !isEditing && setIsEditing(true)
            }
          >
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[120px] p-3 bg-[#2A2A2B] text-gray-200 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-base"
                placeholder="Write your comment..."
              />
            ) : (
              <>
                <MarkdownPreview content={comment.content} />
                {/* Attachments display in view mode */}
                <div className="mt-3 space-y-3">
                  {comment.attachments?.map((attachment, index) => (
                    <div key={index} className="relative">
                      {renderAttachment(attachment)}
                    </div>
                  ))}
                </div>
                {/* Reply count */}
                {comment.children.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    {comment.children.length}{" "}
                    {comment.children.length === 1 ? "reply" : "replies"}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Attachment section in edit mode */}
        {isEditing && (
          <div className="space-y-3 p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 transition-colors">
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
              <div className="space-y-3">
                {comment.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-sm bg-gray-800 p-2 rounded-lg"
                  >
                    <div className="flex-1">{renderAttachment(attachment)}</div>
                    <button
                      onClick={() => handleAttachmentRemove(index)}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-700"
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
