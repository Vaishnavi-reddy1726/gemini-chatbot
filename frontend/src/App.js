import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import "./App.css";

const API = "https://gemini-chatbot-1u3p.onrender.com";

export default function App() {
  const [chats, setChats] = useState([]); // [{ chatId, preview, messageCount }]
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]); // [{ id, role, text, timestamp }]
  const [uploadedDoc, setUploadedDoc] = useState(null);   // { name, charCount }
  const [uploadedImage, setUploadedImage] = useState(null); // { name, previewUrl }
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const bottomRef = useRef(null);

  // Start a new chat on mount
  useEffect(() => {
    handleNewChat();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleNewChat = async () => {
    try {
      const res = await axios.post(`${API}/api/new-chat`);
      const { chatId } = res.data;
      const newChat = { chatId, preview: "New chat", messageCount: 0 };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(chatId);
      setMessages([]);
      setUploadedDoc(null);
      setUploadedImage(null);
    } catch (err) {
      console.error("New chat error:", err);
    }
  };

  const handleSelectChat = (chatId) => {
    // For simplicity, switching between existing sessions resets local state
    // (backend still holds the session)
    setActiveChatId(chatId);
    setMessages([]);
    setUploadedDoc(null);
    setUploadedImage(null);
  };

  const handleSend = async (text) => {
    if (!text.trim() || !activeChatId || isLoading) return;

    const userMsg = { id: uuidv4(), role: "user", text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Update chat preview
    setChats(prev => prev.map(c =>
      c.chatId === activeChatId
        ? { ...c, preview: text.slice(0, 50), messageCount: c.messageCount + 1 }
        : c
    ));

    try {
      const res = await axios.post(`${API}/api/chat", { chatId: activeChatId, message: text });
      const botMsg = { id: uuidv4(), role: "model", text: res.data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errMsg = {
        id: uuidv4(),
        role: "model",
        text: `Error: ${err.response?.data?.error || err.message}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocUpload = async (file) => {
    if (!activeChatId) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("chatId", activeChatId);
    try {
      const res = await axios.post(`${API}/api/upload/document", fd);
      setUploadedDoc({ name: res.data.fileName, charCount: res.data.charCount });
      const sysMsg = {
        id: uuidv4(),
        role: "system",
        text: `📄 Document uploaded: **${res.data.fileName}** (${res.data.charCount.toLocaleString()} characters extracted)`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, sysMsg]);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!activeChatId) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("chatId", activeChatId);
    try {
      const res = await axios.post(`${API}/api/upload/image", fd);
      setUploadedImage({ name: res.data.fileName, previewUrl: res.data.previewUrl });
      const sysMsg = {
        id: uuidv4(),
        role: "system",
        text: `🖼️ Image uploaded: **${res.data.fileName}**`,
        timestamp: new Date(),
        imagePreview: res.data.previewUrl,
      };
      setMessages(prev => [...prev, sysMsg]);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
      />
      <div className="main-area">
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          isUploading={isUploading}
          uploadedDoc={uploadedDoc}
          uploadedImage={uploadedImage}
          bottomRef={bottomRef}
        />
        <InputBar
          onSend={handleSend}
          onDocUpload={handleDocUpload}
          onImageUpload={handleImageUpload}
          isLoading={isLoading}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
}
