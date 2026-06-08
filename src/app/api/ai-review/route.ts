import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured. Add GEMINI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  try {
    const { summaries, profile, targets } = await req.json();

    const prompt = `
You are a Staff Fitness Coach and Nutrition Consultant. Analyze the user's health logs for the past week and produce a structured, actionable weekly review.

Target Goal: ${profile?.goal_weight}kg (Current Weight estimate: ${profile?.starting_weight}kg)
Calorie Target: ${targets?.calories} kcal
Protein Target: ${targets?.protein}g
Daily Steps Target: ${targets?.steps} steps

Weekly Logs Data:
${JSON.stringify(summaries, null, 2)}

Provide a JSON object containing:
1. "weightLoss": number (estimate of weight loss in kg over these summaries, e.g. -0.6)
2. "status": string ("On Track", "Caution", or "Slowing")
3. "highlights": string[] (3 bullet points of successful metrics, e.g., hit calorie goals, high step count)
4. "lowlights": string[] (2 bullet points of missed metrics or warning areas)
5. "nextActions": string[] (3 actionable nutrition, training, or sleep changes for next week to speed up progress safely)

Respond ONLY with the JSON object. Do not include markdown formatting like \`\`\`json.
`;

    let text = "";
    const isOpenRouter = GEMINI_API_KEY.startsWith("sk-or-");

    if (isOpenRouter) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter responded with status: ${response.status}`);
      }
      const data = await response.json();
      text = data?.choices?.[0]?.message?.content || "";
    } else {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini responded with status: ${response.status}`);
      }
      const data = await response.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const reviewData = JSON.parse(cleanedText);

    return NextResponse.json(reviewData);
  } catch (err: any) {
    console.error("AI Weekly Review error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate weekly review" },
      { status: 500 }
    );
  }
}
