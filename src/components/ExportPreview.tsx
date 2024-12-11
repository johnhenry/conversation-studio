import React, { useState, useEffect, useRef, useCallback } from "react";
import { Download, Copy } from "lucide-react";
import { ExportPreviewProps } from "../types";
import { exportComments } from "../utils/export";

const ExportPreview: React.FC<ExportPreviewProps> = ({ comments, format, exportSettings }) => {
  const [state, setState] = useState({
    data: "",
    isLoading: false,
    error: null as string | null,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const exportRef = useRef({ comments, format, exportSettings });

  // Update ref when props change
  useEffect(() => {
    exportRef.current = { comments, format, exportSettings };
  }, [comments, format, exportSettings]);

  // Handle export
  useEffect(() => {
    let mounted = true;

    const generateExport = () => {
      if (!mounted) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null, data: "" }));

      try {
        // Validate input
        if (!Array.isArray(comments)) {
          throw new Error("Invalid comments data");
        }

        // Log export attempt
        console.log("Attempting export:", {
          format,
          commentsCount: comments.length,
          exportSettings,
        });

        // Generate export
        const result = exportComments(comments, format, exportSettings);

        if (mounted) {
          setState((prev) => ({
            ...prev,
            data: result,
            isLoading: false,
            error: null,
          }));
        }
      } catch (err) {
        console.error("Export error:", err);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            error:
              err instanceof Error ? err.message : "Failed to generate preview",
            isLoading: false,
            data: "",
          }));
        }
      }
    };

    // Small delay to allow UI to update
    const timeoutId = setTimeout(generateExport, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [comments, format, exportSettings]);

  const handleDownload = useCallback(() => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = exportComments(
        exportRef.current.comments,
        exportRef.current.format,
        exportRef.current.exportSettings
      );

      const blob = new Blob([result], { type: `application/${format}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comments.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      console.error("Download error:", err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to download file",
        isLoading: false,
      }));
    }
  }, [format]);

  const handleCopy = useCallback(() => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = exportComments(
        exportRef.current.comments,
        exportRef.current.format,
        exportRef.current.exportSettings
      );
      navigator.clipboard.writeText(result);

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      console.error("Copy error:", err);
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error ? err.message : "Failed to copy to clipboard",
        isLoading: false,
      }));
    }
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
      {state.isLoading && (
        <div className="flex items-center gap-2 text-blue-500 mb-1">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          Processing...
        </div>
      )}
      {state.error ? (
        <div className="text-red-500 p-2 rounded-lg bg-red-100/10 flex flex-col gap-1 mb-1">
          <div className="font-medium">Error generating preview:</div>
          <div>{state.error}</div>
          <div className="text-sm opacity-75">
            Try switching back to the Forum tab and then back to this tab.
          </div>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="w-full flex-1 min-h-0 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-[#1A1A1B] text-gray-300"
          placeholder={
            state.isLoading ? "Processing..." : "Exported data will appear here"
          }
          value={state.data}
          readOnly
        />
      )}
      <div className="flex justify-end mt-1 gap-2">
        <button
          onClick={handleCopy}
          disabled={state.isLoading || !state.data}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Copy size={20} /> Copy
        </button>
        <button
          onClick={handleDownload}
          disabled={state.isLoading || !state.data}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} /> Download
        </button>
      </div>
    </div>
  );
};

export default ExportPreview;
