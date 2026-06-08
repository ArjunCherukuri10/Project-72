"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Sliders, Trash2, ShieldAlert, Sparkles, Goal } from "lucide-react";
import type { Profile } from "@/types";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: targets } = useQuery({
    queryKey: ["nutritionTargets"],
    queryFn: trackerService.getNutritionTargets,
  });

  // State fields
  const [fullName, setFullName] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [dietPreference, setDietPreference] = useState("non_vegetarian");
  const [budgetPreference, setBudgetPreference] = useState("medium");

  // Override targets state
  const [useCustomTargets, setUseCustomTargets] = useState(false);
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");

  // Sync state with loaded profile & target data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setStartingWeight(profile.starting_weight?.toString() || "");
      setGoalWeight(profile.goal_weight?.toString() || "");
      setHeightCm(profile.height_cm?.toString() || "");
      setGender(profile.gender || "male");
      setActivityLevel(profile.activity_level || "moderate");
      setDietPreference(profile.diet_preference || "non_vegetarian");
      setBudgetPreference(profile.budget_preference || "medium");
    }
    if (targets) {
      setUseCustomTargets(!!(targets as any).use_custom_targets);
      setCustomCalories(targets.calories?.toString() || "2000");
      setCustomProtein(targets.protein?.toString() || "130");
    }
  }, [profile, targets]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // 1. Save Profile
      const updatedProfile = {
        ...profile,
        full_name: fullName,
        starting_weight: parseFloat(startingWeight) || 80.0,
        goal_weight: parseFloat(goalWeight) || 72.0,
        height_cm: parseFloat(heightCm) || 175.0,
        gender: gender as any,
        activity_level: activityLevel as any,
        diet_preference: dietPreference as any,
        budget_preference: budgetPreference as any,
        has_completed_onboarding: true
      };
      await trackerService.updateProfile(updatedProfile);

      // 2. Save Target Macros
      let calorieGoal = 2000;
      let proteinGoal = 130;

      if (useCustomTargets) {
        calorieGoal = parseInt(customCalories) || 2000;
        proteinGoal = parseInt(customProtein) || 130;
      } else {
        // Mifflin-St Jeor Auto-Calculation
        const weightVal = parseFloat(startingWeight) || 80.0;
        const heightVal = parseFloat(heightCm) || 175.0;
        const dob = profile?.date_of_birth ? new Date(profile.date_of_birth) : new Date(2000, 0, 1);
        const age = Math.floor((Date.now() - dob.getTime()) / 31557600000) || 25;

        let bmr = 10 * weightVal + 6.25 * heightVal - 5 * age;
        if (gender === "male") {
          bmr += 5;
        } else {
          bmr -= 161;
        }

        const multipliers: Record<string, number> = {
          sedentary: 1.2,
          lightly_active: 1.375,
          moderate: 1.55,
          very_active: 1.725,
          extra_active: 1.9
        };
        const multiplier = multipliers[activityLevel] || 1.375;
        const tdee = Math.round(bmr * multiplier);

        // Adjust based on weight goal
        if (weightVal > (parseFloat(goalWeight) || 72.0)) {
          calorieGoal = Math.round(tdee - 500); // 500 deficit
        } else if (weightVal < (parseFloat(goalWeight) || 72.0)) {
          calorieGoal = Math.round(tdee + 300); // surplus
        } else {
          calorieGoal = tdee;
        }

        // Set safe bounds
        if (calorieGoal < 1200) calorieGoal = 1200;

        // Auto Protein goal (2.0g per kg of target weight)
        proteinGoal = Math.round((parseFloat(goalWeight) || 72) * 2.0);
      }

      await trackerService.updateNutritionTargets({
        calories: calorieGoal,
        protein: proteinGoal,
        carbs: Math.round((calorieGoal * 0.45) / 4),
        fat: Math.round((calorieGoal * 0.25) / 9),
        fiber: 30,
        water_ml: 2500,
        sleep_hours: 7.5,
        steps: 10000,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["nutritionTargets"] });
      queryClient.invalidateQueries({ queryKey: ["weightLogs"] });
      toast.success("Profile and targets saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save settings");
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-white/60 text-sm">
          Customize your bio metrics, diet goals, and custom calorie/protein limits.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Settings Card */}
        <Card className="bg-white/[0.02] border-white/[0.06] md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <User className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Configure personal details for goal metrics.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="sName">Full Name</Label>
                <Input
                  id="sName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Arjun Cherukuri"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sHeight">Height (cm)</Label>
                <Input
                  id="sHeight"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="175"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="sStartingWeight">Starting Weight (kg)</Label>
                <Input
                  id="sStartingWeight"
                  type="number"
                  value={startingWeight}
                  onChange={(e) => setStartingWeight(e.target.value)}
                  placeholder="80"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sGoalWeight">Target Weight (kg)</Label>
                <Input
                  id="sGoalWeight"
                  type="number"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  placeholder="72"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="sGender">Gender</Label>
                <select
                  id="sGender"
                  className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sActivity">Activity Factor</Label>
                <select
                  id="sActivity"
                  className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none"
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                >
                  <option value="sedentary">Sedentary (desk job)</option>
                  <option value="lightly_active">Lightly Active (1-3 days/wk)</option>
                  <option value="moderate">Moderate (3-5 days/wk)</option>
                  <option value="very_active">Very Active (6-7 days/wk)</option>
                  <option value="extra_active">Extra Active (athlete level)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t border-white/[0.04] pt-4">
              <div className="space-y-1">
                <Label htmlFor="sDiet">Dietary Preference</Label>
                <select
                  id="sDiet"
                  className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none"
                  value={dietPreference}
                  onChange={(e) => setDietPreference(e.target.value)}
                >
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="keto">Keto</option>
                  <option value="non_vegetarian">Non-Vegetarian</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sBudget">Meal Budget Preference</Label>
                <select
                  id="sBudget"
                  className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none"
                  value={budgetPreference}
                  onChange={(e) => setBudgetPreference(e.target.value)}
                >
                  <option value="low">Budget Friendly</option>
                  <option value="medium">Standard</option>
                  <option value="high">Premium / Organic</option>
                </select>
              </div>
            </div>

            <div className="border-t border-white/[0.04] pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  id="customTargets"
                  type="checkbox"
                  className="rounded border-white/[0.08] bg-black text-violet-500 focus:ring-violet-500 h-4 w-4"
                  checked={useCustomTargets}
                  onChange={(e) => setUseCustomTargets(e.target.checked)}
                />
                <Label htmlFor="customTargets" className="text-xs font-bold text-violet-300 flex items-center gap-1.5 cursor-pointer">
                  <Sparkles className="h-3.5 w-3.5" />
                  Override Daily Calorie & Protein Targets
                </Label>
              </div>

              {useCustomTargets && (
                <div className="grid gap-4 sm:grid-cols-2 bg-white/[0.01] p-3 rounded-xl border border-white/[0.06] animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <Label htmlFor="customCalories">Custom Calorie Goal (kcal)</Label>
                    <Input
                      id="customCalories"
                      type="number"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value)}
                      placeholder="1900"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customProtein">Custom Protein Goal (g)</Label>
                    <Input
                      id="customProtein"
                      type="number"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(e.target.value)}
                      placeholder="130"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              className="mt-2 w-full sm:w-auto"
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* preferences */}
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Sliders className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle>System</CardTitle>
              <CardDescription>Preferences & backups.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Unit System</Label>
              <select className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none">
                <option value="metric">Metric (kg, cm, ml)</option>
                <option value="imperial">Imperial (lbs, inches, oz)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Theme Selection</Label>
              <select className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none">
                <option value="dark">Dark Mode (Default)</option>
                <option value="light">Light Mode</option>
              </select>
            </div>

            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <Label className="text-xs font-semibold text-white/40 block">Backup Management</Label>
              <Button variant="outline" className="w-full text-xs" onClick={async () => {
                const data = await trackerService.exportAllData();
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `project72_backup_${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                toast.success("JSON backup downloaded!");
              }}>
                Export Data (JSON)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="bg-white/[0.02] border-red-500/20">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-white/50">
            This will delete all your weight logs, nutrition entries, habits, goals, and daily summaries from local storage. Fresh seed data will be generated on page reload.
          </p>
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={async () => {
              if (window.confirm("Are you sure? This will delete ALL your data and cannot be undone.")) {
                await trackerService.clearAllData();
                queryClient.clear();
                toast.success("All data cleared. Reloading...");
                setTimeout(() => window.location.reload(), 500);
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data & Reset
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
