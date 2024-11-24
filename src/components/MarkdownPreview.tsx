import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm max-w-none"
      components={{
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-2 mb-1" {...props} />,
        p: ({node, ...props}) => <p className="mb-2" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
        li: ({node, ...props}) => <li className="mb-1" {...props} />,
        a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-4 border-gray-200 pl-4 my-2 text-gray-700" {...props} />
        ),
        code: ({node, inline, ...props}) => 
          inline ? (
            <code className="bg-gray-100 px-1 rounded" {...props} />
          ) : (
            <code className="block bg-gray-100 p-2 rounded my-2 whitespace-pre-wrap" {...props} />
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownPreview;