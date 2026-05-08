import React, { useState, useRef } from "react";
import "./InputBar.css";

export default function InputBar({ onSend, onDocUpload, onImageUpload, isLoading, isUploading }) {
  const [text, setText] = useState("");
  const docRef = useRef();
  const imgRef = useRef();

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText("");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (file) { onDocUpload(file); e.target.value = ""; }
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) { onImageUpload(file); e.target.value = ""; }
  };

  const busy = isLoading || isUploading;

  return (
    <div className="input-bar-wrap">
      <div className="input-bar">
        {/* Upload buttons */}
        <div className="upload-group">
          <button
            className="upload-btn"
            onClick={() => docRef.current.click()}
            disabled={busy}
            title="Upload PDF or TXT document"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>Doc</span>
          </button>
          <button
            className="upload-btn"
            onClick={() => imgRef.current.click()}
            disabled={busy}
            title="Upload PNG or JPG image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Image</span>
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={docRef}
          type="file"
          accept=".pdf,.txt"
          style={{ display: "none" }}
          onChange={handleDocChange}
        />
        <input
          ref={imgRef}
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: "none" }}
          onChange={handleImgChange}
        />

        {/* Text input */}
        <textarea
          className="msg-input"
          placeholder="Type a message... (Shift+Enter for new line)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={busy}
        />

        {/* Send button */}
        <button
          className={`send-btn ${text.trim() && !busy ? "active" : ""}`}
          onClick={handleSend}
          disabled={!text.trim() || busy}
          title="Send message"
        >
          {isLoading ? (
            <div className="spinner" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
      <div className="input-hint">Press Enter to send · Shift+Enter for new line</div>
    </div>
  );
}
