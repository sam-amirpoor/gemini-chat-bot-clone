let $ = document
const typingForm = $.querySelector(".typing-form")
const chatList = $.querySelector(".chat-list")
const suggestions = $.querySelectorAll(".suggestion-list .suggestion")
const toggleThemeButton = $.querySelector("#toggle-theme-button")
const deleteChatButton = $.querySelector("#delete-chat-button")

let userMessage = null
let isResponseGenerating = false

// API configuration
const API_KEY = `AIzaSyCvbZ6TZltKPNWu3W50y6WEnF_9UOQikAk`;
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = localStorage.getItem("theme") === "light_mode";

    // Apply the stored theme
    $.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "light_mode" : "dark_mode";

    // Restore saved chats
    chatList.innerHTML = savedChats || "";
    $.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to bottom
}

loadLocalStorageData()

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = $.createElement("div")
    div.classList.add("message", ...classes)
    div.innerHTML = content
    return div
}

// Show typing effect by displaying words one by one
const showTypingEffect = (text, textElem, incomingMessageDiv) => {
    const words = text.split(' ')
    let currentWordIndex = 0

    const typingInterval = setInterval(() => {
        // Append each word to the text element with a space
        textElem.innerText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++]
        incomingMessageDiv.querySelector(".icon").classList.add("hide")
        
        // If all words are displayed
        if (currentWordIndex === words.length) {
            clearInterval(typingInterval)
            isResponseGenerating = false
            incomingMessageDiv.querySelector(".icon").classList.remove("hide")
            localStorage.setItem("savedChats", chatList.innerHTML) // Save chats to local storage
        }
        chatList.scrollTo(0, chatList.scrollHeight) // Scroll to bottom
    }, 75);
}

// Fetch response from the API based on message
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");

    // Send a post request to the API with the user's message
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: userMessage }],
                    },
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error.message)

        // Get the API response text
        const APIResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        showTypingEffect(APIResponse, textElement, incomingMessageDiv);
    } catch (err) {
        textElement.innerText = err.message
        isResponseGenerating = false
        textElement.classList.add("error")
    } finally {
        incomingMessageDiv.classList.remove("loading")
    }
};

// Show a loading animation while waiting for API response
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                        <img src="images/gemini.svg" alt="gemini image" class="avatar">
                        <p class="text"></p>
                        <div class="loading-indicator">
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                        </div>
                    </div>
                    <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(
        html,
        "incoming",
        "loading"
    );
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to bottom
    generateAPIResponse(incomingMessageDiv);
}

// Copy message text to the clipboard
const copyMessage = copyIcon => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerHTML

    navigator.clipboard.writeText(messageText)
    copyIcon.innerText = "done" // Show tick icon
    setTimeout(() => copyIcon.innerText = "content_copy", 1000) // Revert icon after 1 second
}

const handleOutGoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; // Exit if here is no message

    isResponseGenerating = true;

    const html = `<div class="message-content">
                    <img src="images/user.jpg" alt="user image" class="avatar">
                    <p class="text"></p>
                </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerHTML = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // Clear input field
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to bottom
    $.body.classList.add("hide-header") // Hide the header once chat start
    setTimeout(showLoadingAnimation, 500); // Show loading animation after a delay
}

deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all messages?")) {
        localStorage.removeItem("savedChats")
        loadLocalStorageData()
    }
})

// Set user message and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText
        handleOutGoingChat()
    })
})

// Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = $.body.classList.toggle("light_mode")
    localStorage.setItem("theme", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode"
})

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", event => {
    event.preventDefault()

    handleOutGoingChat()
})