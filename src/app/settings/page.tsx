"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Sliders } from "lucide-react";
import type { Profile } from "@/types";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const [fullName, setFullName] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [heightCm, setHeightCm] = useState("");

  // Sync state with loaded profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setStartingWeight(profile.starting_weight?.toString() || "");
      setGoalWeight(profile.goal_weight?.toString() || "");
      setHeightCm(profile.height_cm?.toString() || "");
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      return trackerService.updateProfile({
        full_name: fullName,
        starting_weight: parseFloat(startingWeight) || 94.0,
        goal_weight: parseFloat(goalWeight) || 72.0,
        height_cm: parseFloat(heightCm) || 180.0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["weightLogs"] });
      toast.success("Profile settings saved successfully!");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-white/60">
          Customize configuration preferences, goals, units, export data, and profile settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Settings Card */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <User className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Configure personal parameters for goal metric curves.</CardDescription>
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
                  placeholder="Alex Mercer"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sHeight">Height (cm)</Label>
                <Input
                  id="sHeight"
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="180"
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
                  placeholder="94"
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

            <Button
              className="mt-2"
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Units / Themes & Exports Card */}
        <Card className="bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Sliders className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Units and theme configs.</CardDescription>
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
              <Button variant="outline" className="w-full text-xs">
                Export Data (JSON)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
