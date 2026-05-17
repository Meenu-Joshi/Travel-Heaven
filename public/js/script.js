document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatBox = document.getElementById("chat-box");
    const sendBtn = document.getElementById("send-btn");
    const userInput = document.getElementById("user-input");
    const chatMessages = document.getElementById("chat-messages");
    const newChatBtn = document.getElementById("new-chat-btn");
    const historyList = document.getElementById("history-list");

    // Client-side local memory state tracking variables
    let clientSessions = JSON.parse(localStorage.getItem("explorevista_chats")) || {};
    let activeChatId = localStorage.getItem("explorevista_active_id") || null;

    // Toggle main chatbot window framework display 
    if (chatToggle && chatBox) {
        chatToggle.addEventListener("click", () => {
            chatBox.classList.toggle("d-none");
            renderHistoryList();
        });
    }

    // Initialize or create a brand new conversation state branch
    function startNewChat() {
        const timestampId = "chat_" + Date.now();
        clientSessions[timestampId] = {
            title: "Chat " + (Object.keys(clientSessions).length + 1),
            messages: [{ sender: "bot", text: "Hi! How can I assist you with ExploreVista today?" }]
        };
        activeChatId = timestampId;
        saveToLocalStorage();
        renderHistoryList();
        switchActiveChat(activeChatId);
    }

    // Switch active conversation viewport window
    function switchActiveChat(id) {
        activeChatId = id;
        localStorage.setItem("explorevista_active_id", id);
        chatMessages.innerHTML = ""; // Wipe message board clean for chosen log
        
        if (clientSessions[id]) {
            clientSessions[id].messages.forEach(msg => {
                appendBubbleToWindow(msg.sender, msg.text);
            });
        }
        renderHistoryList();
    }

    // Render the left hand sidebar listing layout items
    function renderHistoryList() {
        if (!historyList) return;
        historyList.innerHTML = "";

        Object.keys(clientSessions).sort().reverse().forEach(id => {
            const btn = document.createElement("button");
            btn.className = `list-group-item list-group-item-action p-1 text-truncate border-0 rounded mb-1 text-start ${id === activeChatId ? 'bg-danger text-white active' : ''}`;
            btn.style.fontSize = "0.75rem";
            btn.innerHTML = `<i class="fa-regular fa-comment me-1"></i> ${clientSessions[id].title}`;
            
            btn.addEventListener("click", () => switchActiveChat(id));
            historyList.appendChild(btn);
        });
    }

    // Print operational UI elements directly into message block view container
    function appendBubbleToWindow(sender, text) {
        const wrapper = document.createElement("div");
        wrapper.className = `d-flex mb-2 ${sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`;
        
        const bubble = document.createElement("div");
        bubble.className = `p-2 rounded shadow-sm ${sender === 'user' ? 'bg-light text-dark' : 'bg-danger text-white'}`;
        bubble.style.maxWidth = "85%";
        bubble.style.fontSize = "0.85rem";
        bubble.innerHTML = text;

        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Instantly push scroll focus downward
    }

    // Post messaging updates down to Express route channel handler
    async function handleMessageDispatch() {
        const query = userInput.value.trim();
        if (!query || !activeChatId) return;

        // 1. Commit and draw user bubble string
        appendBubbleToWindow("user", query);
        clientSessions[activeChatId].messages.push({ sender: "user", text: query });
        
        // Auto-update conversation title to match the first user question
        if (clientSessions[activeChatId].title.startsWith("Chat ")) {
            clientSessions[activeChatId].title = query;
        }
        
        userInput.value = "";
        saveToLocalStorage();
        renderHistoryList();

        try {
            const response = await fetch("/chatbot/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: query, chatId: activeChatId })
            });

            const data = await response.json();
            
            // 2. Commit and draw returned bot system output
            appendBubbleToWindow("bot", data.reply);
            clientSessions[activeChatId].messages.push({ sender: "bot", text: data.reply });
            saveToLocalStorage();

        } catch (err) {
            console.error(err);
            appendBubbleToWindow("bot", "Network signal failure. Try again.");
        }
    }

    function saveToLocalStorage() {
        localStorage.setItem("explorevista_chats", JSON.stringify(clientSessions));
    }

    // Event binding initializations
    if (newChatBtn) newChatBtn.addEventListener("click", startNewChat);
    if (sendBtn) sendBtn.addEventListener("click", handleMessageDispatch);
    if (userInput) {
        userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleMessageDispatch();
        });
    }

    // Application Launch Sequence bootstrap checklist check
    if (Object.keys(clientSessions).length === 0) {
        startNewChat();
    } else {
        if (!activeChatId || !clientSessions[activeChatId]) {
            activeChatId = Object.keys(clientSessions)[0];
        }
        switchActiveChat(activeChatId);
    }
});