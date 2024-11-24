import { Comment } from '../types';

export const exportComments = (comments: Comment[], level = 0): string => {
  return comments.map(comment => {
    const indent = '\t'.repeat(level);
    const currentLine = `${indent}${comment.content}\n`;
    const childrenText = comment.children.length > 0
      ? exportComments(comment.children, level + 1)
      : '';
    return currentLine + childrenText;
  }).join('');
};