import React, { useState } from "react";
import { Download } from "lucide-react";
import CommentTree from "./components/CommentTree";
import CommentEditor from "./components/CommentEditor";
import { Comment } from "./types";
import {
  exportCommentsText,
  exportCommentsJSON,
  exportCommentsXML,
} from "./utils/export";
import * as crypto from "crypto-js";

const generateContentHash = (content: string): string => {
  const hash = crypto.SHA256(content);
  return hash.toString().substring(0, 10); // Truncate to 10 characters
};

function App() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [exportPreview, setExportPreview] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const addComment = (content: string) => {
    const comment: Comment = {
      id: Date.now().toString(),
      content,
      children: [],
      userId: "user-" + Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      contentHash: generateContentHash(content),
      attachments: [],
    };
    setComments([...comments, comment]);
  };

  const handleExport = (format: "text" | "json" | "xml") => {
    let data = "";
    switch (format) {
      case "text":
        data = exportCommentsText(comments);
        break;
      case "json":
        data = exportCommentsJSON(comments);
        break;
      case "xml":
        data = exportCommentsXML(comments);
        break;
    }

    if (format === "text") {
      setExportPreview(data);
      setShowPreview(!showPreview);
    } else {
      const blob = new Blob([data], { type: `application/${format}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comments.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Comment Manager
            </h1>
            <div>
              <div>
                <button
                  onClick={() => handleExport("text")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mr-2"
                >
                  <Download size={20} />
                  Text
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mr-2"
                >
                  <Download size={20} />
                  JSON
                </button>
                <button
                  onClick={() => handleExport("xml")}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Download size={20} />
                  XML
                </button>
              </div>
              {showPreview && (
                <textarea
                  className="w-full mt-2"
                  placeholder="Exported data will appear here"
                  value={exportPreview}
                  readOnly
                />
              )}
            </div>
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
