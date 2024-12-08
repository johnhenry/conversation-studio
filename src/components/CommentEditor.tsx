import React, { useState, useEffect, useCallback } from "react";
import { MessageSquarePlus, X, File } from "lucide-react";
import { Comment as CommentType, Attachment } from "../types";
import CommentTree from "./CommentTree";
import { exportComments } from "../utils/export";

interface CommentEditorProps {
  onSubmit: (
    content: string,
    attachments: CommentType["attachments"],
    parentId?: string
  ) => void;
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  attachments: CommentType["attachments"];
  onAttachmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachmentRemove: (index: number) => void;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  buttonText?: string;
  parentId?: string;
  onCancel?: () => void;
  rootComments?: CommentType[];
}

type PreviewTab = "edit" | "preview" | "text" | "json" | "xml";

const findParentComments = (
  comments: CommentType[],
  childId: string
): CommentType[] => {
  const parents: CommentType[] = [];
  let targetComment: CommentType | null = null;

  const findCommentAndParents = (comments: CommentType[], targetId: string) => {
    for (const comment of comments) {
      // Check if current comment is the target
      if (comment.id === targetId) {
        targetComment = comment;
        return true;
      }

      // Check children
      for (const child of comment.children) {
        if (findCommentAndParents([child], targetId)) {
          parents.push(comment);
          return true;
        }
      }
    }
    return false;
  };

  // Start the search from root comments
  findCommentAndParents(comments, childId);

  // Reverse the array so it's ordered from root to immediate parent
  // and add the target comment at the end
  const result = parents.reverse();
  if (targetComment) {
    result.push(targetComment);
  }

  return result;
};

const CommentEditor: React.FC<CommentEditorProps> = ({
  onSubmit,
  userId,
  setUserId,
  attachments,
  onAttachmentUpload,
  onAttachmentRemove,
  content,
  setContent,
  buttonText = "Add Comment",
  parentId,
  onCancel,
  rootComments = [],
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>("edit");
  const [previewData, setPreviewData] = useState("");
  const [contentHash, setContentHash] = useState("");
  const [previewUserId, setPreviewUserId] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUserId(userId || "user-" + Math.floor(Math.random() * 1000));
  }, [userId]);

  useEffect(() => {
    if (parentId && rootComments) {
      const parents = findParentComments(rootComments, parentId);
      console.log(
        "Found parent comments:",
        parents.map((p) => ({
          id: p.id,
          content: p.content.substring(0, 50) + "...",
          userId: p.userId,
        }))
      );
    }
  }, [parentId, rootComments]);

  const handleSubmit = () => {
    onSubmit(content, attachments, parentId);
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

    // Update content hash
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setContentHash(hashHex.substring(0, 7));
    });

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
  };

  const renderContent = () => {
    switch (activeTab) {
      case "edit":
        return (
          <>
            <div className="flex gap-2 mb-2">
              <label
                htmlFor="userIdInput"
                className="text-gray-300"
                title="Enter your user ID"
              >
                User ID:
                <input
                  type="text"
                  id="userIdInput"
                  placeholder="User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="ml-2 bg-[#1A1A1B] border border-gray-700 text-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comment using Markdown..."
              className="w-full min-h-[100px] p-3 bg-[#1A1A1B] border border-gray-700 text-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
            />
            <div className="text-gray-300">
              <label htmlFor="attachments" title="Choose files to attach">
                Attachments:
                <input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={onAttachmentUpload}
                  className="mb-2 block text-gray-400"
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
          <div className="border border-gray-700 rounded-lg p-3 bg-[#1A1A1B]">
            <CommentTree
              comments={[previewComment]}
              updateComments={() => {}}
              level={0}
              isPreview={true}
              renderAttachment={renderAttachment}
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
              className="w-full min-h-[100px] p-3 bg-[#1A1A1B] border border-gray-700 text-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#1A1A1B] rounded-lg shadow-lg">
      <div className="flex gap-2 mb-4 p-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
            activeTab === "edit" ? "bg-gray-700" : "bg-gray-800"
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
            activeTab === "preview" ? "bg-gray-700" : "bg-gray-800"
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
            activeTab === "text" ? "bg-gray-700" : "bg-gray-800"
          }`}
        >
          Preview Text
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
            activeTab === "json" ? "bg-gray-700" : "bg-gray-800"
          }`}
        >
          Preview JSON
        </button>
        <button
          onClick={() => setActiveTab("xml")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 ${
            activeTab === "xml" ? "bg-gray-700" : "bg-gray-800"
          }`}
        >
          Preview XML
        </button>
      </div>

      <div className="p-4">{renderContent()}</div>

      <div className="flex justify-between items-center text-sm text-gray-400 p-4 border-t border-gray-700">
        <span>Supports Markdown. Press Ctrl+Enter to submit.</span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() && attachments.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquarePlus size={20} />
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentEditor;
