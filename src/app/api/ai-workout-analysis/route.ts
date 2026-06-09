import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a world-class strength coach, sports scientist, and performance analyst.
Your job is to analyze the user's historical workout sessions and provide highly specific, actionable advice on how to improve.

Specifically, analyze:
1. Progression / Progressive Overload: Identify if they successfully completed their sets and reps, and suggest weight or rep increases (e.g. "Increase Bench Press weight by 2.5kg", "Add 2 reps to Pull-ups").
2. Exercise Selection: See if they are missing key compound movements based on their split, and suggest additions.
3. Consistency & Training Volume: Grade their training frequency and volume.

RESPOND ONLY with a valid JSON object matching the following structure:
{
  "summary": "Coaching overview summarizing their recent performance, progress, and overall trajectory.",
  "consistency_rating": "Excellent / Solid / Needs Work (based on logs)",
  "achievements": [
    "Milestone achievement 1 (e.g. Logged 4 sessions in the last week)",
    "Milestone achievement 2 (e.g. Progressive overload achieved on Squats)"
  ],
  "recommendations": [
    {
      "exercise": "Bench Press",
      "current": "3 sets of 10 reps @ 50kg (what they did)",
      "target": "3 sets of 8 reps @ 52.5kg or 3 sets of 10 reps @ 50kg with better pace",
      "coaching_tip": "You completed all 10 reps on your final set of 50kg. Try loading 52.5kg next session for 8 reps to trigger growth."
    }
  ],
  "general_coaching": "General recovery, sleep, warm-up, or hydration advice based on their targets."
}

Look closely at the list of workouts provided in the user prompt. Parse the exercises, sets, reps, and weights from the text summaries. If no workouts have been logged yet, instruct them in the 'summary' and 'general_coaching' to log their first workout and provide a basic startup template.
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
    const { profile, workouts } = body;

    const userPrompt = `User Profile:
- Primary Goal: ${profile?.primary_goal || "Lose Weight"}
- Weight: ${profile?.starting_weight || "80"} kg (Goal: ${profile?.goal_weight || "72"} kg)
- Fitness Experience: ${profile?.fitness_experience || "beginner"}
- Gym Access: ${profile?.gym_access || "both"}

Logged Workout Sessions (History):
${workouts && workouts.length > 0 
  ? workouts.map((w: any) => `Date: ${w.date} | Session: ${w.name} (${w.type}) | Duration: ${w.duration_minutes || 60}m\nDetails:\n${w.notes || "No exercises logged."}`).join("\n\n")
  : "No workouts logged yet."
}`;

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
            max_tokens: 3000
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
    console.error("Workout analysis failed:", error);
    return NextResponse.json({ error: "Failed to parse workout analysis: " + error.message }, { status: 500 });
  }
}
