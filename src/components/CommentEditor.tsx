import type { ADD_COMMENT_PROPS } from "../types";
import { AppConfig } from "../config";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquarePlus, X, File, Sparkles, ChevronDown } from "lucide-react";
import { Comment as CommentType, Attachment } from "../types";
import CommentTree from "./CommentTree";
import { exportComments } from "../utils/export";
import { CYCLE_TYPES, DEFAULT_COMMENT_TYPE } from "src:/config";

interface CommentEditorProps {
  onSubmit: (props: ADD_COMMENT_PROPS) => void;
  onGenerate: (props: {
    parentId: string;
    attachments?: Attachment[];
    userId?: string;
    autoReply?: number;
    autoReplyCount?: number;
  }) => void;
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  attachments: CommentType["attachments"];
  onAttachmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachmentRemove: (index: number) => void;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  parentId?: string;
  onCancel?: () => void;
  rootComments?: CommentType[];
  autoSetUserId?: string;
  autoGenerate?: boolean;
  appConfig: AppConfig;
}

type PreviewTab = "edit" | "preview" | "text" | "json" | "xml";

const CommentEditor: React.FC<CommentEditorProps> = ({
  onSubmit,
  onGenerate,
  userId,
  setUserId,
  attachments,
  onAttachmentUpload,
  onAttachmentRemove,
  content,
  setContent,
  parentId,
  onCancel,
  rootComments = [],
  autoSetUserId,
  autoGenerate,
  appConfig,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>("edit");
  const [previewData, setPreviewData] = useState("");
  const [contentHash, setContentHash] = useState("");
  const [previewUserId, setPreviewUserId] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [parents, setParents] = useState<CommentType[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [commentType, setCommentType] = useState(DEFAULT_COMMENT_TYPE);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [autoReply, setAutoReply] = useState(autoGenerate ? 1 : 0);
  const [autoReplyCount, setAutoReplyCount] = useState(1);
  const [previewChatFocusId, setPreviewChatFocusId] = useState("");
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  // Focus the editor when it becomes visible
  useEffect(() => {
    if (isVisible && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitComment();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit comment with Cmd/Ctrl + Enter
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitComment();
    }
    // Cancel editing with Escape
    else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  const handleClose = () => {
    setUserId(appConfig.general.userId);
    setAutoReply(0);
    setAutoReplyCount(1);
    setIsVisible(false);
    // Wait for fade animation to complete before calling onCancel
    setTimeout(() => {
      if (onCancel) onCancel();
    }, 200);
  };

  useEffect(() => {
    setPreviewUserId(userId || appConfig.general.userId);
  }, [userId, appConfig.general.userId]);

  useEffect(() => {
    if (parentId && rootComments) {
      // const parents = findParentComments(rootComments, parentId);
      setParents(parents);
    }
  }, [parentId, rootComments]);

  useEffect(() => {
    if (autoSetUserId) {
      setUserId(autoSetUserId);
    }
  }, [autoSetUserId, setUserId]);

  const submitComment = async () => {
    if (!(content.trim() || attachments.length > 0)) {
      throw new Error("Content Required");
    }
    onSubmit({
      content,
      attachments,
      parentId,
      commentType,
      autoReply,
      autoReplyCount,
    });
    handleClose();
  };

  const handleSubmitGenerate = () => {
    if (!parentId) {
      throw new Error("Parent Required");
    }
    onGenerate({
      attachments,
      parentId,
      userId,
      autoReply,
    });
    setContent("");
    setCommentType(DEFAULT_COMMENT_TYPE);
    handleClose();
  };

  const renderAttachment = useCallback((attachment: Attachment) => {
    if (attachment.type?.startsWith("image/")) {
      return (
        <div key={attachment.url} className="mt-2">
          <img
            src={attachment.url}
            alt={attachment.name || "Attachment"}
            className="max-w-full rounded-lg border border-gray-700"
          />
          {attachment.name && (
            <p className="text-xs mt-1 text-gray-400">{attachment.name}</p>
          )}
        </div>
      );
    } else if (attachment.type) {
      return (
        <div key={attachment.url} className="mt-2 flex items-center">
          <File size={20} className="mr-2 text-gray-400" />
          <a
            href={attachment.url}
            className="text-blue-400 hover:text-blue-300"
          >
            {attachment.name || attachment.url}
          </a>
        </div>
      );
    } else {
      return null;
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (activeTab === "text" || activeTab === "json" || activeTab === "xml") {
        try {
          // Only create preview comment when needed
          const previewComment: CommentType = {
            id: `preview-${Date.now()}`,
            content: content || "(No content)",
            children: [],
            userId: previewUserId || "(No user ID)",
            timestamp: Date.now(),
            contentHash: contentHash || "(No hash)",
            attachments,
            deleted: false,
            renderAttachment,
            type: commentType || DEFAULT_COMMENT_TYPE,
          };

          const data = await exportComments([previewComment], activeTab);
          setPreviewData(data);
          setPreviewError(null);
        } catch (error) {
          console.error("Error generating preview:", error);
          setPreviewError(
            error instanceof Error ? error.message : "Error generating preview"
          );
          setPreviewData("");
        }
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    activeTab,
    content,
    previewUserId,
    attachments,
    contentHash,
    renderAttachment,
  ]);

  // Separate useEffect for hash generation to avoid unnecessary re-renders
  useEffect(() => {
    if (!content) {
      setContentHash("");
      return;
    }

    let isMounted = true;

    const generateHash = async () => {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);

        if (!isMounted) return;
        
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        setContentHash(hashHex.substring(0, 7));
      } catch (error) {
        // More detailed error logging

        // Don't throw the error, just set a simple hash
        const simpleHash = Date.now().toString(16).substring(0, 7);
        if (isMounted) {
          setContentHash(simpleHash);
        }
      }
    };

    generateHash();
    return () => {
      isMounted = false;
    };
  }, [content]);

  const previewComment: CommentType = {
    id: `preview-${Date.now()}`,
    content: content || "(No content)",
    children: [],
    userId: previewUserId,
    timestamp: Date.now(),
    contentHash: contentHash,
    attachments,
    deleted: false,
    renderAttachment,
    type: commentType || DEFAULT_COMMENT_TYPE,
  };

  const renderContent = () => {
    switch (activeTab) {
      case "edit":
        return (
          <>
            <div className="flex flex-wrap gap-4 mb-4">
              <label
                htmlFor="typeInput"
                className="text-gray-300 flex items-center gap-4 min-w-[120px]"
                title="Enter comment type"
              >
                Type
                <input
                  type="text"
                  id="typeInput"
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value)}
                  className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                />
              </label>
              {CYCLE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCommentType(type)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {type}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCommentType("")}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                _
              </button>
            </div>
            <div className="flex flex-wrap gap-4 mb-4">
              <label
                htmlFor="userIdInput"
                className="text-gray-300 flex items-center gap-4 min-w-[120px]"
                title="Enter your user ID"
              >
                User
                <input
                  type="text"
                  id="userIdInput"
                  value={userId || appConfig.general.userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
                  placeholder={appConfig.general.userId}
                />
              </label>
            </div>

            <textarea
              ref={editorRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comment using Markdown..."
              className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
            />
            <div className="text-gray-300 mt-4">
              <label 
                htmlFor="attachments" 
                title="Choose files to attach"
                className="block mb-2 p-4 border border-dashed border-gray-700 rounded-lg hover:border-gray-500 cursor-pointer text-center"
              >
                <span className="block mb-1 text-gray-300">📎 Tap to attach files</span>
                <input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={onAttachmentUpload}
                  className="hidden"
                  aria-label="Choose files to attach"
                />
              </label>
              <ul className="space-y-1">
                {attachments.map((attachment, index) => (
                  <li key={index} className="flex items-center text-gray-400">
                    <span className="mr-2">{attachment.name}</span>
                    <button
                      onClick={() => onAttachmentRemove(index)}
                      title={`Remove ${attachment.name}`}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        );
      case "preview":
        return (
          <div className="border border-gray-700 rounded-lg p-3 bg-[#1A1B1B]">
            <CommentTree
              comments={[previewComment]}
              updateComments={() => {}}
              level={0}
              isPreview={true}
              renderAttachment={renderAttachment}
              appConfig={appConfig}
              chatFocusId={previewChatFocusId}
              setChatFocusId={setPreviewChatFocusId}
              onGenerate={onGenerate}
            />
          </div>
        );
      case "text":
      case "json":
      case "xml":
        if (previewError) {
          return (
            <div className="text-red-500 p-4 rounded-lg bg-red-100/10">
              {previewError}
            </div>
          );
        }
        return (
          <div>
            <label htmlFor="previewOutput" className="sr-only">
              Preview Output
            </label>
            <textarea
              id="previewOutput"
              value={previewData}
              readOnly
              aria-label={`${activeTab.toUpperCase()} Preview Output`}
              className="w-full p-4 bg-[#2A2A2B] rounded-lg border border-gray-700 text-gray-300"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      } p-4 overflow-y-auto`}
      role="dialog"
      aria-label="Comment Editor"
    >
      <div
        className="bg-[#1A1B1B] p-4 rounded-lg w-full max-w-3xl relative flex flex-col max-h-[90vh]"
        onKeyDown={handleKeyDown}
      >
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl font-semibold text-gray-200">Add Comment</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex overflow-x-auto gap-2 mb-4 p-4 border-b border-gray-700 -mx-4 md:mx-0 shrink-0">
            <div className="md:hidden w-full">
              <button
                onClick={() => setIsNavExpanded(!isNavExpanded)}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-300 bg-gray-800 rounded-lg"
              >
                <span>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                <ChevronDown 
                  className={`transform transition-transform ${isNavExpanded ? 'rotate-180' : ''}`} 
                  size={16} 
                />
              </button>
              {isNavExpanded && (
                <div className="absolute mt-1 w-full bg-[#1A1B1B] border border-gray-700 rounded-lg shadow-lg">
                  {["edit", "preview", "text", "json", "xml"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab as PreviewTab);
                        setIsNavExpanded(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                        activeTab === tab ? "text-gray-100 bg-gray-800" : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden md:flex gap-2">
              {["edit", "preview", "text", "json", "xml"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as PreviewTab)}
                  className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab ? "bg-[#2A2A2B] text-gray-100" : "text-gray-300 hover:bg-[#2A2A2B]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-4 -mx-4">
            <div>
              {renderContent()}
            </div>
            {appConfig.ai.base.type && (
            <div className="flex items-center">
              Auto Reply:
              <label className="flex items-center space-x-2 p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer gap-2">
                Depth{" "}
                <input
                  type="number"
                  onChange={(e) => setAutoReply(e.target.valueAsNumber)}
                  defaultValue={autoReply}
                  min="0"
                  max="3"
                  className="w-12 p-2 bg-[#1A1B1B] rounded-lg border border-gray-700 text-gray-300"
                />
              </label>
              <label className="flex items-center space-x-2 p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer gap-2">
                Count{" "}
                <input
                  type="number"
                  onChange={(e) => setAutoReplyCount(e.target.valueAsNumber)}
                  defaultValue={autoReplyCount}
                  disabled={autoReply < 1}
                  min="1"
                  max="8"
                  className="w-12 p-2 bg-[#1A1B1B] rounded-lg border border-gray-700 text-gray-300"
                />
              </label>
            </div>
          )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center text-sm text-gray-400 p-4 border-t border-gray-700 gap-4 mt-4 shrink-0">
            <span className="text-center md:text-left">Supports Markdown. Press Ctrl/Cmd+Enter to submit.</span>
            <div className="flex gap-2 justify-center md:justify-end">
            <button
                type="button"
                title={`Cancel\nkey: esc`}
                onClick={handleClose}
                className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {appConfig.ai.base.type && parentId ? (
                <>
                  {!(!content.trim() && attachments.length === 0) ? (
                    <button
                      type="button"
                      title={`${parentId ? "Reply" : "Add"}\nkey: cmd + enter`}
                      onClick={handleSubmit}
                      disabled={!content.trim() && attachments.length === 0}
                      className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-blue-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageSquarePlus size={20} />
                      {parentId ? "Reply" : "Add"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      title={"Generate AI Reply"}
                      onClick={handleSubmitGenerate}
                      className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-green-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={20} />
                      Gen
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!content.trim() && attachments.length === 0}
                    className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-blue-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquarePlus size={20} />
                    {parentId ? "Reply" : "Add"}
                  </button>
                </>
              )}

            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CommentEditor;
