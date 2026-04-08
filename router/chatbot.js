const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Use 'gemini-pro' instead of 'gemini-1.5-flash' to stop the 404 error
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(message);
        const text = result.response.text();
        
        res.json({ reply: text });
    } catch (error) {
        // This will now show if it's a key issue or a location issue
        console.error("FINAL ERROR CHECK:", error.message);
        res.status(500).json({ reply: "I'm having a connection glitch!" });
    }
});

module.exports = router;