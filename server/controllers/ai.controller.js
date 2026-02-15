// server/controllers/ai.controller.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import Note from "../models/note.model.js";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const tools = [
  {
    function_declarations: [
      {
        name: "save_note",
        description: "Save a study resource link provided by a student.",
        parameters: {
          type: "OBJECT",
          properties: {
            subject: { type: "STRING", description: "Subject name" },
            link: { type: "STRING", description: "URL link" },
            semester: { type: "STRING", description: "Semester (1-8)" }
          },
          required: ["subject", "link"]
        }
      },
      {
        name: "find_note",
        description: "Find verified study notes for a specific subject.",
        parameters: {
          type: "OBJECT",
          properties: {
            subject: { type: "STRING", description: "Subject name" },
            semester: { type: "STRING", description: "Optional semester number (1-8)" }
          },
          required: ["subject"]
        }
      }
    ]
  }
];

// Comprehensive RTU Knowledge Base in System Instructions
const RTU_SYSTEM_PROMPT = `
You are Gupshup AI, a specialized assistant for RTU (Rajasthan Technical University) students. 
Your tone depends on the [Persona] provided.

RTU KNOWLEDGE BASE:
1. Grading: Percentage = (CGPA * 10) - 7.5.
2. Passing: Min 24/80 in theory, 40/100 total (Theory + Sessional). 75% attendance is mandatory.
3. Grace Marks: Usually up to 6-10 marks total in a semester if only 1-2 subjects are failing.
4. Scope: Only answer RTU-related or engineering study questions. Politely decline non-academic/non-RTU topics.

NOTES LOGIC:
- If a user asks for notes, you MUST use 'find_note'. 
- You should always mention the Sweetnotes link (https://sweetnotes-t7kw.onrender.com/{sem}sem) if a semester is identified.
`;

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", // Use 1.5-flash for better tool reliability
  tools: tools,
  systemInstruction: RTU_SYSTEM_PROMPT
});

export const chatWithAI = async (req, res) => {
  try {
    const { message, persona, history } = req.body;
    const chat = model.startChat({ history: history || [] });
    
    const result = await chat.sendMessage(`[Persona: ${persona}]: ${message}`);
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls) {
      const call = functionCalls[0];
      
      if (call.name === "save_note") {
        const { subject, link, semester } = call.args;
        await Note.create({ subject, link: link.trim(), semester, isVerified: false });
        return res.status(200).json({ reply: `Got it! I've saved those ${subject} notes. They'll be live after a quick verification.` });
      }

      if (call.name === "find_note") {
        const { subject, semester } = call.args;
        
        // 1. Check our MongoDB
        const dbNote = await Note.findOne({ 
          subject: { $regex: subject, $options: "i" }, 
          isVerified: true 
        });

        // 2. Build the Sweetnotes Link (e.g., /3sem)
        let sweetnotesLink = "https://sweetnotes-t7kw.onrender.com/";
        if (semester) {
            sweetnotesLink += `${semester}sem`;
        }

        // 3. Construct Combined Reply
        let reply = `Sure! You can find the main resources for semester ${semester || 'all'} here: ${sweetnotesLink}`;
        
        if (dbNote) {
          reply += `\n\nI also found a specific verified note for ${dbNote.subject} in our database: ${dbNote.link}`;
        } else {
          reply += `\n\nI couldn't find extra custom notes for "${subject}" in my database yet. Do you have a link to contribute?`;
        }

        return res.status(200).json({ reply });
      }
    }

    return res.status(200).json({ reply: response.text() });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ reply: "My circuits are buzzing. Try again in a second!" });
  }
};