import { z } from "zod";

// Weight Log
export const weightLogSchema = z.object({
  weight: z
    .number()
    .min(30, "Weight must be at least 30kg")
    .max(300, "Weight must be less than 300kg"),
  date: z.string().min(1, "Date is required"),
  time_recorded: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type WeightLogFormData = z.infer<typeof weightLogSchema>;

// Body Measurement
export const bodyMeasurementSchema = z.object({
  date: z.string().min(1, "Date is required"),
  waist: z.number().min(0).max(200).nullable().optional(),
  neck: z.number().min(0).max(100).nullable().optional(),
  chest: z.number().min(0).max(200).nullable().optional(),
  shoulders: z.number().min(0).max(200).nullable().optional(),
  biceps: z.number().min(0).max(100).nullable().optional(),
  forearms: z.number().min(0).max(100).nullable().optional(),
  hips: z.number().min(0).max(200).nullable().optional(),
  thighs: z.number().min(0).max(200).nullable().optional(),
  calves: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(500).optional(),
});

export type BodyMeasurementFormData = z.infer<typeof bodyMeasurementSchema>;

// Food Item
export const foodItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  serving_size: z.string().min(1, "Serving size is required"),
  calories: z.number().min(0, "Must be non-negative"),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  sugar: z.number().min(0).optional().default(0),
  sodium: z.number().min(0).optional().default(0),
  category: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type FoodItemFormData = z.infer<typeof foodItemSchema>;

// Nutrition Log
export const nutritionLogItemSchema = z.object({
  food_item_id: z.string().min(1, "Food item is required"),
  servings: z.number().min(0.1, "Must be at least 0.1"),
});

export const nutritionLogSchema = z.object({
  date: z.string().min(1),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
  items: z.array(nutritionLogItemSchema).min(1, "Add at least one item"),
});

export type NutritionLogFormData = z.infer<typeof nutritionLogSchema>;

// Workout Session
export const exerciseSetSchema = z.object({
  set_number: z.number().min(1),
  reps: z.number().min(0),
  weight: z.number().min(0),
  is_warmup: z.boolean().default(false),
});

export const workoutExerciseSchema = z.object({
  exercise_name: z.string().min(1, "Exercise name is required"),
  sets: z.array(exerciseSetSchema).min(1, "Add at least one set"),
  notes: z.string().max(500).optional(),
});

export const workoutSessionSchema = z.object({
  name: z.string().min(1, "Workout name is required"),
  type: z.string().min(1),
  date: z.string().min(1),
  duration_minutes: z.number().min(1).optional(),
  exercises: z.array(workoutExerciseSchema),
  notes: z.string().max(500).optional(),
});

export type WorkoutSessionFormData = z.infer<typeof workoutSessionSchema>;

// Cardio Session
export const cardioSessionSchema = z.object({
  date: z.string().min(1),
  type: z.string().min(1, "Activity type is required"),
  duration_minutes: z.number().min(1, "Duration must be at least 1 minute"),
  distance_km: z.number().min(0).optional(),
  calories_burned: z.number().min(0).optional(),
  avg_pace: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CardioSessionFormData = z.infer<typeof cardioSessionSchema>;

// Habit
export const habitDefinitionSchema = z.object({
  name: z.string().min(1, "Habit name is required").max(50),
  icon: z.string().optional(),
  color: z.string().optional(),
  target_frequency: z.string().default("daily"),
});

export type HabitDefinitionFormData = z.infer<typeof habitDefinitionSchema>;

// Health Metric
export const healthMetricSchema = z.object({
  date: z.string().min(1),
  metric_type: z.string().min(1, "Metric type is required"),
  value: z.number().min(0),
  unit: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export type HealthMetricFormData = z.infer<typeof healthMetricSchema>;

// Goal
export const goalSchema = z.object({
  category: z.enum(["weight", "nutrition", "workout", "habit", "health"]),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  target_value: z.number().optional(),
  current_value: z.number().optional(),
  unit: z.string().optional(),
  start_date: z.string().min(1),
  target_date: z.string().optional(),
});

export type GoalFormData = z.infer<typeof goalSchema>;

// Daily Summary
export const dailySummarySchema = z.object({
  date: z.string().min(1),
  water_ml: z.number().min(0).optional(),
  steps: z.number().min(0).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  mood: z.number().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
});

export type DailySummaryFormData = z.infer<typeof dailySummarySchema>;

// Profile
export const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  height_cm: z.number().min(100).max(250),
  goal_weight: z.number().min(30).max(300),
  starting_weight: z.number().min(30).max(300),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  activity_level: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional(),
  units: z.enum(["metric", "imperial"]).default("metric"),
  theme: z.enum(["light", "dark", "system"]).default("dark"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
