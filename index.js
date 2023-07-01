"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const winston_1 = require("winston");
// Load environment variables from .env file
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Logger configuration
const logger = (0, winston_1.createLogger)({
    transports: [
        new winston_1.transports.Console(),
        new winston_1.transports.File({ filename: 'error.log', level: 'error' }),
        new winston_1.transports.File({ filename: 'combined.log' })
    ],
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.printf(({ level, message, timestamp }) => {
        return `[${timestamp}] ${level}: ${message}`;
    }))
});
// Example dummy function hard coded to return the same weather
// In production, this could be your backend API or an external API
function get_current_weather(location, unit = "fahrenheit") {
    const weather_info = {
        "location": location,
        "temperature": "72",
        "unit": unit,
        "forecast": ["sunny", "windy"],
    };
    return JSON.stringify(weather_info);
}
// Function API endpoint
app.post('/api/function', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = req.body.messages;
    const functions = req.body.functions;
    logger.info(`First request: ${JSON.stringify(req.body, null, 2)}`);
    try {
        logger.info('Sending request to OpenAI Function API...');
        let response = yield axios_1.default.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4-0613',
            messages: messages,
            functions: functions,
            function_call: 'auto'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        logger.info(`First response received: ${JSON.stringify(response.data, null, 2)}`);
        const response_message = response.data.choices[0].message;
        if (response_message.function_call) {
            const available_functions = {
                "get_current_weather": get_current_weather,
            };
            const function_name = response_message.function_call.name;
            const function_to_call = available_functions[function_name];
            const function_args = JSON.parse(response_message.function_call.arguments);
            const function_response = function_to_call(function_args.location, function_args.unit);
            messages.push({
                "role": "assistant",
                "content": response_message.content || "",
                "function_call": response_message.function_call
            });
            messages.push({
                "role": "function",
                "name": function_name,
                "content": function_response,
            });
            logger.info(`Sending second request to OpenAI Function API: ${JSON.stringify(messages, null, 2)}`);
            response = yield axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4-0613',
                messages: messages,
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            });
        }
        logger.info(`Second response received: ${JSON.stringify(response.data, null, 2)}`);
        res.json(response.data);
    }
    catch (error) {
        logger.error(`Function API error: ${error.message}`);
        res.json({ error: 'An error occurred during function calling.' });
    }
}));
// Chat Completions API endpoint
app.post('/api/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = req.body.messages;
    try {
        logger.info('Sending request to OpenAI Chat API...');
        const response = yield axios_1.default.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: messages // use the variable, not the string 'messages'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        res.json(response.data);
    }
    catch (error) {
        logger.error(`Chat API error: ${error.message}`);
        res.json({ error: 'An error occurred during chat completion.' });
    }
}));
// Completions API endpoint
app.post('/api/completion', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = req.body.prompt;
    try {
        logger.info('Sending request to OpenAI Completion API...');
        const response = yield axios_1.default.post('https://api.openai.com/v1/completions', {
            model: 'text-davinci-003',
            prompt: prompt
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        res.json(response.data);
    }
    catch (error) {
        logger.error(`Completion API error: ${error.message}`);
        res.json({ error: 'An error occurred during completion.' });
    }
}));
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Server running at http://localhost:${port}`));
