import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Comment } from "../types";

interface ExportPreviewProps {
  comments: Comment[];
  format: "text" | "json" | "xml";
  exportFn: (comments: Comment[]) => Promise<string>;
}

const ExportPreview: React.FC<ExportPreviewProps> = ({
  comments,
  format,
  exportFn,
}) => {
  const [data, setData] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const exportedData = await exportFn(comments);
      setData(exportedData);
    };

    fetchData();
  }, [comments, format, exportFn]);

  const handleDownload = async () => {
    const exportedData = await exportFn(comments);
    const blob = new Blob([exportedData], { type: `application/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comments.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <textarea
        className="w-full flex-grow border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Exported data will appear here"
        value={data}
        readOnly
      />
      <button
        onClick={handleDownload}
        className="px-4 py-2 mt-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 self-end disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={20} /> Download {format}
      </button>
    </div>
  );
};

export default ExportPreview;
