import React, { useState, useRef } from "react";
import { MessageSquarePlus, X, File } from "lucide-react";
import { Comment as CommentType, Attachment } from "../types";
import {
  exportCommentsText,
  exportCommentsJSON,
  exportCommentsXML,
} from "../utils/export";
import Comment from "./Comment";

interface CommentEditorProps {
  onSubmit: (content: string, attachments: CommentType["attachments"]) => void;
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  attachments: CommentType["attachments"];
  onAttachmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachmentRemove: (index: number) => void;
  initialContent?: string;
  buttonText?: string;
}

const CommentEditor: React.FC<CommentEditorProps> = ({
  onSubmit,
  userId,
  setUserId,
  attachments,
  onAttachmentUpload,
  onAttachmentRemove,
  initialContent = "",
  buttonText = "Add Comment",
}) => {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<
    "text" | "json" | "xml" | null
  >(null);
  const previewRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    onSubmit(content, attachments);
    setContent("");
  };

  const handlePreview = async (format: "text" | "json" | "xml") => {
    const comment: CommentType = {
      id: Date.now().toString(),
      content,
      children: [],
      userId: userId || "user-" + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      contentHash: "",
      attachments,
    };

    let previewData = "";
    try {
      switch (format) {
        case "text":
          previewData = await exportCommentsText([comment]);
          break;
        case "json":
          previewData = await exportCommentsJSON([comment]);
          break;
        case "xml":
          previewData = await exportCommentsXML([comment]);
          break;
      }
    } catch (error) {
      console.error("Error generating preview:", error);
    }

    // Only set previewFormat if not in preview mode
    if (!isPreview) {
      setPreviewFormat(format);
    }

    if (previewRef.current) {
      previewRef.current.value = previewData;
      previewRef.current.style.height = "0px";
      previewRef.current.style.height = previewRef.current.scrollHeight + "px";
    }
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
    contentHash: "",
    attachments,
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => {
            setIsPreview(false);
            setPreviewFormat(null); // Clear preview format when switching to edit mode
          }}
          className={`px-3 py-1 rounded ${
            !isPreview ? "bg-blue-100 text-blue-700" : "bg-gray-100"
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setIsPreview(true)}
          className={`px-3 py-1 rounded ${
            isPreview ? "bg-blue-100 text-blue-700" : "bg-gray-100"
          }`}
        >
          Preview
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => handlePreview("text")}
            className="px-3 py-1 rounded bg-gray-100"
          >
            Preview Text
          </button>
          <button
            onClick={() => handlePreview("json")}
            className="px-3 py-1 rounded bg-gray-100"
          >
            Preview JSON
          </button>
          <button
            onClick={() => handlePreview("xml")}
            className="px-3 py-1 rounded bg-gray-100"
          >
            Preview XML
          </button>
        </div>
      </div>
      <div className="flex gap-2 mb-2">
        {!isPreview && !previewFormat && (
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
        )}
      </div>

      <div className="min-h-[100px]">
        {isPreview ? (
          <div className="border rounded-lg p-3 bg-gray-50">
            <Comment
              comment={previewComment}
              onDelete={() => {}}
              onDragStart={() => {}}
              onDrop={() => {}}
              onPopUp={() => {}}
              canPopUp={false}
              renderAttachment={renderAttachment}
            />
          </div>
        ) : previewFormat ? (
          <textarea
            ref={previewRef}
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            readOnly
          />
        ) : (
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
        )}
      </div>
      {!isPreview && !previewFormat && (
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
      )}

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
    </div>
  );
};

export default CommentEditor;
