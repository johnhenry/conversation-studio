import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import CommentTree from "./components/CommentTree";
import CommentEditor from "./components/CommentEditor";
import { Comment, CommentData, Attachment, ExportFormat } from "./types";
import * as crypto from "crypto-js";
import ExportPreview from "./components/ExportPreview";
import { importComments } from "./utils/import";
import { DEFAULT_USER_ID } from "./config";

const generateContentHash = (content: string): string => {
  const hash = crypto.SHA256(content);
  return hash.toString().substring(0, 10);
};

// Convert Comment to CommentData by removing UI-specific properties
const stripUIProperties = (comment: Comment): CommentData => ({
  id: comment.id,
  userId: comment.userId,
  timestamp: comment.timestamp,
  content: comment.content,
  contentHash: comment.contentHash,
  attachments: comment.attachments.map((att) => ({
    url: att.url,
    type: att.type,
    name: att.name,
    file: att.file,
  })),
  children: comment.children.map(stripUIProperties),
  parentId: comment.parentId,
  deleted: comment.deleted,
});

function App() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<ExportFormat | "arrange">("arrange");
  const [userId, setUserId] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [draftContent, setDraftContent] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [replyToId, setReplyToId] = useState<string | undefined>();
  const [storeLocally, setStoreLocally] = useState(() => {
    const stored = localStorage.getItem('storeLocally');
    return stored ? stored === 'true' : false;
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize the renderAttachment function
  const renderAttachment = useCallback((attachment: Attachment) => {
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
          {attachment.name}
        </a>
      </div>
    );
  }, []);

  const findAndAddReply = useCallback(
    (
      currentComments: Comment[],
      parentId: string,
      newComment: Comment
    ): Comment[] => {
      return currentComments.map((comment) => {
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
    },
    []
  );

  const addComment = useCallback(
    (content: string, attachments: Attachment[], parentId?: string) => {
      const comment: Comment = {
        id: Date.now().toString(),
        content,
        children: [],
        userId: userId || DEFAULT_USER_ID,
        timestamp: Date.now(),
        contentHash: generateContentHash(content),
        attachments,
        renderAttachment,
      };

      setComments((prevComments) => {
        if (parentId) {
          return findAndAddReply(prevComments, parentId, comment);
        }
        return [...prevComments, comment];
      });

      setAttachments([]);
      setDraftContent("");
      setShowEditor(false);
      setReplyToId(undefined);
    },
    [userId, findAndAddReply, renderAttachment]
  );

  const handleAttachmentUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const newAttachments = await Promise.all(
          Array.from(e.target.files).map(async (file) => {
            return new Promise<Attachment>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  url: reader.result as string,
                  type: file.type,
                  name: file.name,
                  file,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          })
        );

        setAttachments((prev) => [...prev, ...newAttachments]);
      }
    },
    []
  );

  const handleAttachmentRemove = useCallback((index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  }, []);

  const handleReply = useCallback((commentId: string) => {
    setReplyToId(commentId);
    setShowEditor(true);
  }, []);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        let format: string;

        if (file.name.endsWith(".json")) {
          format = "json";
        } else if (file.name.endsWith(".xml")) {
          format = "xml";
        } else {
          format = "text";
        }

        const importedComments = importComments(content, format);
        // Add renderAttachment to imported comments
        const commentsWithUI = importedComments.map((comment) => ({
          ...comment,
          renderAttachment,
        }));
        setComments(commentsWithUI);
        setActiveTab("arrange");
      };

      reader.readAsText(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [renderAttachment]
  );

  const handleCommentAttachmentUpload = useCallback(
    async (commentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const newAttachments = await Promise.all(
          Array.from(e.target.files).map(async (file) => {
            return new Promise<Attachment>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  url: reader.result as string,
                  type: file.type,
                  name: file.name,
                  file,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          })
        );

        setComments((prevComments) => {
          const updateCommentAttachments = (comments: Comment[]): Comment[] => {
            return comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  attachments: [...comment.attachments, ...newAttachments],
                };
              }
              if (comment.children.length > 0) {
                return {
                  ...comment,
                  children: updateCommentAttachments(comment.children),
                };
              }
              return comment;
            });
          };
          return updateCommentAttachments(prevComments);
        });
      }
    },
    []
  );

  const handleCommentAttachmentRemove = useCallback(
    (commentId: string, index: number) => {
      setComments((prevComments) => {
        const updateCommentAttachments = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === commentId) {
              const newAttachments = [...comment.attachments];
              newAttachments.splice(index, 1);
              return {
                ...comment,
                attachments: newAttachments,
              };
            }
            if (comment.children.length > 0) {
              return {
                ...comment,
                children: updateCommentAttachments(comment.children),
              };
            }
            return comment;
          });
        };
        return updateCommentAttachments(prevComments);
      });
    },
    []
  );

  // Memoize the comments data for export preview
  const exportCommentData = useMemo(() => {
    if (activeTab === "arrange") return [];
    return comments.map(stripUIProperties);
  }, [comments, activeTab]);

  // Memoize the comment tree
  const commentTree = useMemo(() => {
    if (activeTab === "arrange") {
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
          onAttachmentUpload={handleCommentAttachmentUpload}
          onAttachmentRemove={handleCommentAttachmentRemove}
        />
      );
    }
    return null;
  }, [
    activeTab,
    comments,
    renderAttachment,
    handleReply,
    replyToId,
    handleCommentAttachmentUpload,
    handleCommentAttachmentRemove,
  ]);

  // Memoize the export preview component
  const exportPreview = useMemo(() => {
    if (activeTab === "text" || activeTab === "json" || activeTab === "xml") {
      return (
        <ExportPreview
          key={`${activeTab}-${exportCommentData.length}`}
          comments={exportCommentData}
          format={activeTab}
        />
      );
    }
    return null;
  }, [activeTab, exportCommentData]);

  const handleTabChange = useCallback((tab: ExportFormat | "arrange") => {
    // Clear any existing error state
    setActiveTab(tab);
  }, []);

  // Function to add renderAttachment to comments recursively
  const addRenderAttachmentToComments = useCallback((comments: Comment[]): Comment[] => {
    return comments.map(comment => ({
      ...comment,
      renderAttachment,
      children: addRenderAttachmentToComments(comment.children)
    }));
  }, [renderAttachment]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (storeLocally) {
      const storedComments = localStorage.getItem('comments');
      const storedUserId = localStorage.getItem('userId');
      if (storedComments) {
        try {
          const parsedComments = JSON.parse(storedComments);
          // Reattach the renderAttachment function to each comment
          const commentsWithUI = addRenderAttachmentToComments(parsedComments);
          setComments(commentsWithUI);
        } catch (error) {
          console.error('Error parsing stored comments:', error);
        }
      }
      if (storedUserId) setUserId(storedUserId);
    }
    setIsInitialized(true);
  }, [storeLocally, addRenderAttachmentToComments]);

  // Save state to localStorage when it changes
  useEffect(() => {
    // Don't save until initial load is complete
    if (!isInitialized) return;

    if (storeLocally) {
      // Strip UI-specific properties before storing
      const commentsToStore = comments.map(comment => stripUIProperties(comment));
      localStorage.setItem('comments', JSON.stringify(commentsToStore));
      localStorage.setItem('userId', userId);
      localStorage.setItem('storeLocally', 'true');
    } else {
      localStorage.clear();
    }
  }, [storeLocally, comments, userId, isInitialized]);

  return (
    <div className="min-h-screen bg-[#030303] pb-[300px]">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-[#1A1A1B] rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-100">
              Conversation Studio
            </h1>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
                aria-label="Import comments file"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowEditor(!showEditor);
                  setReplyToId(undefined);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                New Comment
              </button>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="storeLocally"
                  checked={storeLocally}
                  onChange={(e) => setStoreLocally(e.target.checked)}
                  className="rounded border-gray-700 bg-[#1A1A1B] text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="storeLocally" className="text-gray-300">
                  Store locally
                </label>
              </div>
            </div>
          </div>

          <div className="flex mb-4">
            <button
              onClick={() => handleTabChange("arrange")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
                activeTab === "arrange" ? "bg-gray-700" : "bg-gray-800"
              }`}
            >
              Arrange
            </button>
            <button
              onClick={() => handleTabChange("text")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
                activeTab === "text" ? "bg-gray-700" : "bg-gray-800"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => handleTabChange("json")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2 text-gray-300 ${
                activeTab === "json" ? "bg-gray-700" : "bg-gray-800"
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => handleTabChange("xml")}
              className={`px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 ${
                activeTab === "xml" ? "bg-gray-700" : "bg-gray-800"
              }`}
            >
              XML
            </button>
          </div>

          <div className="mt-4 min-h-[300px]">
            {activeTab === "arrange" ? commentTree : exportPreview}
          </div>
        </div>
      </div>

      {showEditor && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#030303] border-t border-gray-700 shadow-lg">
          <div className="max-w-4xl mx-auto p-6">
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
              rootComments={comments}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
