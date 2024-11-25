import React from "react";
import { Download } from "lucide-react";

interface ExportPreviewProps {
  data: string;
  onDownload: () => void;
}

const ExportPreview: React.FC<ExportPreviewProps> = ({ data, onDownload }) => {
  return (
    <div>
      <button
        onClick={onDownload}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        <Download size={20} /> Download
      </button>
      <textarea
        className="w-full mt-2"
        placeholder="Exported data will appear here"
        value={data}
        readOnly
      />
    </div>
  );
};

export default ExportPreview;
