import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function calculateCalorieDeficit(
  currentWeight: number,
  goalWeight: number,
  weeksRemaining: number
): number {
  const kgToLose = currentWeight - goalWeight;
  const caloriesPerKg = 7700;
  const totalCalories = kgToLose * caloriesPerKg;
  return Math.round(totalCalories / (weeksRemaining * 7));
}

export function estimateGoalDate(
  currentWeight: number,
  goalWeight: number,
  weeklyLossRate: number = 0.5
): Date {
  const kgToLose = currentWeight - goalWeight;
  const weeksNeeded = kgToLose / weeklyLossRate;
  const goalDate = new Date();
  goalDate.setDate(goalDate.getDate() + weeksNeeded * 7);
  return goalDate;
}

export function getComplianceColor(percentage: number): string {
  if (percentage >= 80) return "text-emerald-500";
  if (percentage >= 50) return "text-amber-500";
  return "text-red-500";
}

export function getComplianceBg(percentage: number): string {
  if (percentage >= 80) return "bg-emerald-500/10";
  if (percentage >= 50) return "bg-amber-500/10";
  return "bg-red-500/10";
}

export function generateDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mifflin-St Jeor TDEE Calculator
 * Returns Basal Metabolic Rate in kcal/day
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: "male" | "female" = "male"
): number {
  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
}

/**
 * Calculate TDEE from BMR and activity level
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: string = "moderate"
): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
}

/**
 * Generate personalized macro targets for weight loss
 * Returns { calories, protein, carbs, fat, fiber }
 */
export function calculateMacroTargets(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: "male" | "female" = "male",
  activityLevel: string = "moderate",
  deficitPercent: number = 20
): { cal: number; pro: number; carb: number; fat: number; fib: number } {
  const bmr = calculateBMR(weightKg, heightCm, ageYears, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCal = Math.round(tdee * (1 - deficitPercent / 100));

  // Protein: 2g per kg body weight (high for muscle preservation during deficit)
  const pro = Math.round(weightKg * 2);
  // Fat: 25% of calories
  const fat = Math.round((targetCal * 0.25) / 9);
  // Carbs: remaining calories
  const carb = Math.round((targetCal - pro * 4 - fat * 9) / 4);
  // Fiber: 14g per 1000 kcal
  const fib = Math.round((targetCal / 1000) * 14);

  return { cal: targetCal, pro, carb: Math.max(carb, 50), fat, fib };
}

