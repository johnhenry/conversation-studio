import React, { useState } from "react";
import { ExportFormat } from "../types";
import { Plus, Settings, Import, Menu, ChartNoAxesGantt } from "lucide-react";
import { AppConfig } from "../config";

interface HeaderProps {
  activeTab: ExportFormat | "forum";
  setActiveTab: (tab: ExportFormat | "forum") => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewComment: () => void;
  onOpenSettings: () => void;
  chatFocustId: string;
  setChatFocustId: (mode: string | null) => void;
  appConfig: AppConfig;
  onStoreLocallyChange: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onImport,
  onNewComment,
  onOpenSettings,
  chatFocustId,
  setChatFocustId,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const chatFocustIdColor = chatFocustId ? "gray" : "blue";
  const KEY_NAVIGATION_STRING = `
---
Keyboard Navigation:
up: ↑
Down: ↓${
    !chatFocustId
      ? `Next: →
Previous: ←`
      : ""
  }`;
  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1A1B1B] border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="font-semibold text-gray-100">
              <span className="md:hidden">CS</span>
              <span className="hidden md:inline">Conversation Studio</span>
            </h1>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={onNewComment}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-700"
              aria-label="New Post"
              title="New Post"
            >
              <Plus size={20} />
            </button>
            <label className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 cursor-pointer">
              <input
                type="file"
                onChange={onImport}
                className="hidden"
                accept=".json"
              />
              <Import size={20} />
            </label>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-700"
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-700"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <button
              title={`${
                chatFocustId === "" ? "Forum Mode" : "Chat Mode"
              }${KEY_NAVIGATION_STRING}`}
              onClick={() => {
                setActiveTab("forum");
                if (!["text", "xml", "json"].includes(activeTab)) {
                  setChatFocustId(chatFocustId === "" ? null : "");
                }
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "forum"
                  ? `bg-${chatFocustIdColor}-700 text-white`
                  : `text-${chatFocustIdColor}-300 hover:bg-${chatFocustIdColor}-700`
              }`}
              aria-label={chatFocustId === "" ? "Forum Mode" : "Chat Mode"}
            >
              {chatFocustId === "" ? (
                <ChartNoAxesGantt size={16} />
              ) : (
                <Menu size={16} />
              )}
            </button>
            <button
              title={`View Text`}
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
              title={`View JSON`}
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
              title={`View XML`}
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
                title={`New Comment\nkey: n`}
              >
                <Plus size={20} />
              </button>
              <label
                className="inline-flex items-center p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
                title="Import File"
              >
                <Import size={20} />
                <input
                  type="file"
                  onChange={onImport}
                  className="hidden"
                  accept=".json,.xml,.txt"
                  aria-label="Import file"
                />
              </label>
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`${
            isMobileMenuOpen ? "block" : "hidden"
          } md:hidden py-2 space-y-2`}
        >
          <button
            title={`${
              chatFocustId === "" ? "Forum Mode" : "Chat Mode"
            }${KEY_NAVIGATION_STRING}`}
            onClick={() => {
              setActiveTab("forum");
              if (!["text", "xml", "json"].includes(activeTab)) {
                setChatFocustId(chatFocustId === "" ? null : "");
              }
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeTab === "forum"
                ? `bg-${chatFocustIdColor}-700 text-white`
                : `text-${chatFocustIdColor}-300 hover:bg-${chatFocustIdColor}-700`
            }`}
            aria-label={chatFocustId === "" ? "Forum Mode" : "Chat Mode"}
          >
            <div className="flex items-center">
              {chatFocustId === "" ? (
                <ChartNoAxesGantt size={16} className="mr-2" />
              ) : (
                <Menu size={16} className="mr-2" />
              )}
              {chatFocustId === "" ? "Forum Mode" : "Chat Mode"}
            </div>
          </button>
          <button
            title={`View Text`}
            onClick={() => {
              setActiveTab("text");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeTab === "text"
                ? "bg-gray-700 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            Text
          </button>
          <button
            title={`View JSON`}
            onClick={() => {
              setActiveTab("json");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeTab === "json"
                ? "bg-gray-700 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            JSON
          </button>
          <button
            title={`View XML`}
            onClick={() => {
              setActiveTab("xml");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeTab === "xml"
                ? "bg-gray-700 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            XML
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
