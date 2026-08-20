import React, { useState } from "react";
import {
  Menu,
  SquarePen,
  Download,
  Trash2,
  Users,
  LogOut,
  ChevronDown,
  User,
  ShieldCheck,
} from "lucide-react";
import { Conversation, GoogleUser } from "../types.js";
import { Logo } from "./Logo.js";
import { exportAsMarkdown, exportAsJson, exportAsText } from "../utils/export.js";

interface HeaderProps {
  onToggleSidebar: () => void;
  currentConversation: Conversation | null;
  webSearchEnabled?: boolean;
  onToggleWebSearch?: () => void;
  isTemporary?: boolean;
  onToggleTemporary?: () => void;
  onNewChat: () => void;
  onClearCurrentChat?: () => void;
  onOpenSettings?: () => void;
  currentUser?: GoogleUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentConversation,
  isTemporary,
  onNewChat,
  onClearCurrentChat,
  currentUser,
  onLogout,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#0E1015] border-b border-[#1E232E] flex items-center justify-between flex-shrink-0 z-30">
      {/* Left section: Sidebar toggle & Title / Logo */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1C2028] transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center">
          <Logo size="sm" showText={false} />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm sm:text-base text-white font-khmer truncate max-w-[140px] sm:max-w-xs">
            {currentConversation?.title || "CHAT GPR"}
          </span>

          {isTemporary && (
            <span className="px-2 py-0.5 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#FBBF24] text-[10px] font-semibold font-khmer">
              សន្ទនាបណ្តោះអាសន្ន
            </span>
          )}
        </div>
      </div>

      {/* Center / Model Badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171A21] border border-[#242933] text-xs">
        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
        <span className="text-[#818CF8] font-semibold font-mono">Gemini 3.7 Flash</span>
        <span className="text-[#64748B] text-[10px]">Multimodal</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Export Dropdown (only when there are messages) */}
        {currentConversation && currentConversation.messages.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1C2028] transition-colors"
              title="Export Conversation"
            >
              <Download className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#171A21] border border-[#242933] shadow-2xl py-1 z-40 text-xs text-[#CBD5E1] font-khmer animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] text-[#64748B] font-semibold border-b border-[#242933]">
                    នាំចេញការសន្ទនា / Export Chat
                  </div>
                  <button
                    onClick={() => {
                      exportAsMarkdown(currentConversation);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#242933] hover:text-white transition-colors"
                  >
                    Markdown (.md)
                  </button>
                  <button
                    onClick={() => {
                      exportAsJson(currentConversation);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#242933] hover:text-white transition-colors"
                  >
                    JSON File (.json)
                  </button>
                  <button
                    onClick={() => {
                      exportAsText(currentConversation);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#242933] hover:text-white transition-colors"
                  >
                    Plain Text (.txt)
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Clear Current Chat (only when there are messages) */}
        {currentConversation && currentConversation.messages.length > 0 && onClearCurrentChat && (
          <button
            onClick={onClearCurrentChat}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#1C2028] transition-colors"
            title="Clear Messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1C2028] transition-colors"
          title="New Chat"
        >
          <SquarePen className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* User Profile & Logout Dropdown */}
        {currentUser && (
          <div className="relative ml-1">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-[#1C2028] transition-all border border-transparent hover:border-[#242933]"
              title={currentUser.name}
            >
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#6366F1]/40 object-cover"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#818CF8] font-bold text-xs flex items-center justify-center">
                  {currentUser.name?.charAt(0) || "U"}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:block" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#171A21] border border-[#242933] shadow-2xl p-2 z-40 text-xs text-[#CBD5E1] font-khmer animate-scaleUp">
                  {/* Account Header */}
                  <div className="p-2.5 rounded-xl bg-[#12151B] border border-[#242933]/60 mb-2">
                    <div className="flex items-center gap-2.5">
                      {currentUser.picture ? (
                        <img
                          src={currentUser.picture}
                          alt={currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full border border-[#242933]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#6366F1]/20 text-[#818CF8] font-bold text-sm flex items-center justify-center">
                          {currentUser.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate text-xs">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-[#64748B] truncate font-sans">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#242933]/60 flex items-center gap-1.5 text-[10px]">
                      {currentUser.isGuest ? (
                        <span className="text-[#A5B4FC] flex items-center gap-1">
                          <User className="w-3 h-3 text-[#818CF8]" />
                          <span>Guest Mode (ចូលប្រើដោយមិនបាច់គណនី)</span>
                        </span>
                      ) : (
                        <span className="text-[#10B981] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Google OAuth 2.0 Authenticated</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-[#EF4444]/15 text-[#EF4444] transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ចាកចេញ (Sign Out)</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

