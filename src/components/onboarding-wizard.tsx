"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Calendar, Heart, ShieldAlert, Loader2, Dumbbell, Apple, Info } from "lucide-react";
import { calculateBMR, calculateTDEE, calculateMacroTargets, calculateBMI, getBMICategory } from "@/lib/utils";
import { addDays, format } from "date-fns";

interface OnboardingWizardProps {
  onComplete: (data: any) => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const [now] = useState(() => new Date()); // stable date reference for render-pure memoization

  // Step 1: Basic Profile
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("1995-01-01");
  const age = useMemo(() => {
    if (!dateOfBirth) return 25;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      computedAge--;
    }
    return computedAge;
  }, [dateOfBirth]);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(80);
  const [occupation, setOccupation] = useState("");

  // Step 2: Primary Goal
  const [goal, setGoal] = useState<string>("Lose Weight");

  // Step 3: Target Setup
  const [targetWeight, setTargetWeight] = useState<number>(72);
  const [targetDateStr, setTargetDateStr] = useState<string>("");

  // Step 4: Activity Level
  const [activityLevel, setActivityLevel] = useState<string>("moderate");

  // Step 5: Fitness Experience
  const [experience, setExperience] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [workoutDays, setWorkoutDays] = useState<number>(4);
  const [workoutDuration, setWorkoutDuration] = useState<number>(45);
  const [gymAccess, setGymAccess] = useState<"home" | "gym" | "both">("both");

  // Step 6: Diet Preferences
  const [dietPreference, setDietPreference] = useState<"vegetarian" | "eggetarian" | "non_vegetarian" | "vegan">("non_vegetarian");
  const [foodsToAvoid, setFoodsToAvoid] = useState("");
  const [allergies, setAllergies] = useState("");
  const [budget, setBudget] = useState<"low" | "medium" | "high">("medium");

  // Step 7: Daily Targets
  const [manualMode, setManualMode] = useState(false);
  const [customCalories, setCustomCalories] = useState<number>(2000);
  const [customProtein, setCustomProtein] = useState<number>(130);
  const [customCarbs, setCustomCarbs] = useState<number>(200);
  const [customFat, setCustomFat] = useState<number>(65);
  const [customFiber, setCustomFiber] = useState<number>(30);
  const [customWater, setCustomWater] = useState<number>(3000);
  const [customSteps, setCustomSteps] = useState<number>(10000);
  const [customSleep, setCustomSleep] = useState<number>(8);

  const [loading, setLoading] = useState(false);

  // Goal Validation & Projections
  const goalValidation = useMemo(() => {
    if (!targetWeight || !weight) return null;
    const diff = Math.abs(weight - targetWeight);
    if (diff === 0) return { isSafe: true, msg: "Your current weight matches your target." };

    let timelineWeeks = 12; // default fallback
    if (targetDateStr) {
      const days = Math.round((new Date(targetDateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      timelineWeeks = Math.max(1, days / 7);
    }

    const weeklyRate = diff / timelineWeeks;
    const isSafe = weeklyRate <= 1.0; // safe rate is 1kg/week max

    // Recommended timeline based on safe 0.5kg/week
    const recommendedWeeks = Math.ceil(diff / 0.5);
    const recommendedDate = addDays(new Date(), recommendedWeeks * 7);

    return {
      isSafe,
      weeklyRate: parseFloat(weeklyRate.toFixed(2)),
      recommendedWeeks,
      recommendedDate: format(recommendedDate, "yyyy-MM-dd"),
      msg: !isSafe 
        ? `A target rate of ${weeklyRate.toFixed(1)}kg/week is high. A safe, sustainable rate is 0.5kg/week.`
        : null
    };
  }, [weight, targetWeight, targetDateStr, now]);

  // Target Calculator values
  const calculatedTargets = useMemo(() => {
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    
    // Default deficit/surplus depending on goal
    let modifier = 0;
    if (goal === "Lose Weight") modifier = -500;
    else if (goal === "Build Muscle") modifier = 300;
    else if (goal === "Body Recomposition") modifier = -200;

    const calories = Math.round(tdee + modifier);
    const protein = Math.round(weight * (experience === "beginner" ? 1.8 : 2.2));
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
    const fiber = Math.round((calories / 1000) * 14);

    return {
      calories,
      protein,
      carbs: Math.max(carbs, 50),
      fat,
      fiber,
      water: 3000,
      steps: 10000,
      sleep: 8
    };
  }, [weight, height, age, gender, activityLevel, goal, experience]);

  const handleApplyRecommendedDate = () => {
    if (goalValidation?.recommendedDate) {
      setTargetDateStr(goalValidation.recommendedDate);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Mimic API delay
    await new Promise((r) => setTimeout(r, 1200));

    const finalTargets = manualMode
      ? {
          calories: customCalories,
          protein: customProtein,
          carbs: customCarbs,
          fat: customFat,
          fiber: customFiber,
          water: customWater,
          steps: customSteps,
          sleep: customSleep,
        }
      : {
          calories: calculatedTargets.calories,
          protein: calculatedTargets.protein,
          carbs: calculatedTargets.carbs,
          fat: calculatedTargets.fat,
          fiber: calculatedTargets.fiber,
          water: calculatedTargets.water,
          steps: calculatedTargets.steps,
          sleep: calculatedTargets.sleep,
        };

    const onboardingData = {
      profile: {
        full_name: fullName,
        age,
        date_of_birth: dateOfBirth,
        gender,
        height_cm: height,
        starting_weight: weight,
        goal_weight: targetWeight,
        occupation: occupation || null,
        fitness_experience: experience,
        workout_days_limit: workoutDays,
        workout_duration_limit: workoutDuration,
        gym_access: gymAccess,
        diet_preference: dietPreference,
        foods_to_avoid: foodsToAvoid || null,
        allergies: allergies || null,
        budget_preference: budget,
        has_completed_onboarding: true,
      },
      goal: {
        primary_goal: goal,
        target_weight: targetWeight,
        target_date: targetDateStr || null,
        recommended_date: goalValidation?.recommendedDate || null,
        recommended_weekly_change: goalValidation?.weeklyRate || 0.5,
        recommended_deficit: goal === "Lose Weight" ? 500 : goal === "Body Recomposition" ? 200 : 0
      },
      targets: finalTargets
    };

    onComplete(onboardingData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl border-white/[0.08] bg-zinc-950/80 text-white shadow-2xl relative">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-lg">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>Project 72 — Personalize Your Health OS</span>
            </div>
            <span className="text-xs text-white/40 font-mono">
              Step {step} of {totalSteps}
            </span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-1.5 bg-white/[0.04]" />
        </CardHeader>

        <CardContent className="space-y-6 min-h-[360px] max-h-[70vh] overflow-y-auto pr-2">
          {/* STEP 1: Basic Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl">Let&apos;s build your profile</CardTitle>
                <CardDescription>Tell us a bit about yourself to compute healthy baselines.</CardDescription>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="fullname">Full Name *</Label>
                    <Input id="fullname" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                    <span className="text-[10px] text-teal-400 mt-1 block">Calculated Age: {age} years</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Gender *</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button variant={gender === "male" ? "default" : "outline"} className="text-xs" onClick={() => setGender("male")}>Male</Button>
                      <Button variant={gender === "female" ? "default" : "outline"} className="text-xs" onClick={() => setGender("female")}>Female</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="height">Height (cm) *</Label>
                    <Input id="height" type="number" value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 175)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="weight">Current Weight (kg) *</Label>
                    <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 80)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="occupation">Occupation (Optional)</Label>
                  <Input id="occupation" placeholder="Software Engineer, Doctor, Student, etc." value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Goal selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl">What is your primary goal?</CardTitle>
                <CardDescription>We will customize your macros and weekly updates accordingly.</CardDescription>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Lose Weight", desc: "Reduce body fat & lean down safely" },
                  { name: "Build Muscle", desc: "Gain lean mass & maximize strength" },
                  { name: "Body Recomposition", desc: "Build muscle while losing fat" },
                  { name: "Improve Fitness", desc: "Improve endurance & sports capabilities" },
                  { name: "Improve Health", desc: "Enhance vitals, markers, & longevity" },
                  { name: "Maintain Weight", desc: "Stabilize weight & lock down lifestyle habits" }
                ].map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => {
                      setGoal(g.name);
                      if (g.name === "Build Muscle" && targetWeight <= weight) {
                        setTargetWeight(weight + 5);
                      } else if (g.name === "Lose Weight" && targetWeight >= weight) {
                        setTargetWeight(weight - 5);
                      }
                    }}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                      goal === g.name
                        ? "border-teal-500 bg-teal-500/10 shadow-lg shadow-teal-500/5"
                        : "border-white/[0.06] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
                    }`}
                  >
                    <span className="font-bold text-sm text-white">{g.name}</span>
                    <span className="text-xs text-white/50 mt-1">{g.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Goal weight and validation */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl">Set your targets</CardTitle>
                <CardDescription>Tell us your target weight and when you want to achieve it.</CardDescription>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="targetWeight">Target Weight (kg) *</Label>
                    <Input id="targetWeight" type="number" value={targetWeight} onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 72)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="targetDate" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-white/50" />
                      Target Date (Optional)
                    </Label>
                    <Input id="targetDate" type="date" value={targetDateStr} onChange={(e) => setTargetDateStr(e.target.value)} />
                  </div>
                </div>

                {/* Validation warnings or safety recommendations */}
                {goalValidation && !goalValidation.isSafe && (
                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-white block">A bit ambitious!</span>
                        <p className="text-xs text-white/60 leading-relaxed">
                          Losing weight at a rate of <strong>{goalValidation.weeklyRate}kg/week</strong> may be difficult to achieve safely and could result in muscle loss or fatigue.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-rose-500/10 pt-2.5">
                      <div className="text-[11px] text-white/40">
                        Recommended Date: <strong>{goalValidation.recommendedDate}</strong> (0.5kg/week rate)
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-rose-500/30 text-rose-300 hover:bg-rose-500/10" onClick={handleApplyRecommendedDate}>
                        Apply safe target
                      </Button>
                    </div>
                  </div>
                )}

                {goalValidation && goalValidation.isSafe && (
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2.5">
                    <Heart className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-white block">Perfect pace!</span>
                      <p className="text-xs text-white/60">
                        This timeline is realistic and aligns with recommended sustainable changes (~{goalValidation.weeklyRate}kg/week).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Activity Level */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl">What is your daily activity level?</CardTitle>
                <CardDescription>This calculates your baseline calorie expenditure (TDEE).</CardDescription>
              </div>
              <div className="space-y-2.5">
                {[
                  { id: "sedentary", name: "Sedentary", desc: "Desk job, little to no structured workouts", multiplier: "BMR × 1.2" },
                  { id: "light", name: "Lightly Active", desc: "Light exercise or active job (1-3 days/week)", multiplier: "BMR × 1.375" },
                  { id: "moderate", name: "Moderately Active", desc: "Moderate workouts or active lifestyle (3-5 days/week)", multiplier: "BMR × 1.55" },
                  { id: "active", name: "Very Active", desc: "Intense workouts or hard labor (6-7 days/week)", multiplier: "BMR × 1.725" },
                  { id: "very_active", name: "Athlete / Elite", desc: "Double daily workouts or professional sports", multiplier: "BMR × 1.9" }
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActivityLevel(act.id)}
                    className={`w-full flex items-center justify-between text-left p-3.5 rounded-xl border transition-all ${
                      activityLevel === act.id
                        ? "border-teal-500 bg-teal-500/10 shadow-lg"
                        : "border-white/[0.06] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-white block">{act.name}</span>
                      <span className="text-xs text-white/40 mt-0.5 block">{act.desc}</span>
                    </div>
                    <span className="text-[10px] text-teal-400 font-mono bg-teal-500/10 px-2 py-0.5 rounded-full">
                      {act.multiplier}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Fitness Experience & Workout schedule */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl">Your fitness schedule & preferences</CardTitle>
                <CardDescription>We will use these details to generate a custom workout split.</CardDescription>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Fitness Experience Level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["beginner", "intermediate", "advanced"] as const).map((lv) => (
                      <Button key={lv} variant={experience === lv ? "default" : "outline"} className="capitalize text-xs rounded-xl" onClick={() => setExperience(lv)}>
                        {lv}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="workoutDays">Workouts Per Week</Label>
                    <select id="workoutDays" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500" value={workoutDays} onChange={(e) => setWorkoutDays(parseInt(e.target.value) || 4)}>
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <option key={d} value={d}>{d} Day{d > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="workoutDuration">Workout Duration</Label>
                    <select id="workoutDuration" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500" value={workoutDuration} onChange={(e) => setWorkoutDuration(parseInt(e.target.value) || 45)}>
                      {[30, 45, 60, 90, 120].map((m) => (
                        <option key={m} value={m}>{m} Minutes</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Equipment / Gym Access</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["home", "gym", "both"] as const).map((eq) => (
                      <Button key={eq} variant={gymAccess === eq ? "default" : "outline"} className="capitalize text-xs rounded-xl" onClick={() => setGymAccess(eq)}>
                        {eq}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Diet Preferences */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl">Nutrition & dietary choices</CardTitle>
                <CardDescription>Tell us about your eating habits so we can shape a sample template.</CardDescription>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Diet Preference</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "vegetarian", name: "Veg" },
                      { id: "eggetarian", name: "Egg" },
                      { id: "non_vegetarian", name: "Non-Veg" },
                      { id: "vegan", name: "Vegan" }
                    ].map((d) => (
                      <Button key={d.id} variant={dietPreference === d.id ? "default" : "outline"} className="text-xs rounded-xl px-1" onClick={() => setDietPreference(d.id as any)}>
                        {d.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Input id="allergies" placeholder="e.g. peanuts, dairy" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="foodsToAvoid">Foods to Avoid</Label>
                    <Input id="foodsToAvoid" placeholder="e.g. sugar, fast food" value={foodsToAvoid} onChange={(e) => setFoodsToAvoid(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Budget Level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "medium", "high"] as const).map((b) => (
                      <Button key={b} variant={budget === b ? "default" : "outline"} className="capitalize text-xs rounded-xl" onClick={() => setBudget(b)}>
                        {b}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Daily Targets Calculation */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Your Daily targets are ready!</CardTitle>
                  <CardDescription>Based on your profile, here are your optimized numbers.</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-lg">
                  <Button size="sm" variant={!manualMode ? "default" : "ghost"} className="h-7 text-[10px] rounded" onClick={() => setManualMode(false)}>Auto</Button>
                  <Button size="sm" variant={manualMode ? "default" : "ghost"} className="h-7 text-[10px] rounded" onClick={() => {
                    setManualMode(true);
                    setCustomCalories(calculatedTargets.calories);
                    setCustomProtein(calculatedTargets.protein);
                    setCustomCarbs(calculatedTargets.carbs);
                    setCustomFat(calculatedTargets.fat);
                    setCustomFiber(calculatedTargets.fiber);
                    setCustomWater(calculatedTargets.water);
                    setCustomSteps(calculatedTargets.steps);
                    setCustomSleep(calculatedTargets.sleep);
                  }}>Manual</Button>
                </div>
              </div>

              {!manualMode ? (
                <div className="space-y-4">
                  {/* Auto calculated display */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-center">
                      <span className="text-[10px] text-white/50 block font-medium uppercase">Calories</span>
                      <strong className="text-xl text-amber-400 font-extrabold">{calculatedTargets.calories}</strong>
                      <span className="text-[9px] text-white/30 block mt-0.5">kcal / day</span>
                    </div>
                    <div className="rounded-xl border border-pink-500/10 bg-pink-500/5 p-3 text-center">
                      <span className="text-[10px] text-white/50 block font-medium uppercase">Protein</span>
                      <strong className="text-xl text-pink-400 font-extrabold">{calculatedTargets.protein}g</strong>
                      <span className="text-[9px] text-white/30 block mt-0.5">Muscle preservation</span>
                    </div>
                    <div className="rounded-xl border border-teal-500/10 bg-teal-500/5 p-3 text-center">
                      <span className="text-[10px] text-white/50 block font-medium uppercase">Carbs</span>
                      <strong className="text-xl text-teal-400 font-extrabold">{calculatedTargets.carbs}g</strong>
                      <span className="text-[9px] text-white/30 block mt-0.5">Energy levels</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white/[0.02] p-2 rounded-xl">
                      <span className="text-white/40 block text-[9px]">Fat</span>
                      <span className="font-bold text-teal-400">{calculatedTargets.fat}g</span>
                    </div>
                    <div className="bg-white/[0.02] p-2 rounded-xl">
                      <span className="text-white/40 block text-[9px]">Fiber</span>
                      <span className="font-bold text-emerald-400">{calculatedTargets.fiber}g</span>
                    </div>
                    <div className="bg-white/[0.02] p-2 rounded-xl">
                      <span className="text-white/40 block text-[9px]">Water</span>
                      <span className="font-bold text-sky-400">3.0 L</span>
                    </div>
                    <div className="bg-white/[0.02] p-2 rounded-xl">
                      <span className="text-white/40 block text-[9px]">Steps</span>
                      <span className="font-bold text-indigo-400">10k</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-xs flex gap-2">
                    <Info className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-white">How we calculated:</span>
                      <p className="text-white/60 leading-relaxed mt-0.5">
                        Your BMI is <strong>{calculateBMI(weight, height).toFixed(1)}</strong> ({getBMICategory(calculateBMI(weight, height))}).
                        Your computed BMR is <strong>{Math.round(calculateBMR(weight, height, age, gender))} kcal</strong>, leading to a daily expenditure (TDEE) of <strong>{Math.round(calculateTDEE(calculateBMR(weight, height, age, gender), activityLevel))} kcal</strong>. We applied your goal of <strong>{goal}</strong> to determine the daily target.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="customCal">Calories (kcal)</Label>
                    <Input id="customCal" type="number" value={customCalories} onChange={(e) => setCustomCalories(parseInt(e.target.value) || 2000)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customPro">Protein (g)</Label>
                    <Input id="customPro" type="number" value={customProtein} onChange={(e) => setCustomProtein(parseInt(e.target.value) || 130)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customCarb">Carbs (g)</Label>
                    <Input id="customCarb" type="number" value={customCarbs} onChange={(e) => setCustomCarbs(parseInt(e.target.value) || 200)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customFat">Fat (g)</Label>
                    <Input id="customFat" type="number" value={customFat} onChange={(e) => setCustomFat(parseInt(e.target.value) || 65)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customFib">Fiber (g)</Label>
                    <Input id="customFib" type="number" value={customFiber} onChange={(e) => setCustomFiber(parseInt(e.target.value) || 30)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customWat">Water (ml)</Label>
                    <Input id="customWat" type="number" value={customWater} onChange={(e) => setCustomWater(parseInt(e.target.value) || 3000)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <div className="flex items-center justify-between p-6 border-t border-white/[0.08] bg-zinc-950/90 rounded-b-2xl">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1 || loading} className="text-white/60 hover:text-white hover:bg-white/[0.04]">
            Back
          </Button>

          <Button onClick={handleNext} disabled={loading || (step === 1 && !fullName.trim())} className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 min-w-[100px] text-slate-900 font-semibold">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step === totalSteps ? (
              "Complete"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
