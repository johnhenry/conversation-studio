import { CommentData, ExportFormat } from "../types";
import { create } from "xmlbuilder2";
import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";

const generateBoundary = (): string => {
  return "----Boundary" + Math.random().toString(36).substring(2);
};

interface JSONAttachment {
  name: string;
  type?: string;
}

interface JSONComment {
  id: string;
  userId: string;
  timestamp: number;
  content: string;
  contentHash: string;
  attachments: JSONAttachment[];
  children: JSONComment[];
}

const formatTextComment = (
  comment: CommentData,
  boundary: string,
  processedIds: Set<string> = new Set()
): string => {
  try {
    // Check for circular reference
    if (processedIds.has(comment.id)) {
      console.warn(`Circular reference detected for comment ${comment.id}`);
      return `--${boundary}\nError: Circular reference detected\n`;
    }

    // Add current comment ID to processed set
    processedIds.add(comment.id);

    const parts = [
      `--${boundary}\n`,
      `Content-Type: text/plain; charset="UTF-8"\n`,
      `User-Id: ${comment.userId}\n`,
      `Hash: ${comment.contentHash}\n`,
      `Timestamp: ${comment.timestamp}\n`,
      `Id: ${comment.id}\n\n`,
      `${comment.content}\n`,
    ];

    // Add attachments info without the actual data
    if (comment.attachments.length > 0) {
      parts.push(`\nAttachments:\n`);
      comment.attachments.forEach((att) => {
        parts.push(`- ${att.name} (${att.type || "unknown type"})\n`);
      });
    }

    // Add children recursively with the same processedIds set
    comment.children.forEach((child) => {
      const childBoundary = generateBoundary();
      parts.push(
        `\n--${boundary}\n`,
        `Content-Type: multipart/mixed; boundary="${childBoundary}"\n`,
        formatTextComment(child, childBoundary, new Set(processedIds)),
        `\n--${childBoundary}--\n`
      );
    });

    return parts.join("");
  } catch (error) {
    console.error("Error formatting text comment:", error);
    throw new Error(
      `Failed to format comment ${comment.id}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

const formatJSONComment = (comment: CommentData): JSONComment => {
  try {
    return {
      id: comment.id,
      userId: comment.userId,
      timestamp: comment.timestamp,
      content: comment.content,
      contentHash: comment.contentHash,
      attachments: comment.attachments.map((att) => ({
        name: att.name,
        type: att.type,
      })),
      children: comment.children.map(formatJSONComment),
    };
  } catch (error) {
    console.error("Error formatting JSON comment:", error);
    throw new Error(
      `Failed to format comment ${comment.id}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

const formatXMLComment = (comment: CommentData, parent: XMLBuilder): void => {
  try {
    const elem = parent.ele("comment");
    elem.ele("id").txt(comment.id);
    elem.ele("userId").txt(comment.userId);
    elem.ele("timestamp").txt(comment.timestamp.toString());
    elem.ele("contentHash").txt(comment.contentHash);
    elem.ele("content").dat(comment.content);

    if (comment.attachments.length > 0) {
      const attachments = elem.ele("attachments");
      comment.attachments.forEach((att) => {
        const attElem = attachments.ele("attachment");
        attElem.ele("name").txt(att.name);
        if (att.type) {
          attElem.ele("type").txt(att.type);
        }
      });
    }

    if (comment.children.length > 0) {
      const children = elem.ele("children");
      comment.children.forEach((child) => formatXMLComment(child, children));
    }
  } catch (error) {
    console.error("Error formatting XML comment:", error);
    throw new Error(
      `Failed to format comment ${comment.id}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const exportComments = (
  comments: CommentData[],
  format: ExportFormat
): string => {
  console.log("Starting export:", { format, commentsCount: comments.length });

  if (!Array.isArray(comments)) {
    throw new Error("Comments must be an array");
  }

  try {
    switch (format) {
      case "text": {
        console.log("Generating text format");
        const mainBoundary = generateBoundary();
        const parts = [
          `Content-Type: multipart/mixed; boundary="${mainBoundary}"\n`,
        ];

        comments.forEach((comment, index) => {
          console.log(`Processing comment ${index + 1}/${comments.length}`);
          parts.push(formatTextComment(comment, mainBoundary, new Set()));
        });

        parts.push(`\n--${mainBoundary}--\n`);
        console.log("Text format generated successfully");
        return parts.join("");
      }

      case "json": {
        console.log("Generating JSON format");
        const processed = comments.map(formatJSONComment);
        console.log("JSON format generated successfully");
        return JSON.stringify(processed, null, 2);
      }

      case "xml": {
        console.log("Generating XML format");
        const builder = create({ version: "1.0", encoding: "UTF-8" });
        const root = builder.ele("comments");

        comments.forEach((comment, index) => {
          console.log(`Processing comment ${index + 1}/${comments.length}`);
          formatXMLComment(comment, root);
        });

        console.log("XML format generated successfully");
        return builder.end({ prettyPrint: true });
      }

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error("Export failed:", error);
    throw new Error(
      `Export failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const exportCommentsText = (comments: CommentData[]): string => {
  return exportComments(comments, "text");
};

export const exportCommentsJSON = (comments: CommentData[]): string => {
  return exportComments(comments, "json");
};

export const exportCommentsXML = (comments: CommentData[]): string => {
  return exportComments(comments, "xml");
};
