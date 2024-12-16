import type { AppConfig } from "../config";
import React, { useEffect } from "react";
import { Comment as CommentType, Attachment } from "../types";
import Comment from "./Comment";

// [Previous interfaces and props remain the same...]
interface CommentTreeProps {
  comments: CommentType[];
  updateComments: (comments: CommentType[]) => void;
  level: number;
  parentId?: string | null;
  rootComments?: CommentType[];
  rootUpdateComments?: (comments: CommentType[]) => void;
  isPreview?: boolean;
  renderAttachment: (attachment: Attachment) => React.ReactNode;
  onReply?: (id: string, autoReply?: number) => void;
  onClone?: (id: string, comment: CommentType) => void;
  replyToId?: string;
  onAttachmentUpload?: (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onAttachmentRemove?: (id: string, index: number) => void;
  disableEditing?: boolean;
  selectedCommentId?: string;
  onCommentSelect?: (id: string | undefined) => void;
  appConfig: AppConfig;
  chatFocusId: string;
  setChatFocusId: (mode: string) => void;
  onGenerate: (props: {
    parentId: string;
    attachments?: Attachment[];
    userId?: string;
    autoReply?: number;
  }) => void;
  onSpeak: (commentId: string) => void;
  isSpeaking: boolean;
}

const CommentTree: React.FC<CommentTreeProps> = ({
  comments,
  updateComments,
  level,
  parentId = null,
  rootComments,
  rootUpdateComments,
  isPreview = false,
  renderAttachment,
  onReply,
  onClone,
  replyToId,
  onAttachmentUpload,
  onAttachmentRemove,
  disableEditing,
  selectedCommentId,
  onCommentSelect,
  appConfig,
  chatFocusId,
  setChatFocusId,
  onGenerate,
  onSpeak,
  isSpeaking,
}) => {
  const allComments = rootComments || comments;
  const topLevelUpdate = rootUpdateComments || updateComments;

  // [Previous utility functions remain the same...]
  const findComment = (
    comments: CommentType[],
    id: string
  ): CommentType | null => {
    for (const comment of comments) {
      if (comment.id === id) return comment;
      const found = findComment(comment.children, id);
      if (found) return found;
    }
    return null;
  };

  const findAndRemoveComment = (
    comments: CommentType[],
    id: string
  ): [CommentType | null, CommentType[]] => {
    let found: CommentType | null = null;

    const traverse = (items: CommentType[]): CommentType[] => {
      return items.filter((item) => {
        if (item.id === id) {
          found = { ...item };
          return false;
        }
        if (item.children.length > 0) {
          item.children = traverse(item.children);
        }
        return true;
      });
    };

    const newComments = traverse([...comments]);
    return [found, newComments];
  };

  const isDescendant = (
    parentComment: CommentType,
    childId: string
  ): boolean => {
    if (parentComment.id === childId) return true;
    return parentComment.children.some((child) => isDescendant(child, childId));
  };

  const findSiblings = (
    comments: CommentType[],
    targetId: string
  ): CommentType[] => {
    for (const comment of comments) {
      if (comment.id === targetId) {
        return comments;
      }
      const siblings = findSiblings(comment.children, targetId);
      if (siblings.length > 0) {
        return siblings;
      }
    }
    return [];
  };

  const findParentId = (
    comments: CommentType[],
    targetId: string
  ): string | null => {
    for (const comment of comments) {
      if (comment.children.some((child) => child.id === targetId)) {
        return comment.id;
      }
      const parentId = findParentId(comment.children, targetId);
      if (parentId) {
        return parentId;
      }
    }
    return null;
  };

  const handleDragStart = (e: React.DragEvent, comment: CommentType) => {
    e.dataTransfer.setData("comment", JSON.stringify(comment));
  };

  const swapNodes = (
    comments: CommentType[],
    node1Id: string,
    node2Id: string
  ): CommentType[] => {
    // Deep clone the comments to avoid mutations
    const cloneComments = (items: CommentType[]): CommentType[] => {
      return items.map((item) => ({
        ...item,
        children: cloneComments(item.children),
      }));
    };

    const result = cloneComments(comments);

    // Find both nodes and store their complete state
    const node1 = findComment(result, node1Id);
    const node2 = findComment(result, node2Id);

    if (!node1 || !node2) return result;

    // Store complete state of both nodes
    const tempNode1State = {
      content: node1.content,
      userId: node1.userId,
      type: node1.type,
      timestamp: node1.timestamp,
      attachments: [...node1.attachments],
    };

    const tempNode2State = {
      content: node2.content,
      userId: node2.userId,
      type: node2.type,
      timestamp: node2.timestamp,
      attachments: [...node2.attachments],
    };

    // Helper function to update a node in the tree
    const updateNodeInTree = (
      items: CommentType[],
      nodeId: string,
      newState: typeof tempNode1State
    ): CommentType[] => {
      return items.map((item) => {
        if (item.id === nodeId) {
          return {
            ...item,
            content: newState.content,
            userId: newState.userId,
            type: newState.type,
            timestamp: newState.timestamp,
            attachments: [...newState.attachments],
            // Preserve children
            children: item.children,
          };
        }
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateNodeInTree(item.children, nodeId, newState),
          };
        }
        return item;
      });
    };

    // First update node1 with node2's state
    let updatedComments = updateNodeInTree(result, node1Id, tempNode2State);
    // Then update node2 with node1's state
    updatedComments = updateNodeInTree(
      updatedComments,
      node2Id,
      tempNode1State
    );

    return updatedComments;
  };

  const handleDrop = (e: React.DragEvent, targetId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedCommentData = e.dataTransfer.getData("comment");
    if (!droppedCommentData) return;

    const droppedComment = JSON.parse(droppedCommentData) as CommentType;

    // Don't allow dropping on itself
    if (targetId === droppedComment.id) return;

    // If dropping onto a target (not root level)
    if (targetId) {
      const targetComment = findComment(allComments, targetId);
      if (!targetComment) return;

      // Check if target is the immediate parent
      const parentId = findParentId(allComments, droppedComment.id);
      if (parentId === targetId) {
        // Swap with immediate parent
        const swappedComments = swapNodes(
          allComments,
          droppedComment.id,
          targetId
        );
        topLevelUpdate(swappedComments);
        return;
      }

      // Check if target is a descendant
      if (isDescendant(droppedComment, targetId)) {
        // Swap with descendant
        const swappedComments = swapNodes(
          allComments,
          droppedComment.id,
          targetId
        );
        topLevelUpdate(swappedComments);
        return;
      }

      // Normal case - not ancestor/descendant
      // First remove the dropped comment from its current position
      const [foundComment, remainingComments] = findAndRemoveComment(
        allComments,
        droppedComment.id
      );
      if (!foundComment) return;

      // Add the comment to its new position
      const addToTarget = (items: CommentType[]): CommentType[] => {
        return items.map((item) => {
          if (item.id === targetId) {
            return {
              ...item,
              children: [...item.children, foundComment],
            };
          }
          if (item.children.length > 0) {
            return {
              ...item,
              children: addToTarget(item.children),
            };
          }
          return item;
        });
      };

      topLevelUpdate(addToTarget(remainingComments));
      return;
    }

    // If dropping at root level
    const [foundComment, remainingComments] = findAndRemoveComment(
      allComments,
      droppedComment.id
    );
    if (!foundComment) return;
    topLevelUpdate([...remainingComments, foundComment]);
  };

  // [Rest of the component remains the same...]
  const handlePopUp = (commentId: string) => {
    if (!parentId) return;

    // Find and remove the comment to be popped up
    const [commentToPopUp, remainingComments] = findAndRemoveComment(
      allComments,
      commentId
    );
    if (!commentToPopUp) return;

    // Add the comment as a sibling to its parent
    const addAsSibling = (items: CommentType[]): CommentType[] => {
      const result: CommentType[] = [];

      for (let i = 0; i < items.length; i++) {
        result.push(items[i]);
        if (items[i].id === parentId) {
          result.push(commentToPopUp);
        }
        if (items[i].children.length > 0) {
          result[i] = {
            ...items[i],
            children: addAsSibling(items[i].children),
          };
        }
      }

      return result;
    };

    topLevelUpdate(addAsSibling(remainingComments));
  };

  const deleteComment = (commentId: string) => {
    const [, remainingComments] = findAndRemoveComment(comments, commentId);
    updateComments(remainingComments);
  };

  const handleUserIdChange = (commentId: string, newUserId: string) => {
    const updateCommentUserId = (items: CommentType[]): CommentType[] => {
      return items.map((item) => {
        if (item.id === commentId) {
          return { ...item, userId: newUserId };
        }
        if (item.children.length > 0) {
          return { ...item, children: updateCommentUserId(item.children) };
        }
        return item;
      });
    };

    const updatedComments = updateCommentUserId(allComments);
    topLevelUpdate(updatedComments);
  };

  const handleTypeChange = (commentId: string, newType: string) => {
    const updateCommentType = (items: CommentType[]): CommentType[] => {
      return items.map((item) => {
        if (item.id === commentId) {
          return { ...item, type: newType };
        }
        if (item.children.length > 0) {
          return { ...item, children: updateCommentType(item.children) };
        }
        return item;
      });
    };

    const updatedComments = updateCommentType(allComments);
    topLevelUpdate(updatedComments);
  };

  const handleUpdateComment = (
    commentId: string,
    newContent: string,
    newAttachments: Attachment[]
  ) => {
    const updateCommentInTree = (comments: CommentType[]): CommentType[] => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            content: newContent,
            attachments: newAttachments,
            timestamp: Date.now(),
          };
        }
        if (comment.children.length > 0) {
          return {
            ...comment,
            children: updateCommentInTree(comment.children),
          };
        }
        return comment;
      });
    };

    const updatedComments = updateCommentInTree(allComments);
    topLevelUpdate(updatedComments);
  };

  const handleSiblingNavigation = (
    commentId: string,
    direction: "prev" | "next"
  ) => {
    const siblings = findSiblings(allComments, commentId);
    const currentIndex = siblings.findIndex((c) => c.id === commentId);

    if (currentIndex === -1 || siblings.length <= 1) return;

    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % siblings.length
        : (currentIndex - 1 + siblings.length) % siblings.length;

    const nextSibling = siblings[nextIndex];
    if (nextSibling) {
      // Update the chatFocusId to switch focus to the new sibling
      setChatFocusId(nextSibling.id);
      // Also update selection if needed
      if (onCommentSelect) {
        onCommentSelect(nextSibling.id);
      }
    }
  };

  useEffect(() => {
    if (!level) {
      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[role="article"]')) return;

        const currentComment = findComment(
          allComments,
          selectedCommentId || ""
        );
        if (!currentComment) return;

        const siblings = findSiblings(allComments, selectedCommentId || "");
        const currentIndex = siblings.findIndex(
          (c) => c.id === selectedCommentId
        );

        let nextElement: HTMLElement | null = null;

        switch (e.key) {
          case "ArrowLeft": {
            if (siblings.length > 0) {
              e.preventDefault();
              const nextIndex =
                currentIndex <= 0 ? siblings.length - 1 : currentIndex - 1;
              const nextId = siblings[nextIndex].id;
              nextElement = document.querySelector(
                `[data-comment-id="${nextId}"]`
              );
              if (nextElement && onCommentSelect) {
                if (chatFocusId) {
                  setChatFocusId(nextId);
                }
                onCommentSelect(nextId);
              }
            }
            break;
          }
          case "ArrowRight": {
            if (siblings.length > 0) {
              e.preventDefault();
              const nextIndex =
                currentIndex >= siblings.length - 1 ? 0 : currentIndex + 1;
              const nextId = siblings[nextIndex].id;
              nextElement = document.querySelector(
                `[data-comment-id="${nextId}"]`
              );
              if (nextElement && onCommentSelect) {
                if (chatFocusId) {
                  setChatFocusId(nextId);
                }
                onCommentSelect(nextId);
              }
            }
            break;
          }
          case "ArrowUp": {
            const parentId = findParentId(allComments, selectedCommentId || "");
            if (parentId) {
              e.preventDefault();
              nextElement = document.querySelector(
                `[data-comment-id="${parentId}"]`
              );
              if (nextElement && onCommentSelect) {
                if (chatFocusId) {
                  setChatFocusId(parentId);
                }
                onCommentSelect(parentId);
              }
            }
            break;
          }
          case "ArrowDown": {
            if (currentComment.children.length > 0) {
              e.preventDefault();
              const childId = currentComment.children[0].id;
              nextElement = document.querySelector(
                `[data-comment-id="${childId}"]`
              );
              if (nextElement && onCommentSelect) {
                if (chatFocusId) {
                  setChatFocusId(childId);
                }
                onCommentSelect(childId);
              }
            }
            break;
          }
          case "Tab": {
            return;
          }
          case "Escape": {
            if (onCommentSelect) {
              onCommentSelect(undefined);
            }
            break;
          }
        }

        if (nextElement) {
          nextElement.focus();
        }
      };

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[role="article"]') && onCommentSelect) {
          onCommentSelect(undefined);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("click", handleClickOutside);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [
    selectedCommentId,
    allComments,
    onCommentSelect,
    level,
    chatFocusId,
    setChatFocusId,
  ]);

  const findAncestorIds = (
    comments: CommentType[],
    targetId: string,
    ancestors: Set<string> = new Set()
  ): Set<string> => {
    for (const comment of comments) {
      if (comment.id === targetId) {
        return ancestors;
      }

      const currentAncestors = new Set(ancestors);
      currentAncestors.add(comment.id);

      for (const child of comment.children) {
        const foundAncestors = findAncestorIds(
          [child],
          targetId,
          currentAncestors
        );
        if (foundAncestors.size > 0) {
          return foundAncestors;
        }
      }
    }
    return new Set();
  };

  const getLineage = (
    comment: CommentType,
    last: boolean = false
  ): Set<string> => {
    const lineage = new Set<string>();
    const addLineage = (current: CommentType) => {
      if (current.children.length > 0) {
        const lastChild =
          current.children[last ? current.children.length - 1 : 0];
        lineage.add(lastChild.id);
        addLineage(lastChild);
      }
    };
    addLineage(comment);
    return lineage;
  };

  const filterComments = (comments: CommentType[]): CommentType[] => {
    if (!chatFocusId) return comments;

    const ancestorIds = findAncestorIds(comments, chatFocusId);
    let focusedComment: CommentType | null = null;

    const findFocusedComment = (items: CommentType[]): void => {
      for (const item of items) {
        if (item.id === chatFocusId) {
          focusedComment = item;
          return;
        }
        if (item.children.length > 0) {
          findFocusedComment(item.children);
        }
      }
    };
    findFocusedComment(comments);

    if (!focusedComment) {
      return comments;
    }

    const lineageIds = getLineage(focusedComment, true);
    const visibleIds = new Set([...ancestorIds, chatFocusId, ...lineageIds]);

    const filterTree = (items: CommentType[]): CommentType[] => {
      return items
        .filter((item) => visibleIds.has(item.id))
        .map((item) => ({
          ...item,
          children: filterTree(item.children),
        }));
    };

    return filterTree(comments);
  };

  const visibleComments = filterComments(comments);

  return (
    <div
      onDragOver={(e) => {
        if (!disableEditing) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDrop={(e) => {
        if (!disableEditing) {
          e.preventDefault();
          e.stopPropagation();
          handleDrop(e);
        }
      }}
      className={`${parentId ? "pl-0" : ""}`}
    >
      {visibleComments.map((comment) => {
 const siblings = findSiblings(allComments, comment.id);
 const currentIndex = siblings.findIndex((c) => c.id === comment.id);
 const siblingInfo =
   siblings.length > 1
     ? {
         currentIndex,
         totalSiblings: siblings.length,
         onNavigate: (direction: "prev" | "next") =>
           handleSiblingNavigation(comment.id, direction),
       }
     : undefined;

return(
        <div key={comment.id} className="relative">
          <Comment
            comment={comment}
            onDelete={() => deleteComment(comment.id)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onPopUp={parentId ? () => handlePopUp(comment.id) : undefined}
            onReply={onReply}
            onUserIdChange={handleUserIdChange}
            onTypeChange={handleTypeChange}
            onUpdate={handleUpdateComment}
            onClone={onClone}
            onAttachmentUpload={onAttachmentUpload}
            onAttachmentRemove={onAttachmentRemove}
            canPopUp={!!parentId}
            renderAttachment={renderAttachment}
            showDelete={!isPreview}
            level={level}
            isBeingRepliedTo={comment.id === replyToId}
            isSelected={comment.id === selectedCommentId}
            onSelect={() => onCommentSelect?.(comment.id)}
            disableEditing={disableEditing || isPreview}
            appConfig={appConfig}
            chatFocusId={chatFocusId}
            setChatFocusId={setChatFocusId}
            siblingInfo={siblingInfo}
            onGenerate={onGenerate}
            onSpeak={onSpeak}
            isSpeaking={isSpeaking}
          />
          {comment.children.length > 0 && (
            <CommentTree
              comments={comment.children}
              updateComments={(newChildren) => {
                const newComments = comments.map((c) =>
                  c.id === comment.id ? { ...c, children: newChildren } : c
                );
                updateComments(newComments);
              }}
              level={level + 1}
              parentId={comment.id}
              rootComments={rootComments || comments}
              rootUpdateComments={rootUpdateComments || updateComments}
              isPreview={isPreview}
              renderAttachment={renderAttachment}
              onReply={onReply}
              onClone={onClone}
              replyToId={replyToId}
              onAttachmentUpload={onAttachmentUpload}
              onAttachmentRemove={onAttachmentRemove}
              disableEditing={disableEditing}
              selectedCommentId={selectedCommentId}
              onCommentSelect={onCommentSelect}
              appConfig={appConfig}
              chatFocusId={chatFocusId}
              setChatFocusId={setChatFocusId}
              onGenerate={onGenerate}
              onSpeak={onSpeak}
              isSpeaking={isSpeaking}
            />
          )}
        </div>
      )})}
    </div>
  );
};

export default CommentTree;
