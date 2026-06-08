"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, CheckCircle2, Flame, Droplet, Footprints, Moon, Smile, Zap } from "lucide-react";
import { trackerService } from "@/lib/services";
import { useQueryClient } from "@tanstack/react-query";

interface DailyCheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDateStr: string;
}

export default function DailyCheckinModal({ open, onOpenChange, currentDateStr }: DailyCheckinModalProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // States for checkin
  const [weight, setWeight] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [water, setWater] = useState<number>(0);
  const [steps, setSteps] = useState<string>("");
  const [sleep, setSleep] = useState<string>("");
  const [workoutCompleted, setWorkoutCompleted] = useState<boolean>(false);
  const [mood, setMood] = useState<number>(3); // 1-5
  const [energy, setEnergy] = useState<number>(3); // 1-5
  const [notes, setNotes] = useState("");

  // Load existing daily summary if any
  useEffect(() => {
    if (open) {
      let isMounted = true;
      const load = async () => {
        const summary = await trackerService.getDailySummary(currentDateStr);
        if (!isMounted) return;
        if (summary) {
          setWeight(summary.weight ? summary.weight.toString() : "");
          setCalories(summary.total_calories ? summary.total_calories.toString() : "");
          setProtein(summary.total_protein ? summary.total_protein.toString() : "");
          setWater(summary.water_ml || 0);
          setSteps(summary.steps ? summary.steps.toString() : "");
          setSleep(summary.sleep_hours ? summary.sleep_hours.toString() : "");
          setWorkoutCompleted(!!summary.workout_completed);
          setMood(summary.mood || 3);
          setEnergy(summary.energy_level || 3);
          setNotes(summary.notes || "");
        } else {
          // Reset to default
          setWeight("");
          setCalories("");
          setProtein("");
          setWater(0);
          setSteps("");
          setSleep("");
          setWorkoutCompleted(false);
          setMood(3);
          setEnergy(3);
          setNotes("");
        }
        setSuccess(false);
      };
      load();
      return () => {
        isMounted = false;
      };
    }
  }, [open, currentDateStr]);

  const handleSubmit = async () => {
    setLoading(true);
    // Mimic API delay
    await new Promise((r) => setTimeout(r, 600));

    const wVal = parseFloat(weight) || null;
    const cVal = parseInt(calories) || null;
    const pVal = parseFloat(protein) || null;
    const sVal = parseInt(steps) || null;
    const slVal = parseFloat(sleep) || null;

    // Save weight log if weight changed
    if (wVal) {
      const logs = await trackerService.getWeightLogs();
      const existing = logs.find((l) => l.date === currentDateStr);
      if (!existing || existing.weight !== wVal) {
        await trackerService.addWeightLog(wVal, currentDateStr, undefined, "Recorded via Daily Check-in");
      }
    }

    // Update Daily Summary / checkin
    await trackerService.updateDailySummaryField(currentDateStr, {
      weight: wVal,
      total_calories: cVal,
      total_protein: pVal,
      water_ml: water,
      steps: sVal,
      sleep_hours: slVal,
      workout_completed: workoutCompleted,
      mood,
      energy_level: energy,
      notes: notes || null
    });

    queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
    queryClient.invalidateQueries({ queryKey: ["weightLogs"] });

    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-zinc-950 text-white border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-base">
            <CheckCircle2 className="h-5 w-5 text-violet-400" />
            Quick Daily Check-in
          </DialogTitle>
          <DialogDescription className="text-white/40">
            Log today&apos;s stats in under 60 seconds.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
            <span className="font-bold text-sm text-white">Check-in logged!</span>
            <span className="text-xs text-white/50">Keep up the great consistency today.</span>
          </div>
        ) : (
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="checkWeight" className="text-xs text-white/60">Body Weight (kg)</Label>
                <Input id="checkWeight" placeholder="e.g. 78.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="checkSleep" className="text-xs text-white/60">Sleep (hours)</Label>
                <Input id="checkSleep" placeholder="e.g. 7.5" value={sleep} onChange={(e) => setSleep(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="checkCal" className="text-xs text-white/60">Calories (kcal)</Label>
                <Input id="checkCal" placeholder="e.g. 1950" value={calories} onChange={(e) => setCalories(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="checkPro" className="text-xs text-white/60">Protein (g)</Label>
                <Input id="checkPro" placeholder="e.g. 135" value={protein} onChange={(e) => setProtein(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="checkSteps" className="text-xs text-white/60">Steps count</Label>
                <Input id="checkSteps" placeholder="e.g. 10450" value={steps} onChange={(e) => setSteps(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>

            {/* Water incremental tracker */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-sky-400" />
                <div className="text-xs">
                  <span className="text-white block font-medium">Water Target</span>
                  <span className="text-[10px] text-white/40 font-mono">{water} ml logged</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => setWater(Math.max(0, water - 250))}>-250ml</Button>
                <Button size="sm" variant="default" className="h-7 px-2 text-[10px] bg-sky-600 hover:bg-sky-500" onClick={() => setWater(water + 250)}>+250ml</Button>
              </div>
            </div>

            {/* Workout toggle & Mood / Energy */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWorkoutCompleted(!workoutCompleted)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  workoutCompleted 
                    ? "border-violet-500 bg-violet-600/10"
                    : "border-white/[0.06] bg-white/[0.01] hover:border-white/10"
                }`}
              >
                <Plus className={`h-5 w-5 mb-1.5 transition-transform ${workoutCompleted ? "rotate-45 text-violet-400" : "text-white/40"}`} />
                <span className="text-xs font-semibold text-white">Workout Done?</span>
                <span className="text-[9px] text-white/40 mt-0.5">{workoutCompleted ? "Completed" : "Not yet"}</span>
              </button>

              <div className="space-y-3.5 rounded-xl border border-white/[0.06] bg-white/[0.01] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-white/60">
                    <Smile className="h-3.5 w-3.5 text-yellow-400" /> Mood: {mood}/5
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button key={val} type="button" className={`w-4 h-4 rounded text-[9px] font-bold ${mood === val ? "bg-yellow-400 text-black" : "bg-white/5 hover:bg-white/10"}`} onClick={() => setMood(val)}>{val}</button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-white/60">
                    <Zap className="h-3.5 w-3.5 text-orange-400" /> Energy: {energy}/5
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button key={val} type="button" className={`w-4 h-4 rounded text-[9px] font-bold ${energy === val ? "bg-orange-400 text-black" : "bg-white/5 hover:bg-white/10"}`} onClick={() => setEnergy(val)}>{val}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="checkNotes" className="text-xs text-white/60">Notes</Label>
              <textarea id="checkNotes" placeholder="How did today feel? Any reflection..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-violet-500 h-16 resize-none" />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 mt-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Check-in"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
