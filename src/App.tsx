import React, { useState } from "react";
import CommentTree from "./components/CommentTree";
import CommentEditor from "./components/CommentEditor";
import { Comment, Attachment, ExportFormat } from "./types";
import * as crypto from "crypto-js";
import ExportPreview from "./components/ExportPreview";

const generateContentHash = (content: string): string => {
  const hash = crypto.SHA256(content);
  return hash.toString().substring(0, 10); // Truncate to 10 characters
};

function App() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<ExportFormat | "arrange">(
    "arrange"
  );
  const [userId, setUserId] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [draftContent, setDraftContent] = useState("");

  const renderAttachment = (attachment: Attachment) => {
    if (attachment.type && attachment.type.startsWith("image/")) {
      return (
        <div key={attachment.url} className="mt-2">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-full h-auto rounded-lg border border-gray-200"
            style={{ maxHeight: "200px" }}
          />
          <div className="text-sm text-gray-500 mt-1">{attachment.name}</div>
        </div>
      );
    }

    return (
      <div
        key={attachment.url}
        className="mt-2 p-2 border rounded-lg border-gray-200 bg-gray-50"
      >
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
        >
          📎 {attachment.name}
        </a>
      </div>
    );
  };

  const addComment = (content: string, attachments: Attachment[]) => {
    const comment: Comment = {
      id: Date.now().toString(),
      content,
      children: [],
      userId: userId || "user-" + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      contentHash: generateContentHash(content),
      attachments,
    };
    setComments([...comments, comment]);
    setAttachments([]); // Clear attachments after posting
    setDraftContent(""); // Clear draft content after posting
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments = Array.from(e.target.files).map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type,
        name: file.name,
        file,
      }));

      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const handleAttachmentRemove = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "arrange":
        return comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No comments yet. Add one to get started!
          </div>
        ) : (
          <CommentTree
            comments={comments}
            updateComments={setComments}
            level={0}
            rootComments={comments}
            rootUpdateComments={setComments}
            renderAttachment={renderAttachment}
          />
        );
      case "text":
      case "json":
      case "xml":
        return <ExportPreview comments={comments} format={activeTab} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Comment Manager
          </h1>

          <div className="mb-8">
            <CommentEditor
              onSubmit={addComment}
              userId={userId}
              setUserId={setUserId}
              attachments={attachments}
              onAttachmentUpload={handleAttachmentUpload}
              onAttachmentRemove={handleAttachmentRemove}
              content={draftContent}
              setContent={setDraftContent}
            />
          </div>

          <div className="flex mb-4">
            <button
              onClick={() => setActiveTab("arrange")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors mr-2 ${
                activeTab === "arrange" ? "bg-gray-200" : ""
              }`}
            >
              Arrange
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors mr-2 ${
                activeTab === "text" ? "bg-gray-200" : ""
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors mr-2 ${
                activeTab === "json" ? "bg-gray-200" : ""
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setActiveTab("xml")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeTab === "xml" ? "bg-gray-200" : ""
              }`}
            >
              XML
            </button>
          </div>

          <div className="mt-4 min-h-[300px]">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
