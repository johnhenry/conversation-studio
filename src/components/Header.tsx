import React from 'react';
import { ExportFormat } from '../types';
import { Plus, Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: ExportFormat | "arrange";
  setActiveTab: (tab: ExportFormat | "arrange") => void;
  storeLocally: boolean;
  setStoreLocally: (store: boolean) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewComment: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  storeLocally,
  setStoreLocally,
  onImport,
  onNewComment,
  onOpenSettings,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1A1A1B] border-b border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-100">
              Conversation Studio
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab("arrange")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "arrange"
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Arrange
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "text"
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "json"
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setActiveTab("xml")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "xml"
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              XML
            </button>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onNewComment}
                className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                title="New Comment"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>

            {/* Settings and Import */}
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-700">
              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={storeLocally}
                  onChange={(e) => setStoreLocally(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-700 bg-gray-800 focus:ring-blue-500"
                />
                <span>Store</span>
              </label>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <span>Import</span>
                <input
                  type="file"
                  onChange={onImport}
                  className="hidden"
                  accept=".json,.xml,.txt"
                />
              </label>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
