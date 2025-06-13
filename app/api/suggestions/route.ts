// import { NextRequest, NextResponse } from "next/server";
// import { openai } from "@/lib/llamaindex";

// export async function POST(req: NextRequest) {
//   console.log("[/api/suggestions] API route hit."); // New log
//   const { messages } = await req.json();

//   console.log("[/api/suggestions] Received messages:", messages); // Log incoming messages

//   if (!messages || !Array.isArray(messages)) {
//     console.error("[/api/suggestions] Invalid messages format received."); // More specific error log
//     return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
//   }

//   try {
//     // Format messages for the OpenAI API
//     const formattedMessages = messages.map(msg => ({
//       role: msg.role,
//       content: msg.content,
//     }));

//     // Add a system message to guide the LLM for suggestion generation
//     const systemMessage = {
//       role: "system",
//       content: "Based on the provided chat conversation history between a user and an assistant, suggest 3 *concise* follow-up questions or related topics the user might ask about next. Respond *only* with a comma-separated list of the 3 suggestions. Do not include any introductory or concluding text."
//     };

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo", // Or a more capable model if needed
//       messages: [systemMessage, ...formattedMessages],
//       temperature: 0.8, // Slightly increase temperature for variety
//       max_tokens: 150, // Increase max tokens slightly
//     });

//     const suggestionsString = completion.choices[0].message?.content || "";
//     console.log("[/api/suggestions] Raw OpenAI response content:", suggestionsString); // Log raw response

//     // Attempt to parse the comma-separated list, handle potential unexpected formatting
//     let suggestions: string[] = [];
//     if (suggestionsString) {
//       suggestions = suggestionsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
//       // Fallback parsing if comma-separated split doesn't yield enough results
//       if (suggestions.length < 3 && suggestionsString.includes('\n')) {
//          suggestions = suggestionsString.split('\n').map(s => s.trim()).filter(s => s.length > 0);
//       }
//        // Further fallback: take first N sentences if still not enough
//       if (suggestions.length < 3 && suggestionsString.includes('.')) {
//         suggestions = suggestionsString.split('.').map(s => s.trim()).filter(s => s.length > 0);
//         suggestions = suggestions.slice(0, 3);
//       }
//     }

//     console.log("[/api/suggestions] Parsed suggestions:", suggestions); // Log parsed suggestions

//     return NextResponse.json({ suggestions });
//   } catch (error) {
//     console.error("[/api/suggestions] API error:", error); // More specific error log
//     return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
//   }
// } 