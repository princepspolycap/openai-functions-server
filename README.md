```markdown
# OpenAI Functions Server

This is a server application that integrates with OpenAI's GPT-4 model to provide chat and function capabilities. It includes endpoints for chat completions, function calls, and text completions.

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/openai-functions-server.git
```

2. Install the dependencies:

```bash
cd openai-functions-server
npm install
```

3. Create a `.env` file in the root directory of the project, and add your OpenAI API key:

```bash
OPENAI_API_KEY=your-api-key
```

4. Build the TypeScript files:

```bash
npm run build
```

5. Start the server:

```bash
npm run start
```

The server will start running at `http://localhost:3000`.

## Endpoints

- POST `/api/function`: Call a function using the OpenAI API.
- POST `/api/chat`: Get a chat completion from the OpenAI API.
- POST `/api/completion`: Get a text completion from the OpenAI API.

## Function Call Documentation

### How to Call Functions with Chat Models Using a TypeScript Server

This document covers how to use the OpenAI Chat Completions API in combination with external functions to extend the capabilities of GPT models in a TypeScript server environment.

The `functions` parameter in the Chat Completion API can be used to provide function specifications. The purpose of this is to enable models to generate function arguments that adhere to the provided specifications. Note that the API will not actually execute any function calls. It is up to developers to execute function calls using model outputs.

If the `functions` parameter is provided, then by default, the model will decide when it is appropriate to use one of the functions. The API can be forced to use a specific function by setting the `function_call` parameter to `{"name": "<insert-function-name>"}`. The API can also be forced to not use any function by setting the `function_call` parameter to `"none"`. If a function is used, the output will contain `"finish_reason": "function_call"` in the response, as well as a `function_call` object that has the name of the function and the generated function arguments.

### How to Generate Function Arguments

First, let's define a function specification for a hypothetical weather API. We'll pass these function specifications to the Chat Completions API in order to generate function arguments that adhere to the specification.

```typescript
const functions = [
    {
        "name": "get_current_weather",
        "description": "Get the current weather",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g., San Francisco, CA"
                },
                "format": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "The temperature unit to use. Infer this from the user's location."
                }
            },
            "required": ["location", "format"]
        }
    },
    {
        "name": "get_n_day_weather_forecast",
        "description": "Get an N-day weather forecast",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g., San Francisco, CA"
                },
                "format": {
                    "type": "string",
                    "enum": ["celsius", "f

ahrenheit"],
                    "description": "The temperature unit to use. Infer this from the user's location."
                },
                "days": {
                    "type": "number",
                    "minimum": 1,
                    "maximum": 7,
                    "description": "The number of days to forecast"
                }
            },
            "required": ["location", "format", "days"]
        }
    }
];
```

To generate function arguments, you can follow these steps:

1. Call the Chat Completions API and pass the `functions` parameter along with the prompt to generate a response.

```typescript
const prompt = "What's the weather like in San Francisco?";
const maxTokens = 100;

const response = await openai.complete({
    engine: 'text-davinci-003',
    prompt,
    maxTokens,
    functions
});
```

2. Extract the function call from the API response.

```typescript
const functionCall = response.choices[0].function_call;
```

3. Use the extracted function call to execute the corresponding function with the generated arguments.

```typescript
if (functionCall) {
    const functionName = functionCall.name;
    const functionArguments = functionCall.arguments;

    switch (functionName) {
        case 'get_current_weather':
            // Call the get_current_weather function with the generated arguments
            const currentWeather = await getCurrentWeather(functionArguments);
            // Process the currentWeather response
            break;
        case 'get_n_day_weather_forecast':
            // Call the get_n_day_weather_forecast function with the generated arguments
            const nDayForecast = await getNDayWeatherForecast(functionArguments);
            // Process the nDayForecast response
            break;
        default:
            // Handle unrecognized function name
            break;
    }
} else {
    // No function call generated by the model, process the regular chat response
}
```

4. Implement the actual function calls (`getCurrentWeather`, `getNDayWeatherForecast`, etc.) using external APIs or any other relevant logic.

Remember to handle any errors that may occur during the execution of function calls.

## License

This project is licensed under the ISC License.
```
