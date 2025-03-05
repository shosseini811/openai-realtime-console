import { ArrowUp, ArrowDown } from "react-feather";
import { useState } from "react";

function Event({ event, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isClient = event.event_id && !event.event_id.startsWith("event_");
  // print is client
  // console.log("isClient: ", isClient);

  let textPreview = "";
  // print event type
  // console.log("event.type: ", event.type);
  if (event.type === "conversation.item.created" && event.item.role === "user") {
    textPreview = event.item.content[0].text; // Your speech
  } else if (event.type === "response.audio_transcript.done") {
    textPreview = event.transcript; // AI’s full response
  } else if (event.type === "response.audio_transcript.delta") {
    textPreview = event.delta; // AI’s incremental response
  }
  // print text preview
  // console.log("textPreview: ", textPreview);

  return (
    <div className="flex flex-col gap-2 p-2 rounded-md bg-gray-50">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isClient ? (
          <ArrowDown className="text-blue-400" />
        ) : (
          <ArrowUp className="text-green-400" />
        )}
        <div className="text-sm text-gray-500">
          {isClient ? "client:" : "server:"} {event.type} | {timestamp}
        </div>
      </div>
      {textPreview && (
        <div className="text-gray-700 text-sm p-1">
          {/* Ternary Operator (? :)
          This is a shorthand way to write an if-else statement in JavaScript
          The format is: condition ? valueIfTrue : valueIfFalse
          In this case, isClient is the condition being checked */}

        {/* Text Display Logic:
        If isClient is true, it displays "You: " (indicating a user message)
        If isClient is false, it displays "AI: " (indicating an AI response)
        Then it adds the textPreview variable which contains the actual message content */}
        {/* print is client */}

          {/* This is what I see showing Event Log section. so I had to comment it out */}
          {/* {isClient ? "You: " : "AI: "} {textPreview} */}
        </div>
      )}
      <div
        className={`text-gray-500 bg-gray-200 p-2 rounded-md overflow-x-auto ${
          isExpanded ? "block" : "hidden"
        }`}
      >
        <pre className="text-xs">{JSON.stringify(event, null, 2)}</pre>
      </div>
    </div>
  );
}

export default function EventLog({ events, conversation }) {
  const eventsToDisplay = [];
  let deltaEvents = {};
  // print events
  // console.log("events: ", events);
  // console.log("conversation: ", conversation);

  // This code is implementing a deduplication mechanism for delta events. 
  // In real-time applications like this one (which appears to be a chat interface with OpenAI), 
  // you might receive multiple events of the same type as updates come in. 
  // This code ensures that only one instance of each delta event type is processed and displayed to avoid repetition in the user interface.

  events.forEach((event) => {
    if (event.type.endsWith("delta")) {
      if (deltaEvents[event.type]) {
        return; // Skip duplicates
      } else {
        deltaEvents[event.type] = event;
      }
    }
    // print delta events
    // console.log("deltaEvents: ", deltaEvents);

    eventsToDisplay.push(
      <Event
      key={`${event.event_id}-${eventsToDisplay.length}`} // Use array length as a unique suffix
        event={event}
        timestamp={new Date().toLocaleTimeString()}
      />
    );
    // console.log("eventsToDisplay: ", eventsToDisplay);
  });

  return (
    <div className="flex flex-col gap-4 overflow-x-auto">
      {/* Conversation Section */}
      <div className="conversation-log p-2 bg-white border border-gray-200 rounded-md">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Conversation</h2>
        {conversation.length === 0 ? (
          <div className="text-gray-500">No conversation yet...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Map through each conversation entry and display it */}
            {conversation.map((entry, index) => (
              <div
                key={index}
                className={`p-2 rounded-md ${
                  entry.role === "user"
                    /* Position user messages on the LEFT side with blue background */
                    ? "bg-blue-100 text-blue-800 self-start"
                    /* Position AI messages on the RIGHT side with green background */
                    : "bg-green-100 text-green-800 self-end"
                }`}
              >
                <strong>{entry.role === "user" ? "You: " : "AI: "}</strong>
                {entry.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Log Section */}
      <div className="event-log">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Event Log</h3>
        {events.length === 0 ? (
          <div className="text-gray-500">Awaiting events...</div>
        ) : (
          eventsToDisplay
        )}
      </div>
    </div>
  );
}