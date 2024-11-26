import { Comment, ExportFormat, Attachment } from "../types";
import { create } from "xmlbuilder2";
import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";

const generateBoundary = (): string => {
  return "----Boundary" + Math.random().toString(36).substring(2);
};

const truncateDataUrl = (dataUrl: string, maxLength: number): string => {
  if (dataUrl.length > maxLength) {
    return dataUrl.substring(0, maxLength) + "...";
  }
  return dataUrl;
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

const processAttachments = (
  attachments: Attachment[],
  truncate: boolean = true
): Attachment[] => {
  return attachments.map((attachment) => ({
    ...attachment,
    url: truncate ? truncateDataUrl(attachment.url, 100) : attachment.url,
    type: attachment.type || "",
  }));
};

const processCommentsWithAttachments = (
  comments: Comment[],
  truncate: boolean = true
): Comment[] => {
  return comments.map((comment) => {
    const processedAttachments = processAttachments(
      comment.attachments,
      truncate
    );
    return {
      ...comment,
      attachments: processedAttachments,
      children: processCommentsWithAttachments(comment.children, truncate),
    };
  });
};

export const exportCommentsText = async (
  comments: Comment[],
  truncate: boolean = true
): Promise<string> => {
  const processedComments = comments.map((comment) => {
    const mainBoundary = generateBoundary();
    let commentText = `Content-Type: multipart/mixed; boundary="${mainBoundary}"\n\n`;

    // Comment metadata and content part
    commentText += `--${mainBoundary}\r\n`;
    commentText += `Content-Type: text/plain; charset="UTF-8"\r\n`;
    commentText += `User-Id: ${comment.userId}\n`;
    commentText += `Hash: ${comment.contentHash}\n`;
    commentText += `Timestamp: ${comment.timestamp}\n`;
    commentText += `E-Tag: ${comment.id}\n\n`;
    commentText += `${comment.content}\r\n`;

    // Attachments
    const processedAttachments = processAttachments(
      comment.attachments,
      truncate
    );
    if (processedAttachments && processedAttachments.length > 0) {
      for (const attachment of processedAttachments) {
        commentText += `\r\n--${mainBoundary}\r\n`;
        commentText += `Content-Type: ${attachment.type}\r\n`;
        commentText += `Content-Disposition: attachment; filename="${attachment.name}"\r\n`;
        commentText += `Content-Transfer-Encoding: base64\r\n`;
        commentText += `Content-Data: ${attachment.url}\r\n\n`;
      }
    }

    // Replies (children)
    if (comment.children.length > 0) {
      for (const child of comment.children) {
        commentText += `\r\n--${mainBoundary}\r\n`;
        commentText += `Content-Disposition: reply; to=${comment.id}\r\n`;
        const childContent = exportCommentsText([child], truncate);
        commentText += childContent;
      }
    }

    commentText += `\r\n--${mainBoundary}--\r\n`;
    return commentText;
  });

  return processedComments.join("\n");
};

export const exportCommentsJSON = async (
  comments: Comment[],
  truncate: boolean = true
): Promise<string> => {
  const processedComments = processCommentsWithAttachments(comments, truncate);
  return JSON.stringify(processedComments, null, 2);
};

export const exportCommentsXML = async (
  comments: Comment[],
  truncate: boolean = true
): Promise<string> => {
  const processedComments = processCommentsWithAttachments(comments, truncate);

  const builder = create({
    version: "1.0",
    encoding: "UTF-8",
  });

  const commentsElement = builder.ele("comments");

  const processComment = (comment: Comment, parent: XMLBuilder): void => {
    const commentElement = parent.ele("comment");
    commentElement.ele("id").txt(comment.id);
    commentElement.ele("userId").txt(comment.userId);
    commentElement.ele("timestamp").txt(comment.timestamp.toString());
    commentElement.ele("contentHash").txt(comment.contentHash);
    commentElement.ele("content").dat(comment.content); // Using dat() for CDATA

    const attachmentsElement = commentElement.ele("attachments");
    comment.attachments.forEach((attachment) => {
      const attachmentElement = attachmentsElement.ele("attachment");
      attachmentElement.ele("type").txt(attachment.type || "");
      attachmentElement.ele("url").dat(attachment.url); // Using dat() for CDATA
      attachmentElement.ele("name").txt(attachment.name);
    });

    if (comment.children) {
      const childrenElement = commentElement.ele("children");
      comment.children.forEach((child) =>
        processComment(child, childrenElement)
      );
    }
  };

  processedComments.forEach((comment) =>
    processComment(comment, commentsElement)
  );

  return builder.end({ prettyPrint: true });
};
