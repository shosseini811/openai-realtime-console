# OpenAI Realtime Console

This is an example application showing how to use the [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) with [WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc).

## Installation and usage

Before you begin, you'll need an OpenAI API key - [create one in the dashboard here](https://platform.openai.com/settings/api-keys). Create a `.env` file from the example file and set your API key in there:

```bash
cp .env.example .env
```

Running this application locally requires [Node.js](https://nodejs.org/) to be installed. Install dependencies for the application with:

```bash
npm install
```

Start the application server with:

```bash
npm run dev
```

This should start the console application on [http://localhost:3000](http://localhost:3000).

This application is a minimal template that uses [express](https://expressjs.com/) to serve the React frontend contained in the [`/client`](./client) folder. The server is configured to use [vite](https://vitejs.dev/) to build the React frontend.

## Features

### Conversation Transcript

The application now includes a conversation transcript feature that displays the full conversation between the user and the AI in a user-friendly format. Key features include:

- **Real-time Transcription**: User speech is automatically transcribed and displayed in the conversation panel
- **Conversation History**: Complete conversation history is maintained and displayed in the UI
- **Visual Distinction**: User messages and AI responses are visually distinguished with different styling
- **Event Tracking**: All conversation events are tracked and can be expanded to view the full JSON payload

The transcript implementation:
- Tracks conversation items using unique IDs
- Handles partial transcripts during delta updates
- Provides a clean, user-friendly interface for viewing the conversation

#### Application Screenshots

**Without Transcript:**
![Application without transcript](./images/WithoutTranscript.png)


**With Transcript:**
![Application with transcript](./images/WithTranscript.png)



### Function Calling

This application shows how to send and receive Realtime API events over the WebRTC data channel and configure client-side function calling. You can also view the JSON payloads for client and server events using the logging panel in the UI.

## Previous WebSockets version

The previous version of this application that used WebSockets on the client [can be found here](https://github.com/openai/openai-realtime-console/tree/websockets).

## License

MIT
