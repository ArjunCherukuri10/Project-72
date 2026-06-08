// Re-export database types with friendlier aliases
import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
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

export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
export type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];

export type DailySummary = Database["public"]["Tables"]["daily_summaries"]["Row"];
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
