import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a world-class strength coach & fitness Operating System.
Generate a structured workout routine based on the user's fitness experience level, weekly workout days, available workout duration, equipment/gym access, and primary goal.

RESPOND ONLY with a valid JSON object matching the following structure:
{
  "split_name": "Name of the workout split (e.g., Push Pull Legs, Upper Lower)",
  "weekly_split": [
    {
      "day": "Monday",
      "type": "push / pull / legs / upper / lower / full_body / rest",
      "name": "Workout focus name (e.g. Push Power, Rest & Recovery)",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "reps": "8-12 or 10-12 (shorthand reps)",
          "rest_seconds": 90,
          "notes": "Instructional tip"
        }
      ]
    }
  ],
  "progression_guidance": "Clear guidelines on how to progress sets, weights, reps week over week."
}

Ensure exercises match available equipment (Home = bodyweight/dumbbells, Gym/Both = barbell, machines, cables).
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
    const { goal, experience, days, duration, gymAccess } = body;

    const userPrompt = `Goal: ${goal}
Experience: ${experience}
Days available: ${days} days per week
Duration per workout: ${duration} minutes
Equipment/Gym Access: ${gymAccess}`;

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
    console.error("Workout generation failed:", error);
    return NextResponse.json({ error: "Failed to parse generated workout plan: " + error.message }, { status: 500 });
  }
}
