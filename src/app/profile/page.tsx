"use client";

import { useEffect, useState, useMemo } from "react";
import { trackerService } from "@/lib/services";
import { Profile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateBMI, getBMICategory } from "@/lib/utils";
import {
  User,
  Calendar,
  Activity,
  Dumbbell,
  Apple,
  Edit2,
  Ruler,
  Scale,
  Briefcase,
  Layers,
  Clock,
  Heart,
  DollarSign,
  Ban,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackerService
      .getProfile()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const age = useMemo(() => {
    if (!profile?.date_of_birth) return null;
    const birthDate = new Date(profile.date_of_birth);
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      computedAge--;
    }
    return computedAge;
  }, [profile?.date_of_birth]);

  const bmi = useMemo(() => {
    if (!profile?.starting_weight || !profile?.height_cm) return null;
    return calculateBMI(profile.starting_weight, profile.height_cm);
  }, [profile?.starting_weight, profile?.height_cm]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return "";
    return getBMICategory(bmi);
  }, [bmi]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-xl font-bold text-white">No profile found</h2>
        <p className="text-white/50 max-w-sm">Please complete onboarding or configure your settings first.</p>
        <Link href="/settings">
          <Button className="bg-teal-500 text-slate-900 hover:bg-teal-400 font-semibold">
            Go to Settings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="border-white/[0.06] bg-[#161b22] text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-2xl shadow-lg">
                {getInitials(profile.full_name)}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {profile.full_name || "User Profile"}
                </h1>
                <p className="text-sm text-white/50 flex items-center justify-center md:justify-start gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Born {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString(undefined, { dateStyle: "long" }) : "N/A"}
                  {age !== null && ` (${age} years old)`}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1.5">
                  <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-400 border border-teal-500/20">
                    Active OS Member
                  </span>
                  {profile.gender && (
                    <span className="inline-flex items-center rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-white/70 border border-white/[0.06] capitalize">
                      {profile.gender}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link href="/settings">
              <Button className="bg-teal-500 text-slate-900 hover:bg-teal-400 font-semibold gap-2">
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/[0.06] text-center md:text-left">
            <div className="space-y-1">
              <span className="text-xs text-white/40 block uppercase font-medium">Height</span>
              <div className="flex items-baseline justify-center md:justify-start gap-1">
                <Ruler className="h-4 w-4 text-teal-400" />
                <span className="text-xl font-bold">{profile.height_cm || "--"}</span>
                <span className="text-xs text-white/50">cm</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-white/40 block uppercase font-medium">Starting Weight</span>
              <div className="flex items-baseline justify-center md:justify-start gap-1">
                <Scale className="h-4 w-4 text-teal-400" />
                <span className="text-xl font-bold">{profile.starting_weight || "--"}</span>
                <span className="text-xs text-white/50">kg</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-white/40 block uppercase font-medium">Goal Weight</span>
              <div className="flex items-baseline justify-center md:justify-start gap-1">
                <Scale className="h-4 w-4 text-emerald-400" />
                <span className="text-xl font-bold">{profile.goal_weight || "72"}</span>
                <span className="text-xs text-white/50">kg</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-white/40 block uppercase font-medium">Calculated BMI</span>
              <div className="flex items-baseline justify-center md:justify-start gap-1.5">
                <Activity className="h-4 w-4 text-teal-400" />
                <span className="text-xl font-bold">{bmi ? bmi.toFixed(1) : "--"}</span>
                {bmiCategory && (
                  <span className="text-[10px] text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded font-medium border border-teal-500/10">
                    {bmiCategory}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fitness Card */}
        <Card className="border-white/[0.06] bg-[#161b22] text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-teal-400" />
              <CardTitle className="text-lg">Fitness Setup</CardTitle>
            </div>
            <CardDescription className="text-white/40">Your workout scheduling preferences & constraints.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/50 flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-400/70" />
                Experience Level
              </span>
              <span className="text-sm font-semibold capitalize bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                {profile.fitness_experience || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/50 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-400/70" />
                Workouts / Week
              </span>
              <span className="text-sm font-semibold">
                {profile.workout_days_limit ? `${profile.workout_days_limit} Days` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/50 flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-400/70" />
                Workout Duration
              </span>
              <span className="text-sm font-semibold">
                {profile.workout_duration_limit ? `${profile.workout_duration_limit} mins` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/50 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-teal-400/70" />
                Equipment & Access
              </span>
              <span className="text-sm font-semibold capitalize">
                {profile.gym_access || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/50 flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-400/70" />
                Activity Multiplier
              </span>
              <span className="text-sm font-semibold capitalize">
                {profile.activity_level ? profile.activity_level.replace("_", " ") : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-white/50 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-teal-400/70" />
                Occupation
              </span>
              <span className="text-sm font-semibold">{profile.occupation || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Card */}
        <Card className="border-white/[0.06] bg-[#161b22] text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-teal-400" />
              <CardTitle className="text-lg">Nutrition & Diet</CardTitle>
            </div>
            <CardDescription className="text-white/40">Dietary preferences, restrictions, and food values.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/50 flex items-center gap-2">
                <Heart className="h-4 w-4 text-teal-400/70" />
                Diet Preference
              </span>
              <span className="text-sm font-semibold capitalize bg-teal-500/10 text-teal-400 px-2.5 py-1 rounded-lg border border-teal-500/20">
                {profile.diet_preference ? profile.diet_preference.replace("_", "-") : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/50 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-teal-400/70" />
                Budget Preference
              </span>
              <span className="text-sm font-semibold capitalize">
                {profile.budget_preference || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/50 flex items-center gap-2 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-500/80" />
                Allergies
              </span>
              <span className="text-sm font-semibold text-right max-w-[200px] break-words">
                {profile.allergies || "None declared"}
              </span>
            </div>
            <div className="flex justify-between items-start py-2">
              <span className="text-sm text-white/50 flex items-center gap-2 mt-0.5">
                <Ban className="h-4 w-4 text-rose-500/80" />
                Foods to Avoid
              </span>
              <span className="text-sm font-semibold text-right max-w-[200px] break-words">
                {profile.foods_to_avoid || "None declared"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
