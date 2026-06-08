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
