/**
 * This module provides functionality to export comments in three different formats:
 *
 * 1. Text Format (Multipart):
 *    A custom text-based format inspired by HTTP multipart/form-data structure.
 *    Each comment is separated by a boundary marker and includes:
 *    - Headers: Content-Type, User-Id, Type, Hash, Timestamp, Id
 *    - Body: The comment content
 *    - Attachments section (if any)
 *    - Nested child comments (using the same boundary)
 *    Example:
 *    ----Boundary123
 *    Content-Type: text/plain; charset="UTF-8"
 *    User-Id: user123
 *    Type: comment
 *    Hash: abc123
 *    Timestamp: 1701234567
 *    Id: comment123
 *    
 *    Comment content here...
 *    
 *    Attachments:
 *    - file1.jpg (image/jpeg)
 *      URL: https://example.com/file1.jpg
 *    
 * 2. JSON Format:
 *    A hierarchical JSON structure where each comment is an object containing:
 *    - id: string - Unique identifier
 *    - userId: string - User identifier
 *    - type: string - Comment type
 *    - timestamp: number - Unix timestamp
 *    - content: string - Comment content
 *    - contentHash: string - Content hash for verification
 *    - attachments: Array of {name: string, type?: string, url: string}
 *    - children: Array of nested comments with the same structure
 * 
 * 3. XML Format:
 *    A structured XML format with nested elements:
 *    <comments>
 *      <comment id="..." userId="..." type="..." timestamp="..." contentHash="...">
 *        <content>Comment text</content>
 *        <attachments>
 *          <attachment name="..." type="..." url="..."/>
 *        </attachments>
 *        <children>
 *          <!-- Nested comments -->
 *        </children>
 *      </comment>
 *    </comments>
 */

import { CommentData, ExportFormat, ExportSettings } from "../types";
import { create } from "xmlbuilder2";
import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";

const generateBoundary = (): string => {
  return "----Boundary" + Math.random().toString(36).substring(2);
};

interface JSONAttachment {
  name: string;
  type?: string;
  url: string;
}

interface JSONComment {
  id: string;
  userId: string;
  type: string;
  timestamp: number;
  content: string;
  contentHash: string;
  attachments: JSONAttachment[];
  children: JSONComment[];
}

const truncateContent = (content: string, maxLength: number): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
};

const formatTextComment = (
  comment: CommentData,
  boundary: string,
  settings: ExportSettings,
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

    const content = settings.truncateContent && settings.maxContentLength
      ? truncateContent(comment.content, settings.maxContentLength)
      : comment.content;

    const parts = [
      `--${boundary}\n`,
      `Content-Type: text/plain; charset="UTF-8"\n`,
      `User-Id: ${comment.userId}\n`,
      `Type: ${comment.type}\n`,
      `Hash: ${comment.contentHash}\n`,
      `Timestamp: ${comment.timestamp}\n`,
      `Id: ${comment.id}\n\n`,
      `${content}\n`,
    ];

    // Add attachments info with URL if enabled
    if (comment.attachments.length > 0) {
      parts.push(`\nAttachments:\n`);
      comment.attachments.forEach((att) => {
        const attachmentInfo = [`- ${att.name} (${att.type || "unknown type"})`];
        if (settings.includeAttachmentUrls) {
          attachmentInfo.push(`  URL: ${att.url}`);
        }
        parts.push(attachmentInfo.join("\n") + "\n");
      });
    }

    // Add children recursively with the same processedIds set
    comment.children.forEach((child) => {
      const childBoundary = generateBoundary();
      parts.push(
        `\n--${boundary}\n`,
        `Content-Type: multipart/mixed; boundary="${childBoundary}"\n`,
        formatTextComment(child, childBoundary, settings, new Set(processedIds)),
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

const formatJSONComment = (comment: CommentData, settings: ExportSettings): JSONComment => {
  try {
    const content = settings.truncateContent && settings.maxContentLength
      ? truncateContent(comment.content, settings.maxContentLength)
      : comment.content;

    return {
      id: comment.id,
      userId: comment.userId,
      type: comment.type,
      timestamp: comment.timestamp,
      content,
      contentHash: comment.contentHash,
      attachments: comment.attachments.map((att) => ({
        name: att.name,
        type: att.type,
        ...(settings.includeAttachmentUrls ? { url: att.url } : {}),
      })),
      children: comment.children.map(child => formatJSONComment(child, settings)),
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

const formatXMLComment = (comment: CommentData, parent: XMLBuilder, settings: ExportSettings): void => {
  try {
    const elem = parent.ele("comment");
    elem.ele("id").txt(comment.id);
    elem.ele("userId").txt(comment.userId);
    elem.ele("type").txt(comment.type);
    elem.ele("timestamp").txt(comment.timestamp.toString());
    elem.ele("contentHash").txt(comment.contentHash);

    const content = settings.truncateContent && settings.maxContentLength
      ? truncateContent(comment.content, settings.maxContentLength)
      : comment.content;
    elem.ele("content").dat(content);

    if (comment.attachments.length > 0) {
      const attachments = elem.ele("attachments");
      comment.attachments.forEach((att) => {
        const attElem = attachments.ele("attachment");
        attElem.ele("name").txt(att.name);
        if (att.type) {
          attElem.ele("type").txt(att.type);
        }
        if (settings.includeAttachmentUrls) {
          attElem.ele("url").txt(att.url);
        }
      });
    }

    if (comment.children.length > 0) {
      const children = elem.ele("children");
      comment.children.forEach((child) => formatXMLComment(child, children, settings));
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
  format: ExportFormat,
  settings: ExportSettings = { includeAttachmentUrls: true, truncateContent: false }
): string => {
  if (!Array.isArray(comments)) {
    throw new Error("Comments must be an array");
  }

  try {
    switch (format) {
      case "text": {
        const boundary = generateBoundary();
        const parts = comments.map((comment) =>
          formatTextComment(comment, boundary, settings)
        );
        return parts.join("\n") + `\n--${boundary}--\n`;
      }
      case "json": {
        const jsonComments = comments.map((comment) =>
          formatJSONComment(comment, settings)
        );
        return JSON.stringify(jsonComments, null, 2);
      }
      case "xml": {
        const doc = create({ version: "1.0", encoding: "UTF-8" });
        const root = doc.ele("comments");
        comments.forEach((comment) => formatXMLComment(comment, root, settings));
        return doc.end({ prettyPrint: true });
      }
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error("Error exporting comments:", error);
    throw new Error(
      `Failed to export comments: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
