import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

// Load the system prompt
const systemPrompt = readFileSync("./prompt.md", "utf-8");

// Test morning pages entry
const testEntry = `
I woke up feeling heavy today. The dream I had is already slipping away but
there was water, I remember that. Deep water. I keep thinking about that
conversation with Sarah last week - why do I always feel like I'm defending
myself? Maybe I'm tired of explaining. The coffee tastes bitter this morning
or maybe that's just me. I want to make something today, something with my
hands. I miss the feeling of creating without a purpose. When did everything
become so transactional?
`;

async function testPrompt() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt
  });

  console.log("Sending test morning pages to Gemini...\n");
  console.log("---INPUT---");
  console.log(testEntry.trim());
  console.log("\n---OUTPUT---\n");

  const result = await model.generateContent(testEntry);
  console.log(result.response.text());
}

testPrompt().catch(console.error);
