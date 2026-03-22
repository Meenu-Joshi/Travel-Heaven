const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");


// const model = genAI.getGenerativeModel({ model: "gemini-pro" });

router.post("/chat", async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const { message } = req.body;
        
        // Define the AI's personality and knowledge here
        const systemInstruction = `
            You are the "ExploreVista AI", a helpful travel assistant for the ExploreVista website.
            Your job is to help users find stays, explain booking policies, and give travel tips.
            Be friendly, concise, and professional. 
            If someone asks about 'WanderLust', tell them ExploreVista is the upgraded version!
        `;

        // Combine the instruction with the user's message
        const finalPrompt = `${systemInstruction}\n\nUser: ${message}`;

        const result = await model.generateContent(finalPrompt);
        const text = result.response.text();
        
        res.json({ reply: text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "I'm having a connection glitch!" });
    }
});
module.exports = router;