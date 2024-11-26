/// <reference lib="webworker" />

import { Comment } from "../types";

const generateBoundary = (): string => {
  return "----Boundary" + Math.random().toString(36).substring(2);
};

const truncateDataUrl = (dataUrl: string): string => {
  return dataUrl.length > 100 ? dataUrl.substring(0, 100) + "..." : dataUrl;
};

const processComment = (
  comment: Comment,
  truncate: boolean = true
): Comment => {
  try {
    return {
      ...comment,
      attachments: comment.attachments.map((att) => ({
        ...att,
        url: truncate ? truncateDataUrl(att.url) : att.url,
        type: att.type || "",
      })),
      children: comment.children.map((child) =>
        processComment(child, truncate)
      ),
    };
  } catch (error) {
    console.error("Error processing comment:", error);
    throw error;
  }
};

const formatTextComment = (
  comment: Comment,
  truncate: boolean,
  parentId?: string
): string => {
  try {
    const boundary = generateBoundary();
    const parts = [
      `Content-Type: multipart/mixed; boundary="${boundary}"\n`,
      `--${boundary}\n`,
      `Content-Type: text/plain; charset="UTF-8"\n`,
      `User-Id: ${comment.userId}\n`,
      `Hash: ${comment.contentHash}\n`,
      `Timestamp: ${comment.timestamp}\n`,
      `Id: ${comment.id}\n`,
    ];

    if (parentId) {
      parts.push(`Parent-Id: ${parentId}\n`);
    }

    parts.push(`\n${comment.content}\n`);

    const processedComment = processComment(comment, truncate);
    processedComment.attachments.forEach((att) => {
      parts.push(
        `\n--${boundary}\n`,
        `Content-Type: ${att.type}\n`,
        `Content-Disposition: attachment; filename="${att.name}"\n`,
        `Content-Transfer-Encoding: base64\n`,
        `\n${att.url}\n`
      );
    });

    processedComment.children.forEach((child) => {
      parts.push(
        `\n--${boundary}\n`,
        formatTextComment(child, truncate, comment.id)
      );
    });

    parts.push(`\n--${boundary}--\n`);
    return parts.join("");
  } catch (error) {
    console.error("Error formatting text comment:", error);
    throw error;
  }
};

const handleExport = (
  comments: Comment[],
  format: string,
  truncate: boolean
): string => {
  console.log("Starting export process:", {
    format,
    commentsCount: comments.length,
  });

  try {
    let result = "";
    const totalComments = comments.length;
    const updateInterval = Math.max(1, Math.floor(totalComments / 100));

    switch (format) {
      case "text": {
        const mainBoundary = generateBoundary();
        const parts = [
          `Content-Type: multipart/mixed; boundary="${mainBoundary}"\n`,
        ];

        for (let i = 0; i < comments.length; i++) {
          parts.push(
            `\n--${mainBoundary}\n`,
            formatTextComment(comments[i], truncate)
          );

          if (i % updateInterval === 0) {
            self.postMessage({
              type: "progress",
              progress: (i / totalComments) * 100,
            });
          }
        }

        parts.push(`\n--${mainBoundary}--\n`);
        result = parts.join("");
        break;
      }

      case "json": {
        const processed = [];
        for (let i = 0; i < comments.length; i++) {
          processed.push(processComment(comments[i], truncate));

          if (i % updateInterval === 0) {
            self.postMessage({
              type: "progress",
              progress: (i / totalComments) * 100,
            });
          }
        }
        result = JSON.stringify(processed, null, 2);
        break;
      }

      case "xml": {
        const parts = ['<?xml version="1.0" encoding="UTF-8"?>\n<comments>'];

        for (let i = 0; i < comments.length; i++) {
          const comment = processComment(comments[i], truncate);
          parts.push(`
  <comment>
    <id>${comment.id}</id>
    <userId>${comment.userId}</userId>
    <timestamp>${comment.timestamp}</timestamp>
    <contentHash>${comment.contentHash}</contentHash>
    <content><![CDATA[${comment.content}]]></content>
    <attachments>`);

          comment.attachments.forEach((att) => {
            parts.push(`
      <attachment>
        <type>${att.type}</type>
        <url><![CDATA[${att.url}]]></url>
        <name>${att.name}</name>
      </attachment>`);
          });

          parts.push(`
    </attachments>
  </comment>`);

          if (i % updateInterval === 0) {
            self.postMessage({
              type: "progress",
              progress: (i / totalComments) * 100,
            });
          }
        }

        parts.push("\n</comments>");
        result = parts.join("");
        break;
      }

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    console.log("Export completed successfully");
    return result;
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
};

self.onmessage = (event: MessageEvent) => {
  console.log("Worker received message:", event.data);

  try {
    const { comments, format, truncate = true } = event.data;

    if (!comments || !Array.isArray(comments)) {
      throw new Error("Invalid comments data");
    }

    if (!format) {
      throw new Error("Format not specified");
    }

    const result = handleExport(comments, format, truncate);

    self.postMessage({
      type: "complete",
      result,
    });
  } catch (error) {
    console.error("Worker error:", error);
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export {};
