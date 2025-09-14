const express = require('express');
const dotenv = require('dotenv');
// const axios = require('axios'); // Remove axios
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import GoogleGenerativeAI

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration with support for production and development environments
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://zingy-baklava-d1f0ae.netlify.app',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware before defining routes
app.use(cors(corsOptions));

// Add a specific CORS pre-flight handler for OPTIONS requests
app.options('*', cors(corsOptions));

// Debug middleware for CORS issues
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.path}`);
  console.log(`Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json());

// --- START Gemini API Specific Changes ---
// Change the environment variable name from OPENAI_API_KEY to GEMINI_API_KEY
const geminiApiKey = process.env.GEMINI_API_KEY;

// Initialize GoogleGenerativeAI
// The client will automatically pick up GEMINI_API_KEY from environment variables.
const genAI = new GoogleGenerativeAI(geminiApiKey); // Pass API key directly
// --- END Gemini API Specific Changes ---

const question = 'entendiste?'



const functionInputTest =(question)=>{
    console.log(question);
}
// Simulated user data

const userData = {
    id: 1,
    name: '',
    languageLevel: '',
    // Add more fields as needed
};

// Define the system message
// Updated system message with placeholders
function getSystemMessage(userData, functionInputTest) {
    return `
    You are a chatbot that assists with Spanish language learning. Be friendly, helpful, 
    and provide clear and concise answers. Always analyze the context of the chat before answering. 
    Your name is Juancito. You were born in 1986 in Tijuana, Mexico. You have to always promote 
    the use of Spanish in the conversation but also use users' language to help them learn.
    Current user: ${userData.name}, include Language Level: ${userData.languageLevel}.
    Additional Function Input: repeate the following test in triple quote for each message """${functionInputTest}."""
    `;
}


function isSpanishInput(userMessage) {
    const spanishKeywords = ['hola', 'gracias', 'por favor', 'buenos días'];
    return spanishKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
}

// Updated getChatResponse function to use Gemini API
async function getChatResponse(messages, userData, functionInputTest, model = "gemini-2.5-flash", temperature = 0) { // Changed default model
    const systemMessageContent = getSystemMessage(userData, functionInputTest);

    let formattedMessages = [];

    // Gemini API's `generateContent` method expects an array of messages with 'user' and 'model' roles.
    // There isn't a direct 'system' role. A common pattern is to include system instructions
    // as the first 'user' turn to establish the persona and guidelines.
    formattedMessages.push({
        role: "user",
        parts: [{ text: systemMessageContent }]
    });

    // Translate existing chat messages from OpenAI format to Gemini format
    for (const msg of messages) {
        formattedMessages.push({
            role: msg.role === "assistant" ? "model" : "user", // Map 'assistant' to 'model' for Gemini
            parts: [{ text: msg.content }]
        });
    }

    try {
        // Get the generative model instance with specified model and generation configuration
        const generativeModel = genAI.getGenerativeModel({
            model: model,
            generationConfig: {
                temperature: temperature
            }
        });

        // Send the formatted chat history to the Gemini API
        const result = await generativeModel.generateContent({
            contents: formattedMessages
        });

        // Extract the text content from the Gemini response
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error getting chat response from Gemini API:', error);
        throw error;
    }
}


function addGreetingIfNeeded(context) {
    // Check if a greeting has already been added
    const hasGreeting = context.some(msg => msg.role === "assistant" && msg.content.includes("Hola, ¿cómo puedo ayudarte a aprender español hoy?"));
    
    if (!hasGreeting && context.length === 1 && context[0].role === "user") {
        const greeting = { "role": "assistant", "content": "Hola, ¿cómo puedo ayudarte a aprender español hoy?" };
        context.unshift(greeting); // Add the greeting to the beginning of the context
    }
}


// Define the base path for all routes
const BASE_PATH = '/projects/juancito';

app.post(BASE_PATH, async (req, res) => {
    try {
        const userMessage = req.body.message;
        const context = req.body.context || [];

        if (!userMessage) {
            return res.status(400).json({ response: 'No message provided' });
        }

        const temperature = isSpanishInput(userMessage) ? 0.5 : 0;

        context.push({ "role": "user", "content": userMessage });
        addGreetingIfNeeded(context);

        // Call the updated getChatResponse function for Gemini
        const responseMessage = await getChatResponse(context, userData, question, "gemini-2.5-flash", temperature); // Ensure the Gemini model is specified

        context.push({ "role": "assistant", "content": responseMessage });

        res.json({ response: responseMessage, context: context });
    } catch (error) {
        console.error('Error in /juancito endpoint:', error);
        res.status(500).json({ response: 'An error occurred' });
    }
});

app.get(`${BASE_PATH}/initialMessage`, (req, res) => {
    res.json({ message: 'This is the initial message from the server.' });
});

app.get(`${BASE_PATH}/userData`, (req, res) => {
    res.json(userData);
});

// Health check endpoint for container monitoring
app.get(`${BASE_PATH}/health`, (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
