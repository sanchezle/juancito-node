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

const question = 'entendiste?'



const functionInputTest =(question)=>{
    console.log(question);
}
// Simulated user data

const userData = {
    id: 1,
    name: 'Maria',
    languageLevel: 'Beginner',
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

async function getChatResponse(messages, userData, functionInputTest, model = "gpt-3.5-turbo", temperature = 0) {
    const systemMessage = getSystemMessage(userData, functionInputTest);
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


function addGreetingIfNeeded(context) {
    // Check if a greeting has already been added
    const hasGreeting = context.some(msg => msg.role === "assistant" && msg.content.includes("Hola, ¿cómo puedo ayudarte a aprender español hoy?"));
    
    if (!hasGreeting && context.length === 1 && context[0].role === "user") {
        const greeting = { "role": "assistant", "content": "Hola, ¿cómo puedo ayudarte a aprender español hoy?" };
        context.unshift(greeting); // Add the greeting to the beginning of the context
    }
}


app.post('/juancito', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const context = req.body.context || [];

        if (!userMessage) {
            return res.status(400).json({ response: 'No message provided' });
        }

        const temperature = isSpanishInput(userMessage) ? 0.5 : 0;

        context.push({ "role": "user", "content": userMessage });
        addGreetingIfNeeded(context);

        const responseMessage = await getChatResponse(context, userData, question, "gpt-3.5-turbo", temperature);

        context.push({ "role": "assistant", "content": responseMessage });

        res.json({ response: responseMessage, context: context });
    } catch (error) {
        console.error('Error in /juancito endpoint:', error);
        res.status(500).json({ response: 'An error occurred' });
    }
});

app.get('/userData', (req, res) => {
    res.json(userData);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
