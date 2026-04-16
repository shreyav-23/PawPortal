import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/analyze", async (req, res) => {
  const { notes } = req.body;

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const result = await model.generateContent(
    `Analyze dog symptoms: ${notes}`
  );

  res.json({ output: result.response.text() });
});

app.listen(3000, () => console.log("Server running"));