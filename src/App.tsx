import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import CommentTree from "./components/CommentTree";
import CommentEditor from "./components/CommentEditor";
import { Comment, CommentData, Attachment, ExportFormat } from "./types";
import * as crypto from "crypto-js";
import ExportPreview from "./components/ExportPreview";
import { importComments } from "./utils/import";
import { DEFAULT_USER_ID } from "./config";
import Header from "./components/Header";
import { Plus } from "lucide-react";

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
  const [autoReplySettings, setAutoReplySettings] = useState<{userId?: string; autoGenerate?: boolean}>({});
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

  const handleReply = useCallback((commentId: string, autoReply?: boolean) => {
    setReplyToId(commentId);
    setAutoReplySettings(autoReply ? { userId: 'assistant', autoGenerate: true } : {});
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

  const handleClone = useCallback(
    (commentId: string, originalComment: Comment) => {
      const clonedComment: Comment = {
        id: Date.now().toString(),
        content: originalComment.content,
        children: [],
        userId: originalComment.userId, // Keep original user's ID
        timestamp: Date.now(),
        contentHash: originalComment.contentHash,
        attachments: [...originalComment.attachments],
        renderAttachment,
      };

      setComments((prevComments) => {
        // Helper function to insert clone after original
        const insertCloneAtSameLevel = (
          comments: Comment[],
          targetId: string
        ): Comment[] => {
          const result: Comment[] = [];
          for (const comment of comments) {
            result.push(comment);
            // If this is the target comment, add the clone right after
            if (comment.id === targetId) {
              result.push(clonedComment);
            }
            // If this comment has children, recursively search them
            if (comment.children.length > 0) {
              comment.children = insertCloneAtSameLevel(comment.children, targetId);
            }
          }
          return result;
        };

        return insertCloneAtSameLevel(prevComments, commentId);
      });
    },
    [renderAttachment]
  );

  // Memoize the comments data for export preview
  const exportCommentData = useMemo(() => {
    if (activeTab === "arrange") {
      return [];
    }
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
          renderAttachment={renderAttachment}
          onReply={handleReply}
          onClone={handleClone}
          replyToId={replyToId}
          onAttachmentUpload={handleCommentAttachmentUpload}
          onAttachmentRemove={handleCommentAttachmentRemove}
          disableEditing={showEditor}
        />
      );
    }
    return null;
  }, [
    activeTab,
    comments,
    renderAttachment,
    handleReply,
    handleClone,
    replyToId,
    handleCommentAttachmentUpload,
    handleCommentAttachmentRemove,
    showEditor,
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

  const generateContentHash = (content: string): string => {
    const hash = crypto.SHA256(content);
    return hash.toString().substring(0, 10);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storeLocally={storeLocally}
        setStoreLocally={setStoreLocally}
        onImport={handleImport}
      />
      <main className="container mx-auto px-4 pt-20 h-full">
        {activeTab === "arrange" ? (
          <>
            <div className="space-y-4">
              {commentTree}
            </div>
            {showEditor && (
              <CommentEditor
                onSubmit={addComment}
                userId={userId}
                setUserId={setUserId}
                attachments={attachments}
                onAttachmentUpload={handleAttachmentUpload}
                onAttachmentRemove={handleAttachmentRemove}
                content={draftContent}
                setContent={setDraftContent}
                onCancel={() => setShowEditor(false)}
                parentId={replyToId}
                rootComments={comments}
                autoSetUserId={autoReplySettings.userId}
                autoGenerate={autoReplySettings.autoGenerate}
              />
            )}
          </>
        ) : (
          <ExportPreview comments={comments} format={activeTab} />
        )}
      </main>
      {/* Floating action button */}
      <div 
        className="floating-action-button"
        onClick={() => {
          setShowEditor(true);
          setReplyToId(undefined);
        }}
      >
        <Plus size={24} />
      </div>
    </div>
  );
}

export default App;
