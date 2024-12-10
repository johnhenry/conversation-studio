# Conversation Format Documentation

## Overview
This document describes the JSON format used by Conversation Studio to represent branching conversations. The format supports rich content, including attachments, artifacts, and nested replies, making it suitable for complex conversational interactions.

## Core Concepts

### 1. Branching Structure
- Conversations are represented as a tree of comments
- Each comment can have multiple child comments (replies)
- Comments maintain parent-child relationships through IDs
- Supports unlimited nesting depth for complex conversation threads

### 2. Comment Types
- User comments: Regular user input
- Assistant comments: Responses from AI assistants
- Support for custom comment types through the `type` field
- Each comment type can have specific rendering and behavior rules

### 3. Content Management
- Text content with markdown support
- Content integrity verification through hashing
- Support for attachments (files, images)
- Generated artifacts (code, charts, interactive elements)

## JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "$ref": "#/definitions/Comment"
  },
  "definitions": {
    "Comment": {
      "type": "object",
      "required": [
        "id",
        "userId",
        "timestamp",
        "content",
        "contentHash",
        "children",
        "attachments",
        "type"
      ],
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier for the comment"
        },
        "userId": {
          "type": "string",
          "description": "Identifier of the user who created the comment"
        },
        "type": {
          "type": "string",
          "description": "Type of the comment (e.g., 'user', 'assistant')"
        },
        "timestamp": {
          "type": "number",
          "description": "Unix timestamp of when the comment was created"
        },
        "content": {
          "type": "string",
          "description": "The main text content of the comment"
        },
        "contentHash": {
          "type": "string",
          "description": "Hash of the content for integrity verification"
        },
        "attachments": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Attachment"
          },
          "description": "List of files attached to the comment"
        },
        "children": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Comment"
          },
          "description": "Nested replies to this comment"
        },
        "parentId": {
          "type": ["string", "null"],
          "description": "ID of the parent comment, if this is a reply"
        },
        "deleted": {
          "type": "boolean",
          "description": "Whether the comment has been deleted"
        },
        "artifacts": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Artifact"
          },
          "description": "Generated content or interactive elements"
        }
      }
    },
    "Attachment": {
      "type": "object",
      "required": ["url", "name", "file"],
      "properties": {
        "url": {
          "type": "string",
          "description": "URL to the attachment content. Can be either a regular HTTP(S) URL or a data URL containing base64-encoded content (e.g., 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...')"
        },
        "type": {
          "type": "string",
          "description": "MIME type of the attachment"
        },
        "name": {
          "type": "string",
          "description": "Filename of the attachment"
        },
        "file": {
          "type": "object",
          "description": "Additional file metadata",
          "properties": {
            "dimensions": {
              "type": "object",
              "properties": {
                "width": {
                  "type": "number"
                },
                "height": {
                  "type": "number"
                }
              }
            }
          }
        }
      }
    },
    "Artifact": {
      "type": "object",
      "required": ["id", "type", "title", "status", "command"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier for the artifact"
        },
        "type": {
          "type": "string",
          "description": "Type of artifact (e.g., 'text/markdown', 'application/vnd.ant.code')"
        },
        "title": {
          "type": "string",
          "description": "Display title of the artifact"
        },
        "info": {
          "type": "string",
          "description": "Additional information about the artifact"
        },
        "status": {
          "type": "string",
          "enum": ["visible", "hidden"],
          "description": "Visibility status of the artifact"
        },
        "command": {
          "type": "string",
          "description": "Action associated with the artifact"
        }
      }
    }
  }
}
```

## Implementation Details

### ID Generation
Comments use a combination of timestamp and random string for unique identification:
```javascript
const generateUniqueId = () => {
  const timestamp = Date.now();
  const randomBytes = new Uint8Array(16);
  window.crypto.getRandomValues(randomBytes);
  const uuid = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${timestamp}-${uuid}`;
};
```

### Content Hash Generation
Content integrity is verified using a simple hash function:
```javascript
function generateContentHash(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substr(0, 10);
}
```

### Artifact Type Detection
The system automatically detects artifact types based on content and titles:
- Python code: `application/vnd.ant.code`
- HTML: `text/html`
- SVG: `image/svg+xml`
- React components: `application/vnd.ant.react`
- Mermaid diagrams: `application/vnd.ant.mermaid`
- Default: `text/markdown`

## Import/Export Support

### Supported Formats
1. **JSON (Native)**
   - Direct representation of the conversation structure
   - Preserves all metadata and relationships
   - Recommended for data backup and system interop

2. **Text Format**
   - MIME-style boundaries between messages
   - Includes headers for metadata
   - Suitable for human-readable exports

3. **XML Format**
   - Structured representation with CDATA sections
   - Preserves all data relationships
   - Good for integration with XML-based systems

### Export Process
The application uses a Web Worker for efficient export processing:
1. Comments are processed in batches
2. Progress updates are emitted during export
3. Large conversations are handled without blocking the UI

## TypeScript Interfaces

### Base Types
```typescript
// Base attachment type
interface Attachment {
  url: string;
  type?: string;
  name: string;
  file: File;
}

// Base comment type without UI-specific properties
interface CommentData {
  id: string;
  userId: string;
  type: string;
  timestamp: number;
  content: string;
  contentHash: string;
  attachments: Attachment[];
  children: CommentData[];
  parentId?: string | null;
  deleted?: boolean;
}

// UI-specific comment type
interface Comment extends CommentData {
  renderAttachment?: (attachment: Attachment) => ReactNode | null;
}
```

## Example Usage

### Basic Comment
```json
{
  "id": "1733794702200ka59h",
  "userId": "user",
  "type": "user",
  "timestamp": 1733794702200,
  "content": "What is in the file",
  "contentHash": "50dcdf2c",
  "attachments": [],
  "children": []
}
```

### Basic Comment with Data URL Attachment
```json
{
  "id": "1733794702200ka59h",
  "userId": "user",
  "type": "user",
  "timestamp": 1733794702200,
  "content": "Here's an image",
  "contentHash": "50dcdf2c",
  "attachments": [
    {
      "file": {
        "dimensions": {
          "width": 1024,
          "height": 768
        }
      },
      "name": "example.png",
      "type": "image/png",
      "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ],
  "children": []
}
```

### Comment with External URL Attachment
```json
{
  "id": "1733794702200ka59h",
  "userId": "user",
  "type": "user",
  "timestamp": 1733794702200,
  "content": "External file reference",
  "contentHash": "50dcdf2c",
  "attachments": [
    {
      "file": {},
      "name": "document.pdf",
      "type": "application/pdf",
      "url": "https://example.com/files/document.pdf"
    }
  ],
  "children": []
}
```

### Comment with Attachment
```json
{
  "id": "1733794702200ka59h",
  "userId": "user",
  "type": "user",
  "timestamp": 1733794702200,
  "content": "What is in the file",
  "contentHash": "50dcdf2c",
  "attachments": [
    {
      "file": {},
      "name": "abc.txt",
      "type": "text/plain",
      "url": null
    }
  ],
  "children": []
}
```

### Comment with Artifact
```json
{
  "id": "1733794702200soijv",
  "userId": "assistant",
  "type": "assistant",
  "timestamp": 1733794702200,
  "content": "Here's an interactive chart",
  "contentHash": "29f904d9",
  "attachments": [],
  "artifacts": [
    {
      "id": "1733794702200gsghc",
      "type": "application/vnd.ant.react",
      "title": "Interactive Chart Component",
      "info": "Click to open component",
      "status": "visible",
      "command": "create"
    }
  ],
  "children": []
}
```

## Best Practices

1. **Content Management**
   - Use markdown for formatted text
   - Store binary content as data URIs or external URLs
   - Include proper MIME types for all attachments

2. **Data Integrity**
   - Always generate content hashes for verification
   - Validate parent-child relationships
   - Preserve all required fields

3. **Performance**
   - Limit attachment sizes
   - Consider pagination for large conversation trees
   - Use the Web Worker for exports

4. **UI Integration**
   - Separate UI-specific properties from core data
   - Use the Comment interface for UI components
   - Implement custom renderers for different content types

## Migration Considerations

When updating the conversation format:
1. Maintain backward compatibility
2. Provide migration utilities
3. Version the schema if making breaking changes
4. Document all changes and migration paths

## Security Considerations

1. **Content Security**
   - Sanitize markdown content
   - Validate attachment types
   - Scan for malicious content

2. **Data Privacy**
   - Consider encryption for sensitive content
   - Implement proper access controls
   - Handle user data according to privacy regulations

3. **File Safety**
   - Validate file types and sizes
   - Scan attachments for security threats
   - Implement proper file storage policies
