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

const parseMultipartContent = (content: string): Comment[] => {
  const comments: Comment[] = [];
  const commentMap = new Map<string, Comment>();

  // Find the boundary from the Content-Type header
  const boundaryMatch = content.match(/boundary="([^"]+)"/);
  if (!boundaryMatch) return [];

  const boundary = boundaryMatch[1];
  const parts = content
    .split(new RegExp(`--${boundary}(?:--|\\n)`))
    .filter(Boolean)
    .filter((part) => part.trim().length > 0);

  // Skip the first part if it's just the Content-Type header
  const startIndex = parts[0].trim().startsWith("Content-Type:") ? 1 : 0;

  let currentComment: Partial<Comment> | null = null;

  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Check if this part contains a nested multipart content
    const nestedBoundaryMatch = part.match(
      /Content-Type: multipart\/mixed; boundary="([^"]+)"/
    );

    if (nestedBoundaryMatch) {
      // This is a nested comment, recursively parse it
      const nestedComments = parseMultipartContent(part);
      if (nestedComments.length > 0) {
        const nestedComment = nestedComments[0];

        // If this nested comment has a parent ID, add it to the parent's children
        const parentId = part.match(/Parent-Id: ([^\n]+)/)?.[1]?.trim();
        if (parentId && commentMap.has(parentId)) {
          const parent = commentMap.get(parentId)!;
          parent.children.push(nestedComment);
        } else {
          comments.push(nestedComment);
        }
      }
      continue;
    }

    // Check if this part is an attachment
    if (part.includes("Content-Disposition: attachment;")) {
      if (currentComment) {
        const nameMatch = part.match(/filename="([^"]+)"/);
        const typeMatch = part.match(/Content-Type: ([^\n]+)/);
        const urlMatch = part
          .split(/\r?\n\r?\n/)
          .pop()
          ?.trim();

        if (nameMatch && typeMatch && urlMatch) {
          currentComment.attachments?.push({
            name: nameMatch[1],
            type: typeMatch[1].trim(),
            url: urlMatch,
            file: new File([], nameMatch[1]),
          });
        }
      }
      continue;
    }

    // This must be a comment part
    const lines = part.split("\n");
    currentComment = {
      id: "",
      userId: "",
      timestamp: 0,
      contentHash: "",
      content: "",
      attachments: [],
      children: [],
    };

    let metadataEnded = false;
    const contentLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        if (!metadataEnded && currentComment.id) {
          metadataEnded = true;
        }
        continue;
      }

      if (!metadataEnded) {
        if (trimmedLine.startsWith("User-Id:")) {
          currentComment.userId = trimmedLine
            .substring("User-Id:".length)
            .trim();
        } else if (trimmedLine.startsWith("Hash:")) {
          currentComment.contentHash = trimmedLine
            .substring("Hash:".length)
            .trim();
        } else if (trimmedLine.startsWith("Timestamp:")) {
          currentComment.timestamp = parseInt(
            trimmedLine.substring("Timestamp:".length).trim()
          );
        } else if (trimmedLine.startsWith("Id:")) {
          currentComment.id = trimmedLine.substring("Id:".length).trim();
        }
      } else {
        contentLines.push(trimmedLine);
      }
    }

    if (contentLines.length > 0) {
      currentComment.content = contentLines.join("\n");
    }

    if (currentComment.id) {
      const comment = currentComment as Comment;
      commentMap.set(comment.id, comment);
      comments.push(comment);
    }
  }

  return comments;
};

const parseTextComment = (content: string): Comment[] => {
  return parseMultipartContent(content);
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
