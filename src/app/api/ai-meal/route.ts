import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are an elite clinical sports nutritionist.
Generate a structured, healthy meal plan template for one full day based on target calories, protein requirements, dietary preferences, budget level, allergies, and goals.

RESPOND ONLY with a valid JSON object matching the following structure:
{
  "meals": [
    {
      "name": "Breakfast / Lunch / Dinner / Snacks",
      "time": "Suggested time (e.g. 08:30 AM)",
      "description": "Short delicious name of the meal",
      "ingredients": [
        "Portioned ingredient 1 (e.g. 50g raw oats)",
        "Portioned ingredient 2 (e.g. 1 scoop whey protein)"
      ],
      "macros": {
        "calories": 450,
        "protein": 30,
        "carbs": 50,
        "fat": 10,
        "fiber": 8
      }
    }
  ]
}

Make sure the sum of all meal macros is extremely close to the user's daily targets.
Ensure ingredients respect diet preference (Vegetarian = no meat/fish/eggs, Vegan = no animal products, Eggetarian = eggs allowed but no meat/fish, Non-vegetarian = everything allowed).
Return ONLY the raw JSON object, no markdown codeblocks, no text before or after.`;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured. Add GEMINI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { calories, protein, preference, budget, allergies, goal } = body;

    const userPrompt = `Target Calories: ${calories} kcal
Target Protein: ${protein}g
Diet Preference: ${preference}
Budget Level: ${budget}
Allergies: ${allergies || "None"}
Goal: ${goal}`;

    let text = "";
    const isOpenRouter = GEMINI_API_KEY.startsWith("sk-or-");

    if (isOpenRouter) {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 2500
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json({ error: "Failed to reach OpenRouter." }, { status: 502 });
      }
      const data = await response.json();
      text = data?.choices?.[0]?.message?.content || "";
    } else {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
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
        return NextResponse.json({ error: "Failed to reach Gemini." }, { status: 502 });
      }
      const data = await response.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // Parse JSON safely
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Meal generation failed:", error);
    return NextResponse.json({ error: "Failed to parse generated meal plan: " + error.message }, { status: 500 });
  }
}
