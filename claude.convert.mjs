async function extractMessages() {
  const messages = [];
  console.log("Starting message extraction");

  const messageElements = Array.from(
    document.querySelectorAll(
      ".group.relative.inline-flex, .group.relative.pt-3\\.5"
    )
  );
  console.log("Found message elements:", messageElements.length);

  for (const element of messageElements) {
    const message = {
      id: generateMessageId(),
      timestamp: Date.now(),
      children: [],
      attachments: [],
      artifacts: [],
    };

    if (element.querySelector(".font-user-message")) {
      message.type = "user";
      const userInitial = element.querySelector(
        ".rounded-full.font-bold.h-7.w-7"
      );
      message.userId = userInitial ? userInitial.textContent.trim() : "user";

      // First check if we need to look higher in the DOM
      let searchElement = element;
      const parentMessage = element.closest(".mb-1.mt-1");
      if (parentMessage) {
        searchElement = parentMessage;
      }

      // Extract file attachments
      console.log("Examining message and parent for attachments");

      // Track attachment names to avoid duplicates
      const addedAttachments = new Set();

      // Look for images
      const imageAttachments =
        searchElement.querySelectorAll('img[src^="/api"]');
      console.log(
        "Found potential image attachments:",
        imageAttachments.length
      );
      for (const img of imageAttachments) {
        const fileName = img.getAttribute("alt");
        if (fileName && !addedAttachments.has(fileName)) {
          addedAttachments.add(fileName);
          const originalUrl = img.getAttribute("src");

          let url = originalUrl;
          try {
            const response = await fetch(originalUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            url = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.warn("Failed to convert image to base64:", error);
          }

          message.attachments.push({
            type: "image",
            url: url,
            name: fileName,
            file: {
              dimensions: {
                width: parseInt(img.getAttribute("width")) || null,
                height: parseInt(img.getAttribute("height")) || null,
              },
            },
          });
          console.log("Added image attachment:", fileName);
        }
      }

      // Look for file attachments
      const fileAttachments = searchElement.querySelectorAll("[data-testid]");
      console.log("Found potential file attachments:", fileAttachments.length);
      for (const container of fileAttachments) {
        const fileName = container.getAttribute("data-testid");
        if (
          fileName &&
          fileName.includes(".") &&
          !addedAttachments.has(fileName)
        ) {
          addedAttachments.add(fileName);
          message.attachments.push({
            type: fileName.endsWith(".txt")
              ? "text/plain"
              : `application/${fileName.split(".").pop().toLowerCase()}`,
            url: null,
            name: fileName,
            file: {},
          });
          console.log("Added file attachment:", fileName);
        }
      }
    } else {
      message.type = "assistant";
      message.userId = "claude";

      // Look for artifacts within Claude messages
      console.log("Looking for artifacts in Claude message");

      // Look for visible artifacts first
      const artifactContainers = element.querySelectorAll(".font-styrene");
      console.log(
        "Found potential artifact containers:",
        artifactContainers.length
      );

      // Track found artifacts to avoid duplicates
      const foundArtifacts = new Set();

      artifactContainers.forEach((container) => {
        const titleElement = container.querySelector(".text-sm.font-medium");
        const infoElement = container.querySelector(".text-text-400");

        if (titleElement) {
          const title = titleElement.textContent.trim();
          console.log("Processing artifact:", {
            title,
            info: infoElement?.textContent.trim(),
          });

          const artifactData = {
            id: generateMessageId(),
            type: determineArtifactType(title),
            title: title,
            info: infoElement?.textContent.trim(),
            status: "visible",
            command: "create",
          };

          message.artifacts.push(artifactData);
          foundArtifacts.add(title);
          console.log("Added visible artifact:", artifactData);
        }
      });

      // Then look for artifact references in the message content
      const fullContent = element.textContent || "";
      console.log("Checking for artifact references in content");

      if (
        fullContent.includes("antml:invoke") ||
        fullContent.includes("artifacts")
      ) {
        // Look for reference patterns in text content
        const matches =
          fullContent.match(/<invoke[\s\S]*?<\/antml:invoke>/g) || [];
        matches.forEach((match) => {
          if (match.includes("artifacts") || match.includes("create")) {
            const id =
              extractParameter(match, "id") ||
              extractParameter(match, "identifier");
            const title = extractParameter(match, "title");
            const type = extractParameter(match, "type");

            // Only add if we haven't already found this artifact visually
            if (id && !foundArtifacts.has(title)) {
              const artifactData = {
                id,
                type,
                title,
                content: extractParameter(match, "content"),
                command: extractParameter(match, "command") || "create",
                status: "reference",
              };

              message.artifacts.push(artifactData);
              console.log("Added artifact reference:", artifactData);
            }
          }
        });
      }
    }

    // Extract message content
    const contentElement = element.querySelector(
      ".font-user-message, .font-claude-message"
    );
    if (contentElement) {
      message.content = contentElement.textContent.trim();
      message.contentHash = generateContentHash(message.content);
    }

    messages.push(message);
  }

  console.log("Extraction complete. Found messages:", messages.length);
  return messages;
}

function extractParameter(text, name) {
  const regex = new RegExp(
    `<(antml:)?parameter[^>]*name=["']${name}["'][^>]*>([\\s\\S]*?)<\/(antml:)?parameter>`
  );
  const match = text.match(regex);
  return match ? match[2].trim() : null;
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

function determineArtifactType(title) {
  title = title.toLowerCase();

  // Extract type from title patterns
  if (title.includes("hello world in python") || title.includes("python"))
    return "application/vnd.ant.code";
  if (title.includes("hello world in html") || title.includes("html"))
    return "text/html";
  if (title.includes("hello world in svg") || title.includes("svg"))
    return "image/svg+xml";
  if (title.includes("react")) return "application/vnd.ant.react";
  if (title.includes("mermaid")) return "application/vnd.ant.mermaid";

  // Try to infer from content patterns
  return "text/markdown"; // Default to markdown if we can't determine type
}

export default extractMessages;
