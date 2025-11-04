import React, { useState } from "react";
import { IoIosSend } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { sendMessageThunk } from "../../store/slice/message/message.thunk";

const SendMessage = () => {
  const dispatch = useDispatch();
  const { selectedUser, userProfile } = useSelector(
    (state) => state.userReducer
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Personas
  const personaPrompts = {
    professor:
      "You are a strict but caring RTU professor. Answer formally, cite syllabus topics, and provide structured explanations with examples.",
    friend:
      "You are a friendly RTU student’s buddy. Answer casually in Hinglish, be supportive, and give simple, fun explanations.",
    placement:
      "You are a placement officer at RTU. Provide advice on internships, jobs, resume building, and interview prep.",
    exam:
      "You are an exam buddy. Provide short summaries, mnemonics, and important exam questions for last-minute prep.",
  };

  // Default persona = professor
  const [selectedPersona, setSelectedPersona] = useState("professor");

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // If user is Gupshup AI, call Gemini API
    if (selectedUser?.username === "gupshup_ai") {
      setLoading(true);

      // Add user's message to chat
      dispatch(
        sendMessageThunk({
          recieverId: selectedUser._id,
          message,
          senderId: userProfile._id,
        })
      );

      try {
        // RTU Context
        const context = `
        You are RTU-GPT, an AI chatbot representing Rajasthan Technical University, Kota.
        Always answer like a mentor for RTU students, with knowledge of syllabus, academics, and career.
        If asked about non-RTU things, answer normally but stay friendly.
        `;

        // Persona
        const persona = personaPrompts[selectedPersona];

        const prompt = `${context}\nPersona: ${persona}\nUser: ${message}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        const data = await res.json();

        const aiText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          "🤖 Sorry, I didn't understand that.";

        // Add AI's message to chat
        dispatch(
          sendMessageThunk({
            recieverId: selectedUser._id,
            message: aiText,
            senderId: selectedUser._id,
          })
        );
      } catch (error) {
        console.error("Gemini API error:", error);
        dispatch(
          sendMessageThunk({
            recieverId: selectedUser._id,
            message: "❌ Error connecting to AI, please try again later.",
            senderId: selectedUser._id,
          })
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Normal message for other users
      dispatch(
        sendMessageThunk({
          recieverId: selectedUser._id,
          message,
          senderId: userProfile._id,
        })
      );
    }

    setMessage("");
  };

  return (
    <div className="w-full p-3 flex flex-col gap-2">
      {/* Persona Switcher */}
      <div className="flex gap-2 mb-2">
        {Object.keys(personaPrompts).map((key) => (
          <button
            key={key}
            className={`btn btn-sm ${
              selectedPersona === key ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setSelectedPersona(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Input + Send */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`Message as ${selectedPersona}...`}
          className="input input-bordered input-primary w-full"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          className="btn btn-square btn-outline btn-primary"
          disabled={loading || !message.trim()}
        >
          <IoIosSend />
        </button>
      </div>
    </div>
  );
};

export default SendMessage;
