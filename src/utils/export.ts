import { Comment, ExportFormat } from "../types";
import { create } from "xmlbuilder2";
import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";

const generateBoundary = (): string => {
  return "----Boundary" + Math.random().toString(36).substring(2);
};

const toBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const truncateBase64 = (base64: string, maxLength: number): string => {
  if (base64.length > maxLength) {
    return base64.substring(0, maxLength) + "...";
  }
  return base64;
};

export const exportComments = async (
  comments: Comment[],
  format: ExportFormat
): Promise<string> => {
  switch (format) {
    case "text":
      return exportCommentsText(comments);
    case "json":
      return exportCommentsJSON(comments);
    case "xml":
      return exportCommentsXML(comments);
    default:
      return "";
  }
};

const processAttachments = async (
  attachments: { file: File; name: string; type?: string; url: string }[],
  truncate: boolean = true
) => {
  return await Promise.all(
    attachments.map(async (attachment) => {
      try {
        const base64Data = await toBase64(attachment.file);
        return {
          ...attachment,
          url: truncate ? truncateBase64(base64Data, 100) : base64Data,
          type: attachment.type || "",
        };
      } catch (error) {
        console.error("Error converting to Base64:", error);
        return { ...attachment, type: attachment.type || "" };
      }
    })
  );
};

const processCommentsWithAttachments = async (
  comments: Comment[],
  truncate: boolean = true
) => {
  return await Promise.all(
    comments.map(async (comment) => {
      const base64Attachments = await processAttachments(
        comment.attachments,
        truncate
      );
      return {
        ...comment,
        attachments: base64Attachments,
      };
    })
  );
};

export const exportCommentsText = async (
  comments: Comment[],
  level = 0,
  truncate: boolean = true
): Promise<string> => {
  const processedComments = await Promise.all(
    comments.map(async (comment) => {
      const indent = "\t".repeat(level);
      let commentText = `${indent}User-Id: ${comment.userId}\n`;
      commentText += `${indent}Hash: ${comment.contentHash}\n`;
      commentText += `${indent}Timestamp: ${comment.timestamp}\n`;

      const base64Attachments = await processAttachments(
        comment.attachments,
        truncate
      );

      if (base64Attachments && base64Attachments.length > 0) {
        const boundary = generateBoundary();
        commentText += `${indent}Content-Type: multipart/mixed; boundary="${boundary}"\n\n`;

        commentText += `${indent}--${boundary}\r\n`;
        commentText += `${indent}Content-Type: text/plain; charset="UTF-8"\r\n\n`;
        commentText += `${indent}${comment.content}\r\n\n`;

        base64Attachments.forEach((attachment) => {
          commentText += `${indent}--${boundary}\r\n`;
          commentText += `${indent}Content-Type: ${attachment.type}\r\n`;
          commentText += `${indent}Content-Disposition: attachment; filename="${attachment.name}"\r\n`;
          commentText += `${indent}Content-Location: ${attachment.url}\r\n\n`;
        });
        commentText += `${indent}--${boundary}--\r\n`;
      } else {
        commentText += `\n${indent}${comment.content}\n`;
      }

      const childrenText =
        comment.children.length > 0
          ? await exportCommentsText(comment.children, level + 1, truncate)
          : "";
      return commentText + childrenText;
    })
  );

  return processedComments.join("");
};

export const exportCommentsJSON = async (
  comments: Comment[],
  truncate: boolean = true
): Promise<string> => {
  const commentsWithBase64 = await processCommentsWithAttachments(
    comments,
    truncate
  );

  return JSON.stringify(commentsWithBase64, null, 2);
};

export const exportCommentsXML = async (
  comments: Comment[],
  truncate: boolean = true
): Promise<string> => {
  const commentsWithBase64 = await processCommentsWithAttachments(
    comments,
    truncate
  );

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

      attachmentElement.ele("type").txt(attachment.type || "");
      attachmentElement.ele("url").txt(attachment.url);
      attachmentElement.ele("name").txt(attachment.name);
    });

    if (comment.children) {
      const childrenElement = commentElement.ele("children");
      comment.children.forEach((child) =>
        processComment(child, childrenElement)
      );
    }
  };

  commentsWithBase64.forEach((comment) =>
    processComment(comment, commentsElement)
  );

  return builder.end({ prettyPrint: true });
};
