import React from 'react';
import { ExportFormat } from '../types';
import { Plus, Settings, Import } from 'lucide-react';
import { AppConfig } from '../config';

interface HeaderProps {
  activeTab: ExportFormat | "forum";
  setActiveTab: (tab: ExportFormat | "forum") => void;
  appConfig: AppConfig;
  onStoreLocallyChange: (store: boolean) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewComment: () => void;
  onOpenSettings: () => void;
  chatFocustId: string;
  setChatFocustId: (mode: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  appConfig,
  onStoreLocallyChange,
  onImport,
  onNewComment,
  onOpenSettings,
  chatFocustId,
  setChatFocustId
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
              onClick={() =>{ setActiveTab("forum"); setChatFocustId("")}}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "forum"
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              {!chatFocustId ?  "Forum" :  "Chat"}
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



            {/* Settings and Import */}
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-700">
               {/* Action Buttons */}
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
              <label className="inline-flex items-center p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer">
                <Import size={20} />
                <input
                  type="file"
                  onChange={onImport}
                  className="hidden"
                  accept=".json,.xml,.txt"
                />
              </label>
              <label className="flex items-center space-x-2 p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer">
                <span>Save</span>
                <input
                  type="checkbox"
                  checked={appConfig.storeLocally}
                  onChange={(e) => onStoreLocallyChange(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-700 bg-gray-800 focus:ring-blue-500"
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
