import { Comment, Attachment } from "../types";
import { create } from "xmlbuilder2";

interface XMLContent {
  $?: string;
  __cdata?: string;
  _cdata?: string;
  _text?: string;
}

interface XMLAttachment {
  type?: string;
  url?: XMLContent | string;
  name?: string;
}

interface XMLAttachments {
  attachment?: XMLAttachment[] | XMLAttachment;
}

interface XMLComment {
  id?: string;
  userId?: string;
  timestamp?: string;
  contentHash?: string;
  content?: XMLContent | string;
  attachments?: XMLAttachments;
  children?: {
    comment?: XMLComment[] | XMLComment;
  };
}

interface XMLRoot {
  comments: {
    comment: XMLComment[] | XMLComment;
  };
}

interface ParsedComment extends Omit<Comment, "children" | "attachments"> {
  children: ParsedComment[];
  attachments: ParsedAttachment[];
}

interface ParsedAttachment extends Omit<Attachment, "file"> {
  name: string;
  url: string;
  type: string;
}

const parseTextComment = (content: string): Comment[] => {
  const comments: Comment[] = [];
  const lines = content.split("\n");
  let currentComment: Partial<Comment> | null = null;
  let currentBoundary: string | null = null;
  let parentBoundary: string | null = null;
  let parentId: string | null = null;
  let currentAttachment: Partial<Attachment> | null = null;

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

      // Save current attachment if exists
      if (currentAttachment && currentComment?.attachments) {
        currentComment.attachments.push({
          name: currentAttachment.name || "",
          url: currentAttachment.url || "",
          type: currentAttachment.type || "",
          file: new File([], currentAttachment.name || ""),
        });
        currentAttachment = null;
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

    if (line.startsWith("Content-Disposition: attachment;")) {
      currentAttachment = {};
      const filename = line.match(/filename="([^"]+)"/)?.[1];
      if (filename) {
        currentAttachment.name = filename;
      }
      continue;
    }

    if (
      line.startsWith("Content-Type: ") &&
      !line.includes("multipart/mixed")
    ) {
      if (currentAttachment) {
        currentAttachment.type = line.substring("Content-Type: ".length);
      }
      continue;
    }

    if (line.startsWith("Content-Data: ")) {
      if (currentAttachment) {
        currentAttachment.url = line.substring("Content-Data: ".length);
      }
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
    } else if (line.length > 0 && !line.startsWith("Content-")) {
      currentComment.content = line;
    }
  }

  // Save last attachment if exists
  if (currentAttachment && currentComment?.attachments) {
    currentComment.attachments.push({
      name: currentAttachment.name || "",
      url: currentAttachment.url || "",
      type: currentAttachment.type || "",
      file: new File([], currentAttachment.name || ""),
    });
  }

  // Save last comment if exists
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

  return comments;
};

const convertParsedToComment = (parsed: ParsedComment): Comment => {
  return {
    ...parsed,
    attachments: parsed.attachments.map((att) => ({
      ...att,
      file: new File([], att.name),
    })),
    children: parsed.children.map(convertParsedToComment),
  };
};

const parseJSONComment = (content: string): Comment[] => {
  try {
    const parsed = JSON.parse(content) as ParsedComment[];
    return parsed.map(convertParsedToComment);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return [];
  }
};

const parseXMLComment = (content: string): Comment[] => {
  try {
    const doc = create(content);
    const obj = doc.end({ format: "object" }) as unknown as XMLRoot;

    const parseComment = (xmlComment: XMLComment): Comment => {
      // Handle content that might be a string or an object with CDATA in $ property
      const commentContent =
        typeof xmlComment.content === "string"
          ? xmlComment.content
          : xmlComment.content?.$ ||
            xmlComment.content?.__cdata ||
            xmlComment.content?._cdata ||
            xmlComment.content?._text ||
            "";

      // Parse attachments
      const attachments = xmlComment.attachments?.attachment
        ? Array.isArray(xmlComment.attachments.attachment)
          ? xmlComment.attachments.attachment
          : [xmlComment.attachments.attachment]
        : [];

      const parsedAttachments = attachments.map((att) => ({
        name: att.name || "",
        url:
          typeof att.url === "string"
            ? att.url
            : att.url?.$ ||
              att.url?.__cdata ||
              att.url?._cdata ||
              att.url?._text ||
              "",
        type: att.type || "",
        file: new File([], att.name || ""),
      }));

      return {
        id: xmlComment.id || "",
        userId: xmlComment.userId || "",
        timestamp: parseInt(xmlComment.timestamp || "0"),
        contentHash: xmlComment.contentHash || "",
        content: commentContent,
        attachments: parsedAttachments,
        children: xmlComment.children?.comment
          ? (Array.isArray(xmlComment.children.comment)
              ? xmlComment.children.comment
              : [xmlComment.children.comment]
            ).map(parseComment)
          : [],
      };
    };

    const comments = obj.comments.comment;
    return Array.isArray(comments)
      ? comments.map(parseComment)
      : [parseComment(comments)];
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
