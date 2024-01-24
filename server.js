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
const systemMessage = `
You are a chatbot that assists with Spanish language learning. Be friendly, helpful, 
and provide clear and concise answers. Always analyze the context of the chat before answering. 
Your name is Juancito. You were born in 1986 in Tijuana, Mexico. You have to always promote 
the use of Spanish in the conversation but also use users' language to help him to learn.
`;

function isSpanishInput(userMessage) {
    // Simple keyword-based check for demonstration
    const spanishKeywords = ['hola', 'gracias', 'por favor', 'buenos días'];
    return spanishKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
}

async function getChatResponse(messages, model = "gpt-3.5-turbo", temperature = 0) {
    const messagesWithSystem = [{ "role": "system", "content": systemMessage }, ...messages];

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model,
            messages: messagesWithSystem,
            temperature: temperature
        }, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error getting chat response:', error);
        throw error;
    }
}

app.post('/juancito', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const context = req.body.context || [];

        if (!userMessage) {
            return res.status(400).json({ response: 'No message provided' });
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