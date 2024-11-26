import React, { useState, useEffect, useRef } from "react";
import { Download, Copy } from "lucide-react";
import { Comment, ExportFormat } from "../types";
import {
  exportComments,
  exportCommentsJSON,
  exportCommentsText,
  exportCommentsXML,
} from "../utils/export";

interface ExportPreviewProps {
  comments: Comment[];
  format: ExportFormat;
}

const ExportPreview: React.FC<ExportPreviewProps> = ({ comments, format }) => {
  const [data, setData] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const exportedData = await exportComments(comments, format);
      setData(exportedData);
    };

    fetchData();
  }, [comments, format]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [data]);

  const handleDownload = async () => {
    let exportedData = "";
    switch (format) {
      case "text":
        exportedData = await exportCommentsText(comments, false);
        break;
      case "json":
        exportedData = await exportCommentsJSON(comments, false);
        break;
      case "xml":
        exportedData = await exportCommentsXML(comments, false);
        break;
    }

    const blob = new Blob([exportedData], { type: `application/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comments.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    let exportedData = "";
    switch (format) {
      case "text":
        exportedData = await exportCommentsText(comments, false);
        break;
      case "json":
        exportedData = await exportCommentsJSON(comments, false);
        break;
      case "xml":
        exportedData = await exportCommentsXML(comments, false);
        break;
    }
    navigator.clipboard.writeText(exportedData);
  };

  return (
    <div className="flex flex-col h-full">
      <textarea
        ref={textareaRef}
        className="w-full flex-grow border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        placeholder="Exported data will appear here"
        value={data}
        readOnly
      />
      <div className="flex justify-end mt-2 gap-2">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Copy size={20} /> Copy {format}
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} /> Download {format}
        </button>
      </div>
    </div>
  );
};

export default ExportPreview;
