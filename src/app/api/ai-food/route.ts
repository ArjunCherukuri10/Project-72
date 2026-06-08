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
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  try {
    const { description } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Please describe what you ate." }, { status: 400 });
    }

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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "No response from Gemini." }, { status: 502 });
    }

    // Parse the JSON response
    const items = JSON.parse(text);

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
