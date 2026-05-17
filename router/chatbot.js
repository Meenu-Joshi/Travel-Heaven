const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: `
        You are "ExploreVista AI", the official virtual assistant inside the WanderLust / ExploreVista travel platform.
        
        CRITICAL RULES FOR RESPONDING:
        1. KEEP IT SHORT: Your answers must be extremely concise—maximum 2 to 3 sentences. Never provide long numbered lists unless explicitly asked.
        2. Website Identity: Users click listing cards on the homepage to view details. They book directly on that detail page. They can view integrated Mapbox maps and leave reviews on that page too.
        3. Hosting: To add a property, users click 'Create New Listing' in the navbar (must be logged in).
        4. Tone: Friendly, direct, and crisp. No fluff.
        5. Scope: If asked about non-travel topics, say: "I can only assist you with listings, bookings, or hosting on ExploreVista!"
    `
});

// In-memory store structured to hold multiple chats per session:
// { sessionId: { chat1_timestamp: chatInstance, chat2_timestamp: chatInstance } }
const userChatHistories = {};

router.post("/chat", async (req, res) => {
    try {
        const { message, chatId } = req.body;
        const sessionId = req.sessionID || "default-global-user";

        if (!message || !chatId) {
            return res.status(400).json({ reply: "Missing message or chatId!" });
        }

        // Initialize session container if empty
        if (!userChatHistories[sessionId]) {
            userChatHistories[sessionId] = {};
        }

        // Create a unique new chat stream instance if this specific chatId doesn't exist yet
        if (!userChatHistories[sessionId][chatId]) {
            userChatHistories[sessionId][chatId] = model.startChat({
                history: [],
                generationConfig: { temperature: 0.4 } // Lower temperature for sharper focus
            });
        }

        const currentChatSession = userChatHistories[sessionId][chatId];
        const result = await currentChatSession.sendMessage(message);
        const text = result.response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("ExploreVista AI Error:", error.message);
        res.status(500).json({ reply: "I had a brief sync glitch. Try again!" });
    }
});

// Route to completely delete a specific conversation from memory
router.post("/delete-chat", (req, res) => {
    const { chatId } = req.body;
    const sessionId = req.sessionID || "default-global-user";
    
    if (userChatHistories[sessionId] && userChatHistories[sessionId][chatId]) {
        delete userChatHistories[sessionId][chatId];
    }
    res.json({ success: true });
});

module.exports = router;