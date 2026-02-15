import React, { useState } from "react";
import { IoIosSend } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { sendMessageThunk } from "../../store/slice/message/message.thunk";

const SendMessage = () => {
  const dispatch = useDispatch();
  // 1. Grab the messages from your messageReducer
  const { messages } = useSelector((state) => state.messageReducer);
  const { selectedUser, userProfile } = useSelector(
    (state) => state.userReducer
  );

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false); // 🔥 Prevent double API calls

  // 👇 POINT THIS TO YOUR BACKEND SERVER PORT
  const BACKEND_URL = "http://localhost:5000/api/v1/ai/chat"; 

  // Personas (Kept for UI selection, but actual logic is now on backend)
  const personaPrompts = {
    professor: "Strict but caring professor",
    friend: "Friendly buddy",
    placement: "Placement officer",
    exam: "Exam buddy",
  };

  const [selectedPersona, setSelectedPersona] = useState("professor");

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (isSending) return; // 🔥 Avoid duplicate triggers
    
    setIsSending(true);
    setLoading(true);

    // If the selected user is the AI bot
   if (selectedUser?.username === "gupshup_ai") {
      // 2. Format the history (limit to last 10 messages to save tokens/bandwidth)
      const chatHistory = messages?.slice(-5).map(msg => ({
        role: msg.senderId === userProfile._id ? "user" : "model",
        parts: [{ text: msg.message }]
      })) || [];

      // Show user message in UI
      dispatch(sendMessageThunk({
        recieverId: userProfile._id,
        message: message,
        senderId: selectedUser._id,
      }));

      try {
        // 2. Call YOUR Backend (which talks to Gemini + MongoDB)
        const res = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message,
            persona: selectedPersona, // Send the selected persona to backend
            history: chatHistory,
          }),
        });

        const data = await res.json();

        // 3. Get the clean reply from your backend
        const aiText = data.reply || "🤖 Sorry, I didn't understand that.";

        // 4. Show AI's reply in chat
        dispatch(
          sendMessageThunk({
            recieverId: selectedUser._id,
            message: aiText,
            senderId: selectedUser._id,
          })
        );
      } catch (error) {
        console.error("Backend API error:", error);
        dispatch(
          sendMessageThunk({
            recieverId: selectedUser._id,
            message: "❌ Error connecting to server. Is the backend running?",
            senderId: selectedUser._id,
          })
        );
      } finally {
        setLoading(false);
        setIsSending(false); // 🔥 Unlock
      }
    } else {
      // Normal user-to-user message (No changes here)
      dispatch(
        sendMessageThunk({
          recieverId: selectedUser._id,
          message,
          senderId: userProfile._id,
        })
      );
      setLoading(false);
      setIsSending(false);
    }

    setMessage("");
  };

  return (
    <div className="w-full p-3 flex flex-col gap-2">
      {/* Persona Switcher */}
      <div className="flex gap-2 mb-2 overflow-x-auto">
        {Object.keys(personaPrompts).map((key) => (
          <button
            key={key}
            className={`btn btn-sm whitespace-nowrap ${
              selectedPersona === key ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setSelectedPersona(key)}
            disabled={loading || isSending}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Input & Send */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={loading ? "Thinking..." : `Message as ${selectedPersona}...`}
          className="input input-bordered input-primary w-full"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading || isSending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // 🔥 Prevent double submit
              handleSendMessage();
            }
          }}
        />

        <button
          onClick={handleSendMessage}
          className="btn btn-square btn-outline btn-primary"
          disabled={loading || isSending || !message.trim()}
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <IoIosSend />
          )}
        </button>
      </div>
    </div>
  );
};

export default SendMessage;