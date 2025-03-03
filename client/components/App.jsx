import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import ToolPanel from "./ToolPanel";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [conversation, setConversation] = useState([]);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const transcriptionMap = useRef({}); // Map item_id to its index in conversation
  const pendingTranscripts = useRef({}); // Store partial transcripts during delta updates

  async function startSession() {
    const tokenResponse = await fetch("/token");
    const data = await tokenResponse.json();
    console.log("Token Data:", JSON.stringify(data, null, 2));

    const EPHEMERAL_KEY = data.client_secret.value;

    const pc = new RTCPeerConnection();
    console.log("Peer connection:", pc);

    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(ms.getTracks()[0]);

    const dc = pc.createDataChannel("oai-events");
    console.log("Data channel:", dc);
    setDataChannel(dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Offer:", offer.sdp);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer = { type: "answer", sdp: await sdpResponse.text() };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }
    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  function sendClientEvent(message) {
    if (dataChannel) {
      console.log("dataChannel:", dataChannel);
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      console.log("Sending message: ", message);
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error("Failed to send message - no data channel available", message);
    }
  }

  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: message }],
      },
    };
    console.log("event.type: ", event.type);
    console.log("Sending event: ", event.item.content[0].text);
    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", (e) => {
        const eventData = JSON.parse(e.data);
        console.log("Received Raw Event:", JSON.stringify(eventData, null, 2));

        if (eventData.type === "conversation.item.created") {
          console.log("Item Object:", JSON.stringify(eventData.item, null, 2));
          if (eventData.item?.role === "user") {
            // Reserve index but do not add entry yet
            transcriptionMap.current[eventData.item.id] = conversation.length;
            pendingTranscripts.current[eventData.item.id] = ""; // Initialize pending transcript
          }
        }

        if (eventData.type === "response.audio_transcript.delta") {
          const itemId = eventData.item_id;
          const delta = eventData.delta;
          if (pendingTranscripts.current[itemId] !== undefined) {
            pendingTranscripts.current[itemId] += delta;
            console.log("Partial Transcript for", itemId, ":", pendingTranscripts.current[itemId]);
          }
        }

        if (eventData.type === "conversation.item.input_audio_transcription.completed") {
          const itemId = eventData.item_id;
          const transcript = eventData.transcript.trim(); // Final transcript
          console.log("Transcription Completed:", { itemId, transcript });

          // Use the final transcript and clear pending
          if (pendingTranscripts.current[itemId] !== undefined) {
            setConversation((prev) => {
              const newConv = [...prev];
              const index = transcriptionMap.current[itemId];
              if (index < newConv.length && newConv[index]?.itemId === itemId) {
                newConv[index] = { role: "user", text: transcript, itemId };
              } else {
                newConv.push({ role: "user", text: transcript, itemId });
                transcriptionMap.current[itemId] = newConv.length - 1;
              }
              delete pendingTranscripts.current[itemId]; // Clear pending transcript
              console.log("Updated Conversation State:", newConv);
              return newConv;
            });
          }
        }

        if (eventData.type === "response.audio_transcript.done") {
          const aiText = eventData.transcript;
          console.log("Detected AI Response:", aiText);
          setConversation((prev) => [...prev, { role: "assistant", text: aiText }]);
        }

        setEvents((prev) => [eventData, ...prev]);
      });
      dataChannel.addEventListener("open", () => {
        console.log("Data channel opened");
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  console.log("Current Conversation State:", conversation);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>realtime console</h1>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            <EventLog events={events} conversation={conversation} />
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto">
          <ToolPanel
            sendClientEvent={sendClientEvent}
            sendTextMessage={sendTextMessage}
            events={events}
            isSessionActive={isSessionActive}
          />
        </section>
      </main>
    </>
  );
}