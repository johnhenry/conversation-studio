async function extractMessages() {
  const messages = [];
  console.log("Starting message extraction");

  // Find all message groups
  const messageGroups = Array.from(
    document.querySelectorAll(".group\\/conversation-turn")
  );
  console.log("Found message groups:", messageGroups.length);

  for (const group of messageGroups) {
    const message = {
      id: generateMessageId(),
      timestamp: Date.now(),
      children: [],
      attachments: [],
      contentHash: null,
    };

    // Determine message type and user ID
    const isAssistant = group.querySelector(".agent-turn");
    message.type = isAssistant ? "assistant" : "user";
    message.userId = isAssistant ? "chatgpt" : "user";

    // Extract content
    const contentElement = group.querySelector(".whitespace-pre-wrap");
    if (contentElement) {
      message.content = contentElement.textContent.trim();
      message.contentHash = generateContentHash(message.content);
    }

    // Extract attachments (images, files, etc.)
    const attachments = await extractAttachments(group);
    if (attachments.length > 0) {
      message.attachments = attachments;
    }

    // Extract artifacts/widgets
    const artifacts = await extractArtifacts(group);
    if (artifacts.length > 0) {
      message.artifacts = artifacts;
    }

    messages.push(message);
  }

  console.log("Extraction complete. Found messages:", messages.length);
  return messages;
}

async function extractAttachments(messageGroup) {
  const attachments = [];

  // Find image attachments
  const imageContainers = messageGroup.querySelectorAll(
    '.overflow-hidden.rounded-lg img[alt="Uploaded image"]'
  );

  for (const img of imageContainers) {
    try {
      const url = img.getAttribute("src");
      const dimensions = {
        width: parseInt(img.getAttribute("width")) || null,
        height: parseInt(img.getAttribute("height")) || null,
      };

      // Try to convert to base64 if it's an accessible URL
      let base64Url = url;
      if (url.startsWith("http")) {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          base64Url = await blobToBase64(blob);
        } catch (error) {
          console.warn("Failed to convert image to base64:", error);
        }
      }

      attachments.push({
        type: "image",
        url: base64Url,
        name: img.getAttribute("alt") || "uploaded-image",
        file: {
          dimensions,
        },
      });
    } catch (error) {
      console.error("Error processing image attachment:", error);
    }
  }

  return attachments;
}

async function extractArtifacts(messageGroup) {
  const artifacts = [];

  // Find artifact containers
  const artifactElements = messageGroup.querySelectorAll(
    '[id^="textdoc-message-"]'
  );

  for (const element of artifactElements) {
    try {
      const artifactId = element.id;
      const titleElement = element.querySelector(".text-sm.font-medium");
      const contentElement = element.querySelector(".cm-content");

      if (contentElement) {
        const artifactData = {
          id: artifactId,
          type: determineArtifactType(element),
          title: titleElement
            ? titleElement.textContent.trim()
            : "Untitled Artifact",
          content: contentElement.textContent,
          status: "visible",
        };

        artifacts.push(artifactData);
      }
    } catch (error) {
      console.error("Error processing artifact:", error);
    }
  }

  return artifacts;
}

function determineArtifactType(element) {
  // Look for type indicators in the element's classes and content
  const codeElement = element.querySelector(".cm-content");
  if (codeElement) {
    const lang = codeElement.getAttribute("data-language");
    if (lang) return `application/vnd.ant.code`;
  }

  // Check for specific widget types
  if (element.querySelector("canvas")) return "application/vnd.ant.canvas";
  if (element.querySelector("svg")) return "image/svg+xml";
  if (element.textContent.includes("```mermaid"))
    return "application/vnd.ant.mermaid";

  // Default to markdown
  return "text/markdown";
}

function generateMessageId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

function generateContentHash(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substr(0, 10);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Export the main function
export default extractMessages;
