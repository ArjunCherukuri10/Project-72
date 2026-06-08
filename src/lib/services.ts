import {
  WeightLog,
  BodyMeasurement,
  FoodItem,
  NutritionLog,
  WorkoutSession,
  CardioSession,
  HabitDefinition,
  HabitLog,
  HealthMetric,
  Goal,
  DailySummary,
  Milestone
} from "@/types";
import { format, subDays } from "date-fns";

// Helper for local storage
const isServer = typeof window === "undefined";
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (isServer) return defaultValue;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};
const setStorageItem = <T>(key: string, value: T): void => {
  if (!isServer) localStorage.setItem(key, JSON.stringify(value));
};

// Seed initial data if empty
const initMockData = () => {
  if (isServer) return;

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Profile / Config
  if (!localStorage.getItem("p72_profile")) {
    setStorageItem("p72_profile", {
      id: "user-1",
      email: "user@project72.com",
      full_name: "Alex Mercer",
      height_cm: 180,
      starting_weight: 94,
      goal_weight: 72,
      units: "metric",
      theme: "dark",
      created_at: new Date().toISOString(),
    });
  }

  // Weight logs (simulating a path down from 94kg towards 72kg)
  if (!localStorage.getItem("p72_weight_logs")) {
    const weights: WeightLog[] = [];
    const startVal = 94.0;
    for (let i = 60; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      // Simulate gradual loss with some normal fluctuations
      const factor = (60 - i) / 60;
      const fluctuation = Math.sin(i * 0.5) * 0.4;
      const weight = parseFloat((startVal - factor * 8.5 + fluctuation).toFixed(1));
      weights.push({
        id: `w-${i}`,
        user_id: "user-1",
        weight,
        date,
        time_recorded: "07:30",
        notes: i === 60 ? "Starting my journey!" : "Consistent progress.",
        created_at: new Date().toISOString(),
      });
    }
    setStorageItem("p72_weight_logs", weights);
  }

  // Food Items
  if (!localStorage.getItem("p72_food_items")) {
    const defaultFoods: FoodItem[] = [
      { id: "f1", user_id: "user-1", name: "Chicken Breast (Cooked)", serving_size: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, category: "Protein", is_favorite: true, notes: "Meal prep staple", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "f2", user_id: "user-1", name: "White Rice (Cooked)", serving_size: "150g", calories: 195, protein: 4.3, carbs: 42, fat: 0.4, fiber: 0.6, sugar: 0.1, sodium: 2, category: "Grains", is_favorite: false, notes: "Easy carbs", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "f3", user_id: "user-1", name: "Whey Protein Isolate", serving_size: "1 scoop (30g)", calories: 120, protein: 25, carbs: 2, fat: 1, fiber: 0, sugar: 1, sodium: 50, category: "Supplements", is_favorite: true, notes: "Post workout", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "f4", user_id: "user-1", name: "Whole Egg", serving_size: "1 large (50g)", calories: 70, protein: 6, carbs: 0.6, fat: 5, fiber: 0, sugar: 0, sodium: 70, category: "Protein", is_favorite: true, notes: "Breakfast essential", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "f5", user_id: "user-1", name: "Broccoli", serving_size: "100g", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33, category: "Vegetables", is_favorite: false, notes: "Micronutrients", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];
    setStorageItem("p72_food_items", defaultFoods);
  }

  // Nutrition logs for today
  if (!localStorage.getItem("p72_nutrition_logs")) {
    const nutrition: NutritionLog[] = [
      { id: "n1", user_id: "user-1", date: todayStr, meal_type: "breakfast", created_at: new Date().toISOString() }
    ];
    const nutritionItems = [
      { id: "ni1", nutrition_log_id: "n1", food_item_id: "f4", servings: 3, calories: 210, protein: 18, carbs: 1.8, fat: 15, fiber: 0 }
    ];
    setStorageItem("p72_nutrition_logs", nutrition);
    setStorageItem("p72_nutrition_log_items", nutritionItems);
  }

  // Habits Definitions
  if (!localStorage.getItem("p72_habit_definitions")) {
    const defaultHabits: HabitDefinition[] = [
      { id: "h1", user_id: "user-1", name: "Workout", icon: "💪", color: "violet", target_frequency: "daily", is_active: true, sort_order: 1, created_at: new Date().toISOString() },
      { id: "h2", user_id: "user-1", name: "10k Steps", icon: "🚶", color: "indigo", target_frequency: "daily", is_active: true, sort_order: 2, created_at: new Date().toISOString() },
      { id: "h3", user_id: "user-1", name: "Protein Goal (150g)", icon: "🥩", color: "rose", target_frequency: "daily", is_active: true, sort_order: 3, created_at: new Date().toISOString() },
      { id: "h4", user_id: "user-1", name: "Water Goal (3L)", icon: "💧", color: "sky", target_frequency: "daily", is_active: true, sort_order: 4, created_at: new Date().toISOString() },
      { id: "h5", user_id: "user-1", name: "No Junk Food", icon: "🍔", color: "amber", target_frequency: "daily", is_active: true, sort_order: 5, created_at: new Date().toISOString() },
    ];
    setStorageItem("p72_habit_definitions", defaultHabits);
  }

  // Habits logs today
  if (!localStorage.getItem("p72_habit_logs")) {
    const defaultLogs: HabitLog[] = [
      { id: "hl1", habit_id: "h2", user_id: "user-1", date: todayStr, completed: true, notes: null, created_at: new Date().toISOString() },
      { id: "hl2", habit_id: "h4", user_id: "user-1", date: todayStr, completed: true, notes: null, created_at: new Date().toISOString() },
    ];
    setStorageItem("p72_habit_logs", defaultLogs);
  }

  // Daily Summaries
  if (!localStorage.getItem("p72_daily_summaries")) {
    const daily: DailySummary[] = [
      {
        id: `ds-${todayStr}`,
        user_id: "user-1",
        date: todayStr,
        weight: 85.5,
        total_calories: 1420,
        total_protein: 110,
        total_carbs: 125,
        total_fat: 45,
        total_fiber: 18,
        water_ml: 3000,
        steps: 10450,
        sleep_hours: 7.8,
        workout_completed: true,
        mood: 4,
        notes: "Feeling solid today.",
        compliance_score: 80,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    setStorageItem("p72_daily_summaries", daily);
  }

  // Goals
  if (!localStorage.getItem("p72_goals")) {
    const goals: Goal[] = [
      { id: "g1", user_id: "user-1", category: "weight", title: "Target Weight 72kg", description: "Primary fat loss phase goal", target_value: 72, current_value: 85.5, unit: "kg", start_date: "2026-04-01", target_date: "2026-09-01", status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "g2", user_id: "user-1", category: "nutrition", title: "Maintain Daily Deficit", description: "Keep calories under 1800", target_value: 1800, current_value: 1420, unit: "kcal", start_date: "2026-04-01", target_date: null, status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    setStorageItem("p72_goals", goals);
  }
};

// Execute init on load
initMockData();

// Service APIs
export const trackerService = {
  // Profile
  getProfile: () => getStorageItem("p72_profile", null),
  updateProfile: (data: any) => {
    const current = getStorageItem("p72_profile", {});
    const updated = { ...current, ...data, updated_at: new Date().toISOString() };
    setStorageItem("p72_profile", updated);
    return updated;
  },

  // Weight Logs
  getWeightLogs: (): WeightLog[] => {
    return getStorageItem<WeightLog[]>("p72_weight_logs", []).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
  addWeightLog: (weight: number, date: string, time?: string, notes?: string) => {
    const logs = getStorageItem<WeightLog[]>("p72_weight_logs", []);
    const newLog: WeightLog = {
      id: `w-${Date.now()}`,
      user_id: "user-1",
      weight,
      date,
      time_recorded: time || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };
    logs.push(newLog);
    setStorageItem("p72_weight_logs", logs);

    // Update Daily Summary
    trackerService.updateDailySummaryField(date, { weight });
    return newLog;
  },

  // Food Database
  getFoodItems: (): FoodItem[] => getStorageItem<FoodItem[]>("p72_food_items", []),
  addFoodItem: (item: Omit<FoodItem, "id" | "user_id" | "created_at" | "updated_at">) => {
    const items = getStorageItem<FoodItem[]>("p72_food_items", []);
    const newItem: FoodItem = {
      ...item,
      id: `f-${Date.now()}`,
      user_id: "user-1",
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    items.push(newItem);
    setStorageItem("p72_food_items", items);
    return newItem;
  },
  toggleFoodFavorite: (id: string) => {
    const items = getStorageItem<FoodItem[]>("p72_food_items", []);
    const updated = items.map((i) =>
      i.id === id ? { ...i, is_favorite: !i.is_favorite } : i
    );
    setStorageItem("p72_food_items", updated);
  },

  // Nutrition Logs
  getNutritionLogsToday: (date: string) => {
    const logs = getStorageItem<NutritionLog[]>("p72_nutrition_logs", []);
    const logItems = getStorageItem<any[]>("p72_nutrition_log_items", []);
    const foods = trackerService.getFoodItems();

    const filteredLogs = logs.filter((l) => l.date === date);
    return filteredLogs.map((l) => {
      const items = logItems
        .filter((item) => item.nutrition_log_id === l.id)
        .map((item) => {
          const food = foods.find((f) => f.id === item.food_item_id);
          return { ...item, food };
        });
      return { ...l, items };
    });
  },
  addMealItem: (date: string, mealType: "breakfast" | "lunch" | "dinner" | "snacks", foodItemId: string, servings: number) => {
    const logs = getStorageItem<NutritionLog[]>("p72_nutrition_logs", []);
    const logItems = getStorageItem<any[]>("p72_nutrition_log_items", []);
    const foods = trackerService.getFoodItems();

    const food = foods.find((f) => f.id === foodItemId);
    if (!food) return;

    let log = logs.find((l) => l.date === date && l.meal_type === mealType);
    if (!log) {
      log = {
        id: `n-${Date.now()}`,
        user_id: "user-1",
        date,
        meal_type: mealType,
        created_at: new Date().toISOString(),
      };
      logs.push(log);
      setStorageItem("p72_nutrition_logs", logs);
    }

    const newItem = {
      id: `ni-${Date.now()}`,
      nutrition_log_id: log.id,
      food_item_id: foodItemId,
      servings,
      calories: Math.round(food.calories * servings),
      protein: Math.round(food.protein * servings),
      carbs: Math.round(food.carbs * servings),
      fat: Math.round(food.fat * servings),
      fiber: Math.round(food.fiber * servings),
      created_at: new Date().toISOString(),
    };

    logItems.push(newItem);
    setStorageItem("p72_nutrition_log_items", logItems);

    // Update Daily summary macros
    const allLogsToday = trackerService.getNutritionLogsToday(date);
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    allLogsToday.forEach((l) => {
      l.items.forEach((item: any) => {
        totalCalories += item.calories;
        totalProtein += item.protein;
        totalCarbs += item.carbs;
        totalFat += item.fat;
        totalFiber += item.fiber;
      });
    });

    trackerService.updateDailySummaryField(date, {
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
      total_fiber: totalFiber,
    });
  },

  // Habits Definitions & Logs
  getHabitDefinitions: (): HabitDefinition[] => getStorageItem<HabitDefinition[]>("p72_habit_definitions", []),
  getHabitLogs: (date: string): HabitLog[] => {
    const logs = getStorageItem<HabitLog[]>("p72_habit_logs", []);
    return logs.filter((l) => l.date === date);
  },
  toggleHabit: (habitId: string, date: string) => {
    const logs = getStorageItem<HabitLog[]>("p72_habit_logs", []);
    const index = logs.findIndex((l) => l.habit_id === habitId && l.date === date);

    if (index > -1) {
      logs[index].completed = !logs[index].completed;
    } else {
      logs.push({
        id: `hl-${Date.now()}`,
        habit_id: habitId,
        user_id: "user-1",
        date,
        completed: true,
        notes: null,
        created_at: new Date().toISOString(),
      });
    }

    setStorageItem("p72_habit_logs", logs);

    // Calculate habit compliance for daily summary score
    const defs = trackerService.getHabitDefinitions();
    const logsToday = logs.filter((l) => l.date === date && l.completed);
    const score = defs.length > 0 ? Math.round((logsToday.length / defs.length) * 100) : 0;
    trackerService.updateDailySummaryField(date, { compliance_score: score });
  },

  // Workouts
  getWorkouts: (): WorkoutSession[] => getStorageItem<WorkoutSession[]>("p72_workout_sessions", []),
  addWorkoutSession: (session: Omit<WorkoutSession, "id" | "user_id" | "created_at">) => {
    const sessions = getStorageItem<WorkoutSession[]>("p72_workout_sessions", []);
    const newSession: WorkoutSession = {
      ...session,
      id: `w-${Date.now()}`,
      user_id: "user-1",
      created_at: new Date().toISOString(),
    };
    sessions.push(newSession);
    setStorageItem("p72_workout_sessions", sessions);

    trackerService.updateDailySummaryField(session.date, { workout_completed: true });
    return newSession;
  },

  // Cardio Tracker
  getCardioSessions: (): CardioSession[] => getStorageItem<CardioSession[]>("p72_cardio_sessions", []),
  addCardioSession: (session: Omit<CardioSession, "id" | "user_id" | "created_at">) => {
    const sessions = getStorageItem<CardioSession[]>("p72_cardio_sessions", []);
    const newSession: CardioSession = {
      ...session,
      id: `c-${Date.now()}`,
      user_id: "user-1",
      created_at: new Date().toISOString(),
    };
    sessions.push(newSession);
    setStorageItem("p72_cardio_sessions", sessions);
    return newSession;
  },

  // Goals
  getGoals: (): Goal[] => getStorageItem<Goal[]>("p72_goals", []),
  addGoal: (goal: Omit<Goal, "id" | "user_id" | "created_at" | "updated_at" | "status">) => {
    const goals = getStorageItem<Goal[]>("p72_goals", []);
    const newGoal: Goal = {
      ...goal,
      id: `g-${Date.now()}`,
      user_id: "user-1",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    goals.push(newGoal);
    setStorageItem("p72_goals", goals);
    return newGoal;
  },

  // Health Metrics
  getHealthMetrics: (): HealthMetric[] => getStorageItem<HealthMetric[]>("p72_health_metrics", []),
  addHealthMetric: (metric: Omit<HealthMetric, "id" | "user_id" | "created_at">) => {
    const metrics = getStorageItem<HealthMetric[]>("p72_health_metrics", []);
    const newMetric: HealthMetric = {
      ...metric,
      id: `hm-${Date.now()}`,
      user_id: "user-1",
      created_at: new Date().toISOString(),
    };
    metrics.push(newMetric);
    setStorageItem("p72_health_metrics", metrics);
    return newMetric;
  },

  // Daily Summary update engine
  getDailySummary: (date: string): DailySummary | null => {
    const daily = getStorageItem<DailySummary[]>("p72_daily_summaries", []);
    return daily.find((d) => d.date === date) || null;
  },
  getDailySummaries: (): DailySummary[] => getStorageItem<DailySummary[]>("p72_daily_summaries", []),
  updateDailySummaryField: (date: string, fields: Partial<DailySummary>) => {
    const daily = getStorageItem<DailySummary[]>("p72_daily_summaries", []);
    const index = daily.findIndex((d) => d.date === date);

    if (index > -1) {
      daily[index] = {
        ...daily[index],
        ...fields,
        updated_at: new Date().toISOString(),
      };
    } else {
      daily.push({
        id: `ds-${date}`,
        user_id: "user-1",
        date,
        weight: null,
        total_calories: null,
        total_protein: null,
        total_carbs: null,
        total_fat: null,
        total_fiber: null,
        water_ml: null,
        steps: null,
        sleep_hours: null,
        workout_completed: false,
        mood: null,
        notes: null,
        compliance_score: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...fields,
      });
    }
    setStorageItem("p72_daily_summaries", daily);
  },
};
