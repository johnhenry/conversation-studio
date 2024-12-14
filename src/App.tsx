import type { ADD_COMMENT_PROPS } from "./types";
import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import CommentTree from "./components/CommentTree";
import CommentEditor from "./components/CommentEditor";
import {
  Comment,
  CommentData,
  Attachment,
  ExportFormat,
  AIConfig,
  ExportSettings,
} from "./types";
import * as crypto from "crypto-js";
import ExportPreview from "./components/ExportPreview";
import { importComments } from "./utils/import";
import {
  DEFAULT_USER_ID,
  DEFAULT_COMMENT_TYPE,
  DEFAULT_AI_CONFIG,
} from "./config";
import Header from "./components/Header";
import SettingsModal from "./components/SettingsModal";
import { useAIConfig } from "./hooks/useAIConfig";
import AI from "ai.matey/openai";

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
  type: comment.type,
});
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

function App() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<ExportFormat | "forum">("forum");
  const [userId, setUserId] = useState("");
  const [commentType, setCommentType] = useState(DEFAULT_COMMENT_TYPE);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [draftContent, setDraftContent] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyToId, setReplyToId] = useState<string | undefined>();
  const [chatFocustId, setChatFocustId] = useState<string>("");
  const { aiConfig, setAIConfig } = useAIConfig();
  const [autoReplySettings, setAutoReplySettings] = useState<{
    userId?: string;
    autoGenerate?: boolean;
  }>({});
  const [storeLocally, setStoreLocally] = useState(() => {
    const stored = localStorage.getItem("storeLocally");
    return stored ? stored === "true" : false;
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<
    string | undefined
  >();
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    includeAttachmentUrls: true,
    truncateContent: false,
    maxContentLength: 1000,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Counter for ensuring unique IDs
  const idCounterRef = useRef(0);

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

  const generateUniqueId = useCallback(() => {
    const timestamp = Date.now();
    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    const uuid = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${timestamp}-${uuid}`;
  }, []);

  const addComment = useCallback(
    ({ content, attachments, parentId, commentType }: ADD_COMMENT_PROPS) => {
      const newId = generateUniqueId();
      const comment: Comment = {
        id: newId,
        content,
        children: [],
        userId: userId || DEFAULT_USER_ID,
        type: commentType || DEFAULT_COMMENT_TYPE,
        timestamp: Date.now(),
        contentHash: generateContentHash(content),
        attachments,
        renderAttachment,
        // newAction: autoReply ? "auto-reply" : "",
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
      setCommentType(DEFAULT_COMMENT_TYPE);
      setAutoReplySettings({});

      // Set selected comment ID first
      setSelectedCommentId(newId);

      // If in chat mode, update the focus to the new comment
      if (chatFocustId) {
        setChatFocustId(newId);
      }

      // Focus after a short delay to ensure the component is mounted
      requestAnimationFrame(() => {
        const newComment = document.querySelector(
          `[data-comment-id="${newId}"]`
        ) as HTMLElement;
        if (newComment) {
          newComment.focus();
        }
      });
    },
    [userId, findAndAddReply, renderAttachment, commentType, chatFocustId]
  );
  // const generationQueueRef = useRef<
  //   {
  //     userId: string;
  //     parentId: string;
  //     abort: () => void;
  //   }[]
  // >([]);
  const [generationQueue, setGenerationQueue] = useState<
    {
      userId: string;
      parentId: string;
      abort: () => void;
    }[]
  >([]);
  const generateComment = useCallback(
    async ({
      attachments = [],
      parentId,
      commentType = "assistant",
      userId,
    }: ADD_COMMENT_PROPS) => {
      if (!parentId) {
        throw new Error("Generated comment must have a parent");
      }
      const abortController = new AbortController();
      const remove = () => {
        // generationQueueRef.current.splice(
        //   generationQueueRef.current.indexOf(generation),
        //   1
        // );
        // setGenerationQueue(generationQueueRef.current);
        generationQueue.splice(generationQueue.indexOf(generation), 1);
        setGenerationQueue(generationQueue);
      };

      const generation = {
        userId,
        parentId,
        abort: () => {
          console.log("aborting");
          abortController.abort();
          remove();
        },
      };
      // generationQueueRef.current.push(generation);
      // setGenerationQueue(generationQueueRef.current);
      generationQueue.push(generation);
      setGenerationQueue(generationQueue);

      let content;
      let model;
      try {
        const initialPrompts: { role: string; content: string }[] = [];
        const parents = findParentComments(comments, parentId);
        const localParents = [...parents];
        while (localParents.length > 0) {
          const parent = localParents.shift()!;
          initialPrompts.push({
            role: parent.type,
            content: parent.content,
          });
        }
        if (aiConfig.systemPrompt?.trim()) {
          initialPrompts.unshift({
            role: "system",
            content: aiConfig.systemPrompt,
          });
        }
        const { content: prompt } = initialPrompts.pop() as {
          role: string;
          content: string;
        };
        const ai =
          aiConfig.type === "window.ai"
            ? window.ai
            : new AI({
                endpoint: aiConfig.endpoint,
                credentials: {
                  apiKey: aiConfig.apiKey,
                },
                model: aiConfig.model,
              });
        model = await ai.languageModel.create({
          temperature: aiConfig.temperature,
          topK: aiConfig.topK,
          systemPrompt: aiConfig.systemPrompt,
        });
        content = await model.prompt(prompt, {
          signal: abortController.signal,
        });
      } catch (error) {
        console.log(error);
        if (error.name === "AbortError") {
          console.log("Generation was cancelled");
        } else {
          console.error(error);
        }
      } finally {
        if (model) {
          model.destroy();
        }
        remove();
      }
      console.log(10);
      addComment({ content, attachments, parentId, commentType, userId });
    },
    [userId, findAndAddReply, renderAttachment, commentType, chatFocustId]
  );
  const QuedGenerations = () => (
    <div className="qg fixed bottom-0 right-0 bg-gray-800 text-white p-2">
      {generationQueue.map((generation, index) => {
        return (
          <div key={index} className="flex items-center gap-2">
            <span>
              {generation.userId} Generating... response to{" "}
              {generation.parentId}
            </span>
            <button
              onClick={() => {
                generation.abort();
              }}
              className="text-red-400"
            >
              Cancel
            </button>
          </div>
        );
      })}
    </div>
  );
  // const cancelGeneration = () => {
  //   if (abortControllerRef.current) {
  //     abortControllerRef.current.abort();
  //     abortControllerRef.current = null;
  //     setLoadingGen(false);
  //   }
  // };

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
    setAutoReplySettings(
      autoReply ? { userId: "assistant", autoGenerate: true } : {}
    );
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
        setActiveTab("forum");
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
    (
      commentId: string,
      originalComment: Comment,
      cloneChildren: boolean = false
    ) => {
      // Helper function to deep clone a comment and its children
      const deepCloneComment = (comment: Comment): Comment => {
        return {
          id: generateUniqueId(),
          content: comment.content,
          children: cloneChildren ? comment.children.map(deepCloneComment) : [],
          userId: comment.userId,
          type: comment.type,
          timestamp: Date.now(),
          contentHash: generateContentHash(
            comment.content + Date.now().toString()
          ),
          attachments: [...comment.attachments],
          renderAttachment,
        };
      };

      const clonedComment = deepCloneComment(originalComment);

      setComments((prevComments) => {
        // Helper function to insert clone after original
        const insertCloneAtSameLevel = (
          comments: Comment[],
          targetId: string
        ): Comment[] => {
          return comments
            .map((comment) => {
              // Create a new comment object with updated children if needed
              if (comment.children.length > 0) {
                return {
                  ...comment,
                  children: insertCloneAtSameLevel(comment.children, targetId),
                };
              }
              return comment;
            })
            .reduce((acc: Comment[], comment) => {
              acc.push(comment);
              // If this is the target comment, add the clone right after
              if (comment.id === targetId) {
                acc.push(clonedComment);
              }
              return acc;
            }, []);
        };

        return insertCloneAtSameLevel(prevComments, commentId);
      });
    },
    [renderAttachment]
  );

  const handleCancel = useCallback(() => {
    setShowEditor(false);
    setReplyToId(undefined);
    setAutoReplySettings({});
    setDraftContent("");
    setAttachments([]);
  }, []);

  // Memoize the comments data for export preview
  const exportCommentData = useMemo(() => {
    if (activeTab === "forum") {
      return [];
    }
    return comments.map(stripUIProperties);
  }, [comments, activeTab]);

  // Memoize the comment tree
  const commentTree = useMemo(() => {
    if (activeTab === "forum") {
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
          selectedCommentId={selectedCommentId}
          onCommentSelect={setSelectedCommentId}
          disableEditing={showEditor}
          aiConfig={aiConfig}
          chatFocustId={chatFocustId}
          setChatFocustId={setChatFocustId}
          onGenerate={generateComment}
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
    selectedCommentId,
    showEditor,
    aiConfig,
    chatFocustId,
    setChatFocustId,
  ]);

  // Memoize the export preview component
  const exportPreview = useMemo(() => {
    if (activeTab === "text" || activeTab === "json" || activeTab === "xml") {
      return (
        <ExportPreview
          key={`${activeTab}-${exportCommentData.length}`}
          comments={exportCommentData}
          format={activeTab}
          exportSettings={exportSettings}
        />
      );
    }
    return null;
  }, [activeTab, exportCommentData, exportSettings]);

  const handleTabChange = useCallback((tab: ExportFormat | "forum") => {
    // Clear any existing error state
    setActiveTab(tab);
  }, []);

  // Function to add renderAttachment to comments recursively
  const addRenderAttachmentToComments = useCallback(
    (comments: Comment[]): Comment[] => {
      return comments.map((comment) => ({
        ...comment,
        renderAttachment,
        children: addRenderAttachmentToComments(comment.children),
      }));
    },
    [renderAttachment]
  );

  // Load state from localStorage on mount
  useEffect(() => {
    if (storeLocally) {
      const storedComments = localStorage.getItem("comments");
      const storedUserId = localStorage.getItem("userId");
      if (storedComments) {
        try {
          const parsedComments = JSON.parse(storedComments);
          // Reattach the renderAttachment function to each comment
          const commentsWithUI = addRenderAttachmentToComments(parsedComments);
          setComments(commentsWithUI);
        } catch (error) {
          console.error("Error parsing stored comments:", error);
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
      const commentsToStore = comments.map((comment) =>
        stripUIProperties(comment)
      );
      localStorage.setItem("comments", JSON.stringify(commentsToStore));
      localStorage.setItem("userId", userId);
      localStorage.setItem("storeLocally", "true");
    } else {
      localStorage.clear();
    }
  }, [storeLocally, comments, userId, isInitialized]);

  // Add global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if not in a text input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // New comment: just 'n'
      if (e.key === "n") {
        e.preventDefault();
        setShowEditor(true);
        setReplyToId(undefined);
        setAutoReplySettings({});
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const generateContentHash = (content: string): string => {
    const hash = crypto.SHA256(content);
    return hash.toString().substring(0, 10);
  };

  const handleNewComment = useCallback(() => {
    setShowEditor(true);
    setReplyToId(undefined);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#030303] text-gray-300">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storeLocally={storeLocally}
        setStoreLocally={setStoreLocally}
        onImport={handleImport}
        onNewComment={handleNewComment}
        onOpenSettings={handleOpenSettings}
        chatFocustId={chatFocustId}
        setChatFocustId={setChatFocustId}
      />

      <main className="flex-1 container mx-auto px-4 pt-20 pb-4 overflow-y-auto">
        {activeTab === "forum" ? (
          <>
            <div className="space-y-4">{commentTree}</div>
          </>
        ) : (
          <ExportPreview
            comments={comments}
            format={activeTab as ExportFormat}
            exportSettings={exportSettings}
          />
        )}
      </main>

      {showEditor && (
        <CommentEditor
          onSubmit={addComment}
          onGenerate={generateComment}
          onCancel={handleCancel}
          userId={userId}
          setUserId={setUserId}
          attachments={attachments}
          onAttachmentUpload={handleAttachmentUpload}
          onAttachmentRemove={handleAttachmentRemove}
          content={draftContent}
          setContent={setDraftContent}
          parentId={replyToId}
          rootComments={comments}
          autoSetUserId={autoReplySettings.userId}
          autoGenerate={autoReplySettings.autoGenerate}
          aiConfig={aiConfig}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          aiConfig={aiConfig}
          onAIConfigChange={setAIConfig}
          exportSettings={exportSettings}
          onExportSettingsChange={setExportSettings}
        />
      )}
      <QuedGenerations />
    </div>
  );
}

export default App;
