import React, { useState } from "react";
import CommentTree from "./components/CommentTree";
import CommentEditor from "./components/CommentEditor";
import { Comment, Attachment, ExportFormat } from "./types";
import * as crypto from "crypto-js";
import ExportPreview from "./components/ExportPreview";

const generateContentHash = (content: string): string => {
  const hash = crypto.SHA256(content);
  return hash.toString().substring(0, 10);
};

function App() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<ExportFormat | "arrange">(
    "arrange"
  );
  const [userId, setUserId] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [draftContent, setDraftContent] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [replyToId, setReplyToId] = useState<string | undefined>();

  const renderAttachment = (attachment: Attachment) => {
    if (attachment.type && attachment.type.startsWith("image/")) {
      return (
        <div key={attachment.url} className="mt-2">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-full h-auto rounded-lg border border-gray-700"
            style={{ maxHeight: "200px" }}
          />
          <div className="text-sm text-gray-400 mt-1">{attachment.name}</div>
        </div>
      );
    }

    return (
      <div
        key={attachment.url}
        className="mt-2 p-2 border rounded-lg border-gray-700 bg-[#1A1A1B]"
      >
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          📎 {attachment.name}
        </a>
      </div>
    );
  };

  const findAndAddReply = (
    comments: Comment[],
    parentId: string,
    newComment: Comment
  ): Comment[] => {
    return comments.map((comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          children: [...comment.children, newComment],
        };
      }
      if (comment.children.length > 0) {
        return {
          ...comment,
          children: findAndAddReply(comment.children, parentId, newComment),
        };
      }
      return comment;
    });
  };

  const addComment = (
    content: string,
    attachments: Attachment[],
    parentId?: string
  ) => {
    const comment: Comment = {
      id: Date.now().toString(),
      content,
      children: [],
      userId: userId || "user-" + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      contentHash: generateContentHash(content),
      attachments,
    };

    if (parentId) {
      setComments((prevComments) =>
        findAndAddReply(prevComments, parentId, comment)
      );
    } else {
      setComments((prevComments) => [...prevComments, comment]);
    }

    setAttachments([]);
    setDraftContent("");
    setShowEditor(false);
    setReplyToId(undefined);
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

  const handleReply = (commentId: string) => {
    setReplyToId(commentId);
    setShowEditor(true);
    // Scroll the editor into view
    setTimeout(() => {
      const editorElement = document.querySelector(".comment-editor");
      if (editorElement) {
        editorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "arrange":
        return comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
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
            onReply={handleReply}
            replyToId={replyToId}
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
    <div className="min-h-screen bg-[#030303]">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-[#1A1A1B] rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-100">
              Conversation Manager
            </h1>
            <button
              onClick={() => {
                setShowEditor(true);
                setReplyToId(undefined);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Comment
            </button>
          </div>

          {showEditor && (
            <div className="mb-8 comment-editor">
              <CommentEditor
                onSubmit={addComment}
                userId={userId}
                setUserId={setUserId}
                attachments={attachments}
                onAttachmentUpload={handleAttachmentUpload}
                onAttachmentRemove={handleAttachmentRemove}
                content={draftContent}
                setContent={setDraftContent}
                buttonText={replyToId ? "Reply" : "Add Comment"}
                parentId={replyToId}
                onCancel={() => {
                  setShowEditor(false);
                  setReplyToId(undefined);
                  setDraftContent("");
                  setAttachments([]);
                }}
              />
            </div>
          )}

          <div className="flex mb-4">
            <button
              onClick={() => setActiveTab("arrange")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
                activeTab === "arrange" ? "bg-gray-700" : "bg-gray-800"
              }`}
            >
              Arrange
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
                activeTab === "text" ? "bg-gray-700" : "bg-gray-800"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
                activeTab === "json" ? "bg-gray-700" : "bg-gray-800"
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setActiveTab("xml")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 ${
                activeTab === "xml" ? "bg-gray-700" : "bg-gray-800"
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
