import React, { useState } from "react";
import { Comment } from "../types";
import {
  exportCommentsText,
  exportCommentsJSON,
  exportCommentsXML,
} from "../utils/export";

interface ExportPreviewProps {
  comments: Comment[];
}

const ExportPreview: React.FC<ExportPreviewProps> = ({ comments }) => {
  const [format, setFormat] = useState<"text" | "json" | "xml">("text");
  const [exportedData, setExportedData] = useState("");

  const handleExport = () => {
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

    setExportedData(data);
  };

  return (
    <div>
      <div>
        <button onClick={() => setFormat("text")}>Text</button>
        <button onClick={() => setFormat("json")}>JSON</button>
        <button onClick={() => setFormat("xml")}>XML</button>
        <button onClick={handleExport}>Export</button>
      </div>
      <textarea
        placeholder="Exported data will appear here"
        value={exportedData}
        readOnly
      />
    </div>
  );
};

export default ExportPreview;
