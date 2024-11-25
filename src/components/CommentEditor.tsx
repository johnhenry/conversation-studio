import React, { useState, useEffect } from "react";
import { MessageSquarePlus, X, File } from "lucide-react";
import { Comment as CommentType, Attachment } from "../types";
import CommentTree from "./CommentTree";
import { exportComments } from "../utils/export";

interface CommentEditorProps {
  onSubmit: (content: string, attachments: CommentType["attachments"]) => void;
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  attachments: CommentType["attachments"];
  onAttachmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachmentRemove: (index: number) => void;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  buttonText?: string;
}

type PreviewTab = "edit" | "preview" | "text" | "json" | "xml";

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
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>("edit");
  const [previewData, setPreviewData] = useState("");
  const [contentHash, setContentHash] = useState("");

  const handleSubmit = () => {
    onSubmit(content, attachments);
  };

  const renderAttachment = (attachment: Attachment) => {
    if (attachment.type?.startsWith("image/")) {
      return (
        <div key={attachment.url} className="mt-2">
          <img src={attachment.url} alt={attachment.name || "Attachment"} />
          {attachment.name && <p className="text-xs mt-1">{attachment.name}</p>}
        </div>
      );
    } else if (attachment.type) {
      return (
        <div key={attachment.url} className="mt-2 flex items-center">
          <File size={20} className="mr-2" />
          <a href={attachment.url} className="text-blue-500">
            {attachment.name || attachment.url}
          </a>
        </div>
      );
    } else {
      return null;
    }
  };

  const previewComment: CommentType = {
    id: Date.now().toString(),
    content,
    children: [],
    userId: userId || "user-" + Math.floor(Math.random() * 1000),
    timestamp: Date.now(),
    contentHash: contentHash,
    attachments,
    deleted: false,
    renderAttachment,
  };

  useEffect(() => {
    const updatePreviewData = async () => {
      if (activeTab === "text" || activeTab === "json" || activeTab === "xml") {
        try {
          const data = await exportComments([previewComment], activeTab);
          setPreviewData(data);
        } catch (error) {
          console.error("Error generating preview:", error);
          setPreviewData("Error generating preview");
        }
      }
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setContentHash(hashHex.substring(0, 7));
    });

    updatePreviewData();
  }, [activeTab, content, userId, attachments, contentHash, renderAttachment]); // Add renderAttachment to dependency array

  const renderContent = () => {
    switch (activeTab) {
      case "edit":
        return (
          <>
            <div className="flex gap-2 mb-2">
              <label htmlFor="userIdInput" title="Enter your user ID">
                User ID:
                <input
                  type="text"
                  id="userIdInput"
                  placeholder="User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="border rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comment using Markdown..."
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
            />
            <div>
              <label htmlFor="attachments" title="Choose files to attach">
                Attachments:
                <input
                  type="file"
                  id="attachments"
                  multiple
                  onChange={onAttachmentUpload}
                  className="mb-2 block"
                  aria-label="Choose files to attach"
                />
              </label>
              <ul>
                {attachments.map((attachment, index) => (
                  <li key={index} className="flex items-center">
                    <span className="mr-2">{attachment.name}</span>
                    <button
                      onClick={() => onAttachmentRemove(index)}
                      title={`Remove ${attachment.name}`}
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
          <div className="border rounded-lg p-3 bg-gray-50">
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
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors mr-2 ${
            activeTab === "edit" ? "bg-gray-200" : ""
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors mr-2 ${
            activeTab === "preview" ? "bg-gray-200" : ""
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab("text")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors mr-2 ${
            activeTab === "text" ? "bg-gray-200" : ""
          }`}
        >
          Preview Text
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors mr-2 ${
            activeTab === "json" ? "bg-gray-200" : ""
          }`}
        >
          Preview JSON
        </button>
        <button
          onClick={() => setActiveTab("xml")}
          className={`px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors ${
            activeTab === "xml" ? "bg-gray-200" : ""
          }`}
        >
          Preview XML
        </button>
      </div>

      <div className="min-h-[100px]">{renderContent()}</div>

      {activeTab === "edit" && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Supports Markdown. Press Ctrl+Enter to submit.</span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() && attachments.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquarePlus size={20} />
            {buttonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentEditor;
