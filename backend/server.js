require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// In-memory chat store: { chatId: { messages: [], documentText: null, imageBase64: null, imageMimeType: null } }
const chatSessions = {};

// Multer config - store in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Helper: get or create session ──────────────────────────────────────────
function getSession(chatId) {
  if (!chatSessions[chatId]) {
    chatSessions[chatId] = {
      messages: [],
      documentText: null,
      imageBase64: null,
      imageMimeType: null,
    };
  }
  return chatSessions[chatId];
}

// ── POST /api/chat ──────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ error: "chatId and message are required" });
    }

    const session = getSession(chatId);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Build parts for this turn
    const userParts = [];

    // If there's a document, prepend its text as context on first use
    if (session.documentText) {
      userParts.push({
        text: `[Uploaded Document Content]\n${session.documentText}\n\n[User Message]\n${message}`,
      });
    } else {
      userParts.push({ text: message });
    }

    // If there's an image, attach it
    if (session.imageBase64) {
      userParts.push({
        inlineData: {
          mimeType: session.imageMimeType,
          data: session.imageBase64,
        },
      });
    }

    // Build history (exclude system injections, keep it clean)
    const history = session.messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userParts);
    const botText = result.response.text();

    // Save to session
    session.messages.push({ role: "user", text: message });
    session.messages.push({ role: "model", text: botText });

    res.json({ reply: botText, chatId });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
});

// ── POST /api/upload/document ───────────────────────────────────────────────
app.post("/api/upload/document", upload.single("file"), async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId || !req.file) {
      return res.status(400).json({ error: "chatId and file are required" });
    }

    const session = getSession(chatId);
    const mime = req.file.mimetype;
    let extractedText = "";

    if (mime === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      extractedText = data.text;
    } else if (mime === "text/plain") {
      extractedText = req.file.buffer.toString("utf-8");
    } else {
      return res.status(400).json({ error: "Only PDF and TXT files are supported" });
    }

    session.documentText = extractedText;
    res.json({ success: true, fileName: req.file.originalname, charCount: extractedText.length });
  } catch (err) {
    console.error("Document upload error:", err);
    res.status(500).json({ error: err.message || "Failed to process document" });
  }
});

// ── POST /api/upload/image ──────────────────────────────────────────────────
app.post("/api/upload/image", upload.single("file"), async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId || !req.file) {
      return res.status(400).json({ error: "chatId and file are required" });
    }

    const mime = req.file.mimetype;
    if (!["image/png", "image/jpeg"].includes(mime)) {
      return res.status(400).json({ error: "Only PNG and JPG images are supported" });
    }

    const session = getSession(chatId);
    session.imageBase64 = req.file.buffer.toString("base64");
    session.imageMimeType = mime;

    // Return a data URL for preview
    const dataUrl = `data:${mime};base64,${session.imageBase64}`;
    res.json({ success: true, fileName: req.file.originalname, previewUrl: dataUrl });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: err.message || "Failed to process image" });
  }
});

// ── POST /api/new-chat ──────────────────────────────────────────────────────
app.post("/api/new-chat", (req, res) => {
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  chatSessions[chatId] = {
    messages: [],
    documentText: null,
    imageBase64: null,
    imageMimeType: null,
  };
  res.json({ chatId });
});

// ── GET /api/chats ──────────────────────────────────────────────────────────
app.get("/api/chats", (req, res) => {
  const summary = Object.entries(chatSessions).map(([id, s]) => ({
    chatId: id,
    messageCount: s.messages.length,
    hasDocument: !!s.documentText,
    hasImage: !!s.imageBase64,
    preview:
      s.messages.length > 0
        ? s.messages[0].text.slice(0, 50)
        : "Empty chat",
  }));
  res.json(summary);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});