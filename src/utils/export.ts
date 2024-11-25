import { Comment } from "../types";
import { create } from "xmlbuilder2";
import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";

const generateBoundary = (): string => {
  return "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
};

export const exportCommentsText = (comments: Comment[], level = 0): string => {
  return comments
    .map((comment) => {
      const indent = "\t".repeat(level);
      let commentText = `${indent}User-Id: ${comment.userId}\n`;
      commentText += `${indent}Hash: ${comment.contentHash}\n`;
      commentText += `${indent}Timestamp: ${comment.timestamp}\n`;
      commentText += `${indent}\n`;
      commentText += `${indent}${comment.content}\n`;

      if (comment.attachments.length > 0) {
        const boundary = generateBoundary();
        commentText += `${indent}Attachments: ${comment.attachments.length}\n`;
        commentText += `${indent}Boundary: ${boundary}\n`;

        comment.attachments.forEach((attachment) => {
          commentText += `${indent}----${boundary}\n`;
          commentText += `${indent}Type: ${attachment.type}\n`;
          commentText += `${indent}Url: ${attachment.url}\n`;
          commentText += `${indent}----${boundary}\n`;
        });
      }

      const childrenText =
        comment.children.length > 0
          ? exportCommentsText(comment.children, level + 1)
          : "";
      return commentText + childrenText;
    })
    .join("");
};

export const exportCommentsJSON = (comments: Comment[]): string => {
  return JSON.stringify(comments, null, 2);
};

export const exportCommentsXML = (comments: Comment[]): string => {
  const builder = create({
    version: "1.0",
    encoding: "UTF-8",
  });

  const commentsElement = builder.ele("comments");

  const processComment = (comment: Comment, parent: XMLBuilder) => {
    const commentElement = parent.ele("comment");
    commentElement.ele("id").txt(comment.id);
    commentElement.ele("userId").txt(comment.userId);
    commentElement.ele("timestamp").txt(comment.timestamp.toString());
    commentElement.ele("contentHash").txt(comment.contentHash);
    commentElement.ele("content").txt(comment.content);

    const attachmentsElement = commentElement.ele("attachments");
    comment.attachments.forEach((attachment) => {
      const attachmentElement = attachmentsElement.ele("attachment");
      attachmentElement.ele("type").txt(attachment.type);
      attachmentElement.ele("url").txt(attachment.url);
    });

    if (comment.children) {
      const childrenElement = commentElement.ele("children");
      comment.children.forEach((child) =>
        processComment(child, childrenElement)
      );
    }
  };

  comments.forEach((comment) => processComment(comment, commentsElement));

  return builder.end({ prettyPrint: true });
};
