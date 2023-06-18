import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import winston, { createLogger, transports, format } from 'winston';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

// Logger configuration
const logger = createLogger({
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' })
    ],
    format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    )
});

// Example dummy function hard coded to return the same weather
// In production, this could be your backend API or an external API
function get_current_weather(location: any, unit = "fahrenheit") {
    const weather_info = {
        "location": location,
        "temperature": "72",
        "unit": unit,
        "forecast": ["sunny", "windy"],
    };
    return JSON.stringify(weather_info);
}

// Function API endpoint
app.post('/api/function', async (req, res) => {
    const messages = req.body.messages;
    const functions = req.body.functions;

    try {
        logger.info('Sending request to OpenAI Function API...');
        let response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4-0613',
            messages: messages,
            functions: functions,
            function_call: 'auto'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        const response_message = response.data.choices[0].message;

        if (response_message.function_call) {
            const available_functions = {
                "get_current_weather": get_current_weather,
            };
            const function_name = response_message.function_call.name as keyof typeof available_functions;
            const function_to_call = available_functions[function_name];
            const function_args = JSON.parse(response_message.function_call.arguments);
            const function_response = function_to_call(
                function_args.location,
                function_args.unit
            );

            messages.push({
                "role": "assistant",
                "content": response_message.content || "",  // use the assistant's message or an empty string
                "function_call": response_message.function_call
            });
            messages.push({
                "role": "function",
                "name": function_name,
                "content": function_response,
            });

            logger.info('Sending second request to OpenAI Function API...');
            response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4-0613',
                messages: messages,
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            });
        }

        res.json(response.data);
    } catch (error: any) {
        logger.error(`Function API error: ${error.message}`);
        res.json({ error: 'An error occurred during function calling.' });
    }
});

// Chat Completions API endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
    const messages = req.body.messages;
    try {
        logger.info('Sending request to OpenAI Chat API...');
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: messages  // use the variable, not the string 'messages'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        res.json(response.data);
    } catch (error: any) {
        logger.error(`Chat API error: ${error.message}`);
        res.json({ error: 'An error occurred during chat completion.' });
    }
});

// Completions API endpoint
app.post('/api/completion', async (req: Request, res: Response) => {
    const prompt = req.body.prompt;
    try {
        logger.info('Sending request to OpenAI Completion API...');
        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: 'text-davinci-003',
            prompt: prompt
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        res.json(response.data);
    } catch (error: any) {
        logger.error(`Completion API error: ${error.message}`);
        res.json({ error: 'An error occurred during completion.' });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Server running at http://localhost:${port}`));
