import React, { useState } from 'react';
import { Download } from 'lucide-react';
import CommentTree from './components/CommentTree';
import CommentEditor from './components/CommentEditor';
import { Comment } from './types';
import { exportComments } from './utils/export';

function App() {
  const [comments, setComments] = useState<Comment[]>([]);

  const addComment = (content: string) => {
    const comment: Comment = {
      id: Date.now().toString(),
      content,
      children: [],
    };
    setComments([...comments, comment]);
  };

  const handleExport = () => {
    const text = exportComments(comments);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comments.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Comment Manager</h1>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download size={20} />
              Export
            </button>
          </div>
          
          <div className="mb-8">
            <CommentEditor onSubmit={addComment} />
          </div>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No comments yet. Add one to get started!
              </div>
            ) : (
              <CommentTree
                comments={comments}
                updateComments={setComments}
                level={0}
                rootComments={comments}
                rootUpdateComments={setComments}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;