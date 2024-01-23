const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openaiApiKey = process.env.OPENAI_API_KEY;

// Define the system message
const systemMessage = `...`; // Your existing system message

let lastGreetedDate = null;

function isSpanishInput(userMessage) {
    // Existing function
}

async function getChatResponse(messages, model = "gpt-3.5-turbo", temperature = 0) {
    // Existing function
}

app.post('/juancito', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const context = req.body.context || [];

        if (!userMessage) {
            return res.status(400).json({ response: 'No message provided' });
        }

        const currentDate = new Date().toDateString();
        if (lastGreetedDate !== currentDate) {
            // Send greeting and update lastGreetedDate
            context.push({ "role": "system", "content": "Buenos días! ¿Cómo puedo ayudarte hoy?" });
            lastGreetedDate = currentDate;
        }

        // Add the user's message to the context
        context.push({ "role": "user", "content": userMessage });

        const temperature = isSpanishInput(userMessage) ? 0.5 : 0;
        const responseMessage = await getChatResponse(context, "gpt-3.5-turbo", temperature);

        // Add the response to the context
        context.push({ "role": "assistant", "content": responseMessage });

        res.json({ response: responseMessage, context: context });
    } catch (error) {
        console.error('Error in /juancito endpoint:', error);
        res.status(500).json({ response: 'An error occurred' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
