import React, { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import MarkdownPreview from './MarkdownPreview';

interface CommentEditorProps {
  onSubmit: (content: string) => void;
  initialContent?: string;
  buttonText?: string;
}

const CommentEditor: React.FC<CommentEditorProps> = ({ 
  onSubmit, 
  initialContent = '', 
  buttonText = 'Add Comment'
}) => {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content);
    setContent('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setIsPreview(false)}
          className={`px-3 py-1 rounded ${!isPreview ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
        >
          Edit
        </button>
        <button
          onClick={() => setIsPreview(true)}
          className={`px-3 py-1 rounded ${isPreview ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
        >
          Preview
        </button>
      </div>

      <div className="min-h-[100px]">
        {isPreview ? (
          <div className="border rounded-lg p-3 bg-gray-50">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your comment using Markdown..."
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
        )}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Supports Markdown. Press Ctrl+Enter to submit.</span>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <MessageSquarePlus size={20} />
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default CommentEditor;