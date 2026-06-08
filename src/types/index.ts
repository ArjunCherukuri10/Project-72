// Re-export database types with friendlier aliases
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  occupation?: string | null;
  fitness_experience?: "beginner" | "intermediate" | "advanced" | null;
  workout_days_limit?: number | null;
  workout_duration_limit?: number | null;
  gym_access?: "home" | "gym" | "both" | null;
  diet_preference?: "vegetarian" | "eggetarian" | "non_vegetarian" | "vegan" | null;
  foods_to_avoid?: string | null;
  allergies?: string | null;
  budget_preference?: "low" | "medium" | "high" | null;
  has_completed_onboarding?: boolean | null;
};
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type WeightLog = Database["public"]["Tables"]["weight_logs"]["Row"];
export type WeightLogInsert = Database["public"]["Tables"]["weight_logs"]["Insert"];
export type WeightLogUpdate = Database["public"]["Tables"]["weight_logs"]["Update"];

export type BodyMeasurement = Database["public"]["Tables"]["body_measurements"]["Row"];
export type BodyMeasurementInsert = Database["public"]["Tables"]["body_measurements"]["Insert"];

export type FoodItem = Database["public"]["Tables"]["food_items"]["Row"];
export type FoodItemInsert = Database["public"]["Tables"]["food_items"]["Insert"];
export type FoodItemUpdate = Database["public"]["Tables"]["food_items"]["Update"];

export type NutritionLog = Database["public"]["Tables"]["nutrition_logs"]["Row"];
export type NutritionLogInsert = Database["public"]["Tables"]["nutrition_logs"]["Insert"];

export type NutritionLogItem = Database["public"]["Tables"]["nutrition_log_items"]["Row"];
export type NutritionLogItemInsert = Database["public"]["Tables"]["nutrition_log_items"]["Insert"];

export type WorkoutTemplate = Database["public"]["Tables"]["workout_templates"]["Row"];
export type WorkoutTemplateInsert = Database["public"]["Tables"]["workout_templates"]["Insert"];

export type TemplateExercise = Database["public"]["Tables"]["template_exercises"]["Row"];

export type WorkoutSession = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type WorkoutSessionInsert = Database["public"]["Tables"]["workout_sessions"]["Insert"];

export type WorkoutExercise = Database["public"]["Tables"]["workout_exercises"]["Row"];
export type ExerciseSet = Database["public"]["Tables"]["exercise_sets"]["Row"];
export type ExerciseSetInsert = Database["public"]["Tables"]["exercise_sets"]["Insert"];

export type CardioSession = Database["public"]["Tables"]["cardio_sessions"]["Row"];
export type CardioSessionInsert = Database["public"]["Tables"]["cardio_sessions"]["Insert"];

export type HabitDefinition = Database["public"]["Tables"]["habit_definitions"]["Row"];
export type HabitDefinitionInsert = Database["public"]["Tables"]["habit_definitions"]["Insert"];

export type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
export type HabitLogInsert = Database["public"]["Tables"]["habit_logs"]["Insert"];

export type HealthMetric = Database["public"]["Tables"]["health_metrics"]["Row"];
export type HealthMetricInsert = Database["public"]["Tables"]["health_metrics"]["Insert"];

export interface Goal {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  start_date: string;
  target_date: string | null;
  status: "active" | "completed" | "archived";
  created_at: string;
  updated_at: string;
}

export interface UserGoal {
  id: string;
  user_id: string;
  primary_goal: string;
  target_weight: number | null;
  target_date: string | null;
  recommended_date: string | null;
  recommended_weekly_change: number | null;
  recommended_deficit: number | null;
  created_at: string;
}

export interface NutritionTargets {
  id: string;
  user_id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water_ml: number;
  steps: number;
  sleep_hours: number;
  created_at: string;
  updated_at: string;
}

export interface AIWorkoutPlan {
  id: string;
  user_id: string;
  split_name: string;
  weekly_split: any;
  exercises: any;
  progression_guidance: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMealPlan {
  id: string;
  user_id: string;
  meal_plan: any;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  weight_change: number | null;
  workout_consistency: number | null;
  protein_consistency: number | null;
  calorie_adherence: number | null;
  habit_completion: number | null;
  avg_sleep: number | null;
  avg_water: number | null;
  avg_steps: number | null;
  avg_compliance_score: number | null;
  avg_calories: number | null;
  avg_protein: number | null;
  notes: string | null;
  highlights: string[] | null;
  lowlights: string[] | null;
  next_actions: string[] | null;
  ai_feedback: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  reminder_type: "protein" | "water" | "workout" | "weight";
  enabled: boolean;
  time: string | null;
  created_at: string;
}

export type DailySummary = Database["public"]["Tables"]["daily_summaries"]["Row"] & {
  energy_level?: number | null;
};
export type DailySummaryInsert = Database["public"]["Tables"]["daily_summaries"]["Insert"];
export type DailySummaryUpdate = Database["public"]["Tables"]["daily_summaries"]["Update"];

export type Milestone = Database["public"]["Tables"]["milestones"]["Row"];

// UI-specific types
export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export type WorkoutType =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "full_body"
  | "custom";

export type CardioType =
  | "walking"
  | "running"
  | "cycling"
  | "treadmill"
  | "stair_climber"
  | "swimming"
  | "custom";

export type GoalCategory =
  | "weight"
  | "nutrition"
  | "workout"
  | "habit"
  | "health";

export type HealthMetricType =
  | "blood_pressure_systolic"
  | "blood_pressure_diastolic"
  | "hba1c"
  | "fasting_glucose"
  | "vitamin_d"
  | "vitamin_b12"
  | "cholesterol"
  | "triglycerides"
  | "resting_heart_rate";

export type TimeFilter = "7d" | "30d" | "90d" | "1y" | "all";

export interface DashboardStats {
  currentWeight: number;
  goalWeight: number;
  weightLost: number;
  weightRemaining: number;
  bmi: number;
  estimatedGoalDate: Date;
  currentStreak: number;
  complianceScore: number;
  todayCalories: number;
  todayProtein: number;
  todayFiber: number;
  todayWater: number;
  todaySteps: number;
  todaySleep: number;
  workoutStatus: boolean;
}

export interface WeekProgress {
  day: string;
  compliance: number;
  weight: number | null;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  movingAvg7?: number;
  movingAvg30?: number;
}
