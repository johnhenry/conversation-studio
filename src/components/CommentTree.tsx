import React from "react";
import { Comment as CommentType, Attachment } from "../types";
import Comment from "./Comment";

interface CommentTreeProps {
  comments: CommentType[];
  updateComments: (comments: CommentType[]) => void;
  level: number;
  parentId?: string | null;
  rootComments?: CommentType[];
  rootUpdateComments?: (comments: CommentType[]) => void;
  isPreview?: boolean;
  renderAttachment: (attachment: Attachment) => React.ReactNode | null;
  onReply?: (id: string) => void;
  replyToId?: string;
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
  replyToId,
}) => {
  const allComments = rootComments || comments;
  const topLevelUpdate = rootUpdateComments || updateComments;

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

  const handleDragStart = (e: React.DragEvent, comment: CommentType) => {
    e.dataTransfer.setData("comment", JSON.stringify(comment));
  };

  const handleDrop = (e: React.DragEvent, targetId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedCommentData = e.dataTransfer.getData("comment");
    if (!droppedCommentData) return;

    const droppedComment = JSON.parse(droppedCommentData) as CommentType;

    // Don't allow dropping on itself
    if (targetId === droppedComment.id) return;

    // If dropping onto a target (not root level), check for circular reference
    if (targetId) {
      const targetComment = findComment(allComments, targetId);
      if (!targetComment) return;

      if (isDescendant(droppedComment, targetId)) {
        return; // Prevent dropping onto descendant
      }
    }

    // Find and remove the comment from its current position
    const [foundComment, remainingComments] = findAndRemoveComment(
      allComments,
      droppedComment.id
    );
    if (!foundComment) return;

    // If dropping at root level
    if (!targetId) {
      topLevelUpdate([...remainingComments, foundComment]);
      return;
    }

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
  };

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

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => handleDrop(e)}
    >
      {comments.map((comment) => (
        <div key={comment.id}>
          <Comment
            comment={comment}
            onDelete={deleteComment}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onPopUp={handlePopUp}
            onReply={onReply || (() => {})}
            onUserIdChange={handleUserIdChange}
            level={level}
            canPopUp={level > 0}
            showDelete={!isPreview}
            renderAttachment={renderAttachment}
            isBeingRepliedTo={replyToId === comment.id}
          />
          {comment.children.length > 0 && (
            <div className="ml-8">
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
                rootComments={allComments}
                rootUpdateComments={topLevelUpdate}
                isPreview={isPreview}
                renderAttachment={renderAttachment}
                onReply={onReply}
                replyToId={replyToId}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentTree;
