import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a world-class endurance and conditioning coach.
Generate a structured weekly cardio training routine based on the user's primary goal, weekly activity frequency (days per week), preferred duration, and experience level.

RESPOND ONLY with a valid JSON object matching the following structure:
{
  "plan_name": "Name of the cardio plan (e.g., Fat Burning LISS & HIIT, Endurance Builder)",
  "weekly_split": [
    {
      "day": "Monday",
      "type": "LISS / HIIT / Tempo / Interval / Recovery / Rest",
      "activity": "Running / Walking / Cycling / Rowing / Swimming / Elliptical / None",
      "duration_minutes": 30,
      "intensity": "Zone 1 (Very Light) / Zone 2 (Light) / Zone 3 (Moderate) / Zone 4 (High)",
      "target_calories": 250,
      "description": "Clear step-by-step description of the cardio session (e.g. 5m warm up walk, then alternate 1m run at 10km/h and 1m walk at 5km/h for 20m, then 5m cool down)."
    }
  ],
  "coaching_tips": "Key endurance and conditioning tips, heart rate zone explanations, and guidance on recovery and hydration."
}

Ensure the activities and intensities align with the user's primary goal (e.g. fat loss should focus heavily on Zone 2 LISS + occasional HIIT, cardiovascular endurance can include tempo runs, muscle building should minimize excessive cardio but focus on active recovery walking).
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
    const { goal, experience, days, duration } = body;

    const userPrompt = `Goal: ${goal}
Experience: ${experience}
Cardio frequency: ${days} days per week
Preferred session duration: ${duration} minutes`;

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
    console.error("Cardio plan generation failed:", error);
    return NextResponse.json({ error: "Failed to parse generated cardio plan: " + error.message }, { status: 500 });
  }
}
