import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a nutrition expert AI. The user will describe what they ate in natural language (can be in any language or shorthand like "soya with curd", "2 eggs and toast", "dal chawal", etc).

Your job is to parse this into specific food items with accurate nutritional estimates per item.

RESPOND ONLY with a valid JSON array. Each item must have:
- "name": string (food name, in English)
- "quantity": string (e.g. "200g", "2 pieces", "1 bowl (250ml)")
- "calories": number (kcal)
- "protein": number (grams)
- "carbs": number (grams)
- "fat": number (grams)
- "fiber": number (grams)

Use standard Indian/global serving sizes when the user doesn't specify quantity.
For example, "dal chawal" = ~150g cooked dal + ~200g cooked rice.
"soya with curd" = ~100g soya chunks (cooked) + ~150g curd.

Be accurate with macro values. Use USDA/IFCT nutritional data as reference.
Return ONLY the JSON array, no markdown, no explanation.`;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured. Add GEMINI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  try {
    const { description } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Please describe what you ate." }, { status: 400 });
    }

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
              { role: "user", content: `User says: "${description}"` }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1000
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error("OpenRouter API error:", err);
        return NextResponse.json({ error: "Failed to reach OpenRouter. Check your API key." }, { status: 502 });
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
                parts: [{ text: `${SYSTEM_PROMPT}\n\nUser says: "${description}"` }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error("Gemini API error:", err);
        return NextResponse.json({ error: "Failed to reach Gemini AI. Check your API key." }, { status: 502 });
      }

      const data = await response.json();
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (!text) {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    // Sometimes models return a wrapper JSON with a key name if we requested response_format json_object
    let items = JSON.parse(text);
    if (!Array.isArray(items) && items.items && Array.isArray(items.items)) {
      items = items.items;
    } else if (!Array.isArray(items) && typeof items === "object") {
      // If it returned a single object containing the array, extract it
      const possibleArray = Object.values(items).find(Array.isArray);
      if (possibleArray) {
        items = possibleArray;
      }
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Unexpected response format." }, { status: 502 });
    }

    // Validate and clean items
    const cleaned = items.map((item: any) => ({
      name: String(item.name || "Unknown Food"),
      quantity: String(item.quantity || "1 serving"),
      calories: Math.round(Number(item.calories) || 0),
      protein: Math.round((Number(item.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(item.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(item.fat) || 0) * 10) / 10,
      fiber: Math.round((Number(item.fiber) || 0) * 10) / 10,
    }));

    return NextResponse.json({ items: cleaned });
  } catch (error: any) {
    console.error("AI Food API error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong." }, { status: 500 });
  }
}
