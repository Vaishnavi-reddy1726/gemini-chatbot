import React from "react";
import "./Sidebar.css";

export default function Sidebar({ chats, activeChatId, onNewChat, onSelectChat }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-gem">✦</span>
          <span className="logo-text">Gemini Chat</span>
        </div>
        <button className="new-chat-btn" onClick={onNewChat} title="New Chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Chat
        </button>
      </div>

      <div className="sidebar-section-label">Recent Chats</div>

      <div className="chat-list">
        {chats.length === 0 && (
          <div className="empty-chats">No chats yet</div>
        )}
        {chats.map((chat, i) => (
          <button
            key={chat.chatId}
            className={`chat-item ${chat.chatId === activeChatId ? "active" : ""}`}
            onClick={() => onSelectChat(chat.chatId)}
          >
            <div className="chat-item-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="chat-item-body">
              <span className="chat-item-preview">{chat.preview}</span>
              <span className="chat-item-count">{chat.messageCount} msg{chat.messageCount !== 1 ? "s" : ""}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="powered-by">Powered by Gemini 1.5 Flash</div>
      </div>
    </aside>
  );
}
