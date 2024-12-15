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
  ExportSettings,
} from "./types";
import * as crypto from "crypto-js";
import ExportPreview from "./components/ExportPreview";
import { importComments } from "./utils/import";
import { DEFAULT_USER_ID, DEFAULT_COMMENT_TYPE } from "./config";
import Header from "./components/Header";
import SettingsModal from "./components/SettingsModal";
import { useAppConfig } from "./hooks/useAppConfig";
import AI from "ai.matey/openai";
import { CircleX } from "lucide-react";

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
  comments: Comment[],
  childId: string
): Comment[] => {
  const parents: Comment[] = [];
  let targetComment: Comment | null = null;

  const findCommentAndParents = (comments: Comment[], targetId: string) => {
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
  const [chatFocustId, _setChatFocustId] = useState<string>("");
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  const setChatFocustId = (id: string | null) => {
    if (id === null) {
      if (comments.length > 0) {
        _setChatFocustId(comments[comments.length - 1].id);
        return;
      }
    }
    _setChatFocustId(id || "");
  };

  const { appConfig, setAppConfig } = useAppConfig();
  const [autoReplySettings, setAutoReplySettings] = useState<{
    userId?: string;
    autoGenerate?: boolean;
    autoReply?: number;
  }>({});
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

  const [futureComments, setFutureComments] = useState<ADD_COMMENT_PROPS[]>([]);

  useEffect(() => {
    if (comments.length && futureComments.length) {
      for (const comment of futureComments) {
        generateComment(comment);
      }
      setFutureComments([]);
    }
  }, [comments]);

  const addComment = useCallback(
    ({
      content,
      attachments = [],
      parentId,
      commentType,
      autoReply,
      autoReplyCount = 1,
    }: ADD_COMMENT_PROPS) => {
      const newId = generateUniqueId();
      const comment: Comment = {
        id: newId,
        content,
        children: [],
        userId,
        type: commentType || DEFAULT_COMMENT_TYPE,
        timestamp: Date.now(),
        contentHash: generateContentHash(content),
        attachments,
        renderAttachment,
      };
      setComments((prevComments) => {
        if (autoReply && autoReply > 0) {
          const fc: ADD_COMMENT_PROPS[] = [];
          for (let i = 0; i < autoReplyCount; i++) {
            fc.push({
              content: "",
              parentId: newId,
              commentType: "assistant",
              userId,
              autoReply: autoReply - 1,
            });
          }
          setFutureComments((prev) => [...prev, ...fc]);
        }
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
      return newId;
    },
    [
      userId,
      appConfig,
      findAndAddReply,
      renderAttachment,
      commentType,
      chatFocustId,
      isLoadingComments,
    ]
  );

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
      autoReply,
    }: ADD_COMMENT_PROPS) => {
      if (!parentId) {
        throw new Error("Generated comment must have a parent");
      }

      // Check if comments are still loading
      if (isLoadingComments) {
        console.warn(
          "Cannot generate comment while comments are still loading"
        );
        return;
      }

      let abortController: AbortController | null = new AbortController();
      let model: any = null;

      const remove = () => {
        setGenerationQueue((prevQueue) =>
          prevQueue.filter((gen) => gen !== generation)
        );
      };

      const generation = {
        userId: userId,
        parentId,
        abort: () => {
          console.log("aborting");
          if (abortController) {
            abortController.abort();
            abortController = null;
          }
          if (model) {
            model.destroy();
          }
          remove();
        },
      };

      setGenerationQueue((prevQueue) => [...prevQueue, generation]);

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
        if (appConfig.ai.base.systemPrompt?.trim()) {
          initialPrompts.unshift({
            role: "system",
            content: appConfig.ai.base.systemPrompt,
          });
        }
        const { content: prompt } = initialPrompts.pop() as {
          role: string;
          content: string;
        };
        const ai =
          appConfig.ai.base.type === "window.ai"
            ? window.ai
            : new AI({
                endpoint: appConfig.ai.base.endpoint,
                credentials: {
                  apiKey: appConfig.ai.base.apiKey,
                },
                model: appConfig.ai.base.model,
              });

        model = await ai.languageModel.create({
          temperature: appConfig.ai.base.temperature,
          topK: appConfig.ai.base.topK,
          systemPrompt: appConfig.ai.base.systemPrompt,
        });

        if (!abortController) {
          // If already aborted, don't proceed
          return;
        }

        const content = await model.prompt(prompt, {
          signal: abortController.signal,
        });

        if (!abortController) {
          // If aborted during generation, don't add the comment
          return;
        }

        addComment({
          content,
          attachments,
          parentId,
          commentType,
          userId,
          autoReply,
        });
      } catch (error) {
        console.log(error);
        if ((error as Error).name === "AbortError") {
          console.log("Generation was cancelled");
        } else {
          console.error(error);
        }
      } finally {
        if (model) {
          model.destroy();
        }
        remove();
        abortController = null;
      }
    },
    [
      userId,
      findAndAddReply,
      renderAttachment,
      commentType,
      chatFocustId,
      comments,
      isLoadingComments,
    ]
  );

  const QuedGenerations = () => (
    <div className="qg fixed bottom-0 left-0 bg-gray-800 text-white p-2 opacity-50">
      {generationQueue.map((generation, index) => {
        return (
          <div key={index} className="flex items-center gap-2">
            <span>
              {generation.userId
                ? `${generation.userId} is responding...`
                : `A response is being generated`}
              .
            </span>
            <button
              title="Cancel"
              onClick={() => {
                generation.abort();
              }}
              className="text-red-400"
            >
              <CircleX size={16} />
            </button>
          </div>
        );
      })}
    </div>
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

  const handleReply = useCallback((commentId: string, autoReply?: number) => {
    setReplyToId(commentId);
    setAutoReplySettings(
      autoReply
        ? {
            userId: "assistant",
            autoGenerate: true,
            autoReply: autoReply,
          }
        : {}
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
        const insertCloneAtSameLevel = (
          comments: Comment[],
          targetId: string
        ): Comment[] => {
          return comments
            .map((comment) => {
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

  const exportCommentData = useMemo(() => {
    if (activeTab === "forum") {
      return [];
    }
    return comments.map(stripUIProperties);
  }, [comments, activeTab]);

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
          appConfig={appConfig}
          chatFocustId={chatFocustId}
          setChatFocustId={setChatFocustId}
          onGenerate={(props) =>
            generateComment({
              ...props,
              content: "",
              commentType: "assistant",
              autoReply: props.autoReply,
            })
          }
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
    appConfig,
    chatFocustId,
    setChatFocustId,
    generateComment,
  ]);

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
    setActiveTab(tab);
  }, []);

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

  useEffect(() => {
    if (appConfig.general.storeLocally) {
      const storedComments = localStorage.getItem("comments");
      if (storedComments) {
        try {
          const parsedComments = JSON.parse(storedComments);
          const commentsWithUI = addRenderAttachmentToComments(parsedComments);
          setComments(commentsWithUI);
        } catch (error) {
          console.error("Error parsing stored comments:", error);
        }
      }
    }
    setIsLoadingComments(false);
    setIsInitialized(true);
  }, [appConfig.general.storeLocally, addRenderAttachmentToComments]);

  useEffect(() => {
    if (!isInitialized) return;
    if (appConfig.general.storeLocally) {
      const commentsToStore = comments.map((comment) =>
        stripUIProperties(comment)
      );
      localStorage.setItem("comments", JSON.stringify(commentsToStore));
    } else {
      localStorage.removeItem("comments");
    }
  }, [appConfig.general.storeLocally, comments, userId, isInitialized]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "n") {
        e.preventDefault();
        setShowEditor(true);
        setReplyToId(undefined);
        setAutoReplySettings({});
      }
      if (e.key === "m") {
        e.preventDefault();
        setChatFocustId(chatFocustId === "" ? null : "");
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [chatFocustId]);

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
        appConfig={appConfig}
        onStoreLocallyChange={(value) =>
          setAppConfig({
            ...appConfig,
            general: { ...appConfig.general, storeLocally: value },
          })
        }
        onImport={handleImport}
        onNewComment={handleNewComment}
        onOpenSettings={handleOpenSettings}
        chatFocustId={chatFocustId}
        setChatFocustId={setChatFocustId}
      />

      <main className="flex-1 container mx-auto px-4 pt-20 pb-4 overflow-y-auto">
        {activeTab === "forum" ? (
          <>
            <div >{commentTree}</div>
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
          onGenerate={(props) =>
            generateComment({ ...props, content: "", commentType: "user" })
          }
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
          appConfig={appConfig}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          appConfig={appConfig}
          onAppConfigChange={setAppConfig}
          exportSettings={exportSettings}
          onExportSettingsChange={setExportSettings}
        />
      )}
      <QuedGenerations />
    </div>
  );
}

export default App;
