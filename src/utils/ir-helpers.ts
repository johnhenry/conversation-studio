/**
 * IR (Intermediate Representation) Helper Functions
 * Utilities for working with ai.matey's IR format
 */

import type { IRMessage, IRChatRequest, MessageRole, TextContent } from 'ai.matey.types';

/**
 * Convert app comment format to IR message format
 *
 * @param comments - Array of comment objects from the app
 * @returns Array of IR messages
 */
export function commentsToIRMessages(
  comments: Array<{ role: string; content: string }>
): IRMessage[] {
  return comments.map((comment) => ({
    role: comment.role as MessageRole,
    content: comment.content,
  }));
}

/**
 * Extract text content from an IR message
 *
 * IR messages can have either string content or structured content blocks.
 * This function extracts the text from either format.
 *
 * @param message - IR message
 * @returns Extracted text content
 */
export function extractMessageContent(message: IRMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  // Handle structured content (multi-modal, tool use, etc.)
  return message.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as TextContent).text)
    .join('');
}

/**
 * Create an IR chat request from conversation history
 *
 * @param messages - Conversation messages in IR format
 * @param params - Request parameters (model, temperature, etc.)
 * @returns Complete IR chat request
 */
export function createIRRequest(
  messages: IRMessage[],
  params: {
    model?: string;
    temperature?: number;
    topK?: number;
    maxTokens?: number;
  }
): IRChatRequest {
  return {
    messages,
    parameters: {
      model: params.model,
      temperature: params.temperature,
      topK: params.topK,
      maxTokens: params.maxTokens,
    },
    metadata: {
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      provenance: {},
    },
    stream: false,
  };
}
