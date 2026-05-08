import React from "react";
import "./ChatWindow.css";

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderText(text) {
  // Simple markdown-like: bold **text**, code `text`, line breaks
  return text
    .split("\n")
    .map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={j} className="inline-code">{part.slice(1, -1)}</code>;
        }
        return part;
      });
      return <span key={i}>{parts}{i < text.split("\n").length - 1 && <br />}</span>;
    });
}

function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  );
}

export default function ChatWindow({ messages, isLoading, isUploading, uploadedDoc, uploadedImage, bottomRef }) {
  const hasContent = messages.length > 0;

  return (
    <div className="chat-window">
      {/* Header bar */}
      <div className="chat-header">
        <div className="chat-header-title">
          <span className="header-gem">✦</span>
          <span>Gemini Chatbot</span>
        </div>
        <div className="chat-header-badges">
          {uploadedDoc && (
            <span className="badge badge-doc">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              {uploadedDoc.name}
            </span>
          )}
          {uploadedImage && (
            <span className="badge badge-img">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              {uploadedImage.name}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {!hasContent && (
          <div className="welcome">
            <div className="welcome-icon">✦</div>
            <h2>Hello! I'm Gemini</h2>
            <p>Ask me anything, upload a document for Q&A, or share an image to analyze.</p>
            <div className="welcome-hints">
              <span>💬 Chat naturally</span>
              <span>📄 Upload PDFs & TXT</span>
              <span>🖼️ Analyze images</span>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === "system") {
            return (
              <div key={msg.id} className="system-msg">
                {msg.imagePreview && (
                  <img src={msg.imagePreview} alt="Uploaded" className="image-preview" />
                )}
                <span>{renderText(msg.text)}</span>
              </div>
            );
          }

          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`message-row ${isUser ? "user" : "bot"}`}>
              {!isUser && (
                <div className="avatar bot-avatar">✦</div>
              )}
              <div className={`bubble ${isUser ? "user-bubble" : "bot-bubble"} ${msg.isError ? "error-bubble" : ""}`}>
                <div className="bubble-text">{renderText(msg.text)}</div>
                <div className="bubble-time">{formatTime(msg.timestamp)}</div>
              </div>
              {isUser && (
                <div className="avatar user-avatar">You</div>
              )}
            </div>
          );
        })}

        {(isLoading || isUploading) && (
          <div className="message-row bot">
            <div className="avatar bot-avatar">✦</div>
            <div className="bubble bot-bubble loading-bubble">
              {isUploading ? (
                <span className="uploading-text">Uploading file...</span>
              ) : (
                <TypingDots />
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
