import { Comment } from "../types";
import { create } from "xmlbuilder2";

interface XMLComment {
  id?: { _text?: string };
  userId?: { _text?: string };
  timestamp?: { _text?: string };
  contentHash?: { _text?: string };
  content?: { _text?: string };
  attachments?: {
    attachment?:
      | Array<{
          name?: { _text?: string };
          url?: { _text?: string };
          type?: { _text?: string };
        }>
      | {
          name?: { _text?: string };
          url?: { _text?: string };
          type?: { _text?: string };
        };
  };
  children?: {
    comment?: XMLComment[] | XMLComment;
  };
}

interface XMLRoot {
  comments?: {
    comment?: XMLComment[] | XMLComment;
  };
}

const parseTextComment = (content: string): Comment[] => {
  const comments: Comment[] = [];
  const lines = content.split("\n");
  let currentComment: Partial<Comment> | null = null;
  let currentBoundary: string | null = null;
  let parentBoundary: string | null = null;
  let parentId: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("Content-Type: multipart/mixed; boundary=")) {
      parentBoundary = currentBoundary;
      currentBoundary = line.match(/boundary="([^"]+)"/)?.[1] || null;
      continue;
    }

    if (
      line.startsWith("--") &&
      currentBoundary &&
      line.includes(currentBoundary)
    ) {
      if (line.endsWith("--")) {
        // End of multipart section
        currentBoundary = parentBoundary;
        parentBoundary = null;
        continue;
      }

      if (currentComment) {
        if (!currentComment.attachments) currentComment.attachments = [];
        if (!currentComment.children) currentComment.children = [];
        comments.push(currentComment as Comment);
      }

      currentComment = {
        id: "",
        userId: "",
        timestamp: 0,
        contentHash: "",
        content: "",
        attachments: [],
        children: [],
      };
      continue;
    }

    if (!currentComment) continue;

    if (line.startsWith("Content-Disposition: reply; to=")) {
      parentId = line.match(/to=([^;\s]+)/)?.[1] || null;
      continue;
    }

    if (line.startsWith("User-Id: ")) {
      currentComment.userId = line.substring("User-Id: ".length);
    } else if (line.startsWith("Hash: ")) {
      currentComment.contentHash = line.substring("Hash: ".length);
    } else if (line.startsWith("Timestamp: ")) {
      currentComment.timestamp = parseInt(line.substring("Timestamp: ".length));
    } else if (line.startsWith("E-Tag: ")) {
      currentComment.id = line.substring("E-Tag: ".length);
    } else if (
      line.startsWith("Content-Type: ") &&
      !line.includes("multipart/mixed")
    ) {
      // Handle attachment content type
      continue;
    } else if (line.startsWith("Content-Disposition: attachment;")) {
      // Handle attachment
      const filename = line.match(/filename="([^"]+)"/)?.[1];
      if (filename) {
        currentComment.attachments?.push({
          name: filename,
          url: "",
          file: new File([], filename),
          type: "",
        });
      }
    } else if (line.length > 0 && !line.startsWith("Content-")) {
      currentComment.content = line;
    }
  }

  if (currentComment) {
    if (!currentComment.attachments) currentComment.attachments = [];
    if (!currentComment.children) currentComment.children = [];
    comments.push(currentComment as Comment);
  }

  // Process reply relationships
  const commentMap = new Map<string, Comment>();
  comments.forEach((comment) => commentMap.set(comment.id, comment));

  comments.forEach((comment) => {
    if (parentId && commentMap.has(parentId)) {
      const parent = commentMap.get(parentId)!;
      parent.children.push(comment);
      // Remove from root level
      const index = comments.indexOf(comment);
      if (index > -1) {
        comments.splice(index, 1);
      }
    }
  });

  console.log("TEXT", { comments });

  return comments;
};

const parseJSONComment = (content: string): Comment[] => {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return [];
  }
};

const parseXMLComment = (content: string): Comment[] => {
  try {
    const doc = create(content);
    const obj = doc.end({ format: "object" }) as XMLRoot;

    const parseComment = (xmlComment: XMLComment): Comment => {
      const attachments = xmlComment.attachments?.attachment
        ? Array.isArray(xmlComment.attachments.attachment)
          ? xmlComment.attachments.attachment
          : [xmlComment.attachments.attachment]
        : [];

      return {
        id: xmlComment.id?._text || "",
        userId: xmlComment.userId?._text || "",
        timestamp: parseInt(xmlComment.timestamp?._text || "0"),
        contentHash: xmlComment.contentHash?._text || "",
        content: xmlComment.content?._text || "",
        attachments: attachments.map((att) => ({
          name: att.name?._text || "",
          url: att.url?._text || "",
          type: att.type?._text || "",
          file: new File([], att.name?._text || ""),
        })),
        children: xmlComment.children?.comment
          ? (Array.isArray(xmlComment.children.comment)
              ? xmlComment.children.comment
              : [xmlComment.children.comment]
            ).map(parseComment)
          : [],
      };
    };

    const comments = obj.comments?.comment;
    return comments
      ? Array.isArray(comments)
        ? comments.map(parseComment)
        : [parseComment(comments)]
      : [];
  } catch (error) {
    console.error("Error parsing XML:", error);
    return [];
  }
};

export const importComments = (content: string, format: string): Comment[] => {
  switch (format) {
    case "text":
      return parseTextComment(content);
    case "json":
      return parseJSONComment(content);
    case "xml":
      return parseXMLComment(content);
    default:
      return [];
  }
};
