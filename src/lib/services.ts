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

  // Food Items — built-in nutrition database (values per 100g unless noted)
  if (!localStorage.getItem("p72_food_items")) {
    const ts = new Date().toISOString();
    const f = (id:string,name:string,srv:string,cal:number,pro:number,carb:number,fat:number,fib:number,cat:string,fav=false):FoodItem=>({id,user_id:"user-1",name,serving_size:srv,calories:cal,protein:pro,carbs:carb,fat,fiber:fib,sugar:0,sodium:0,category:cat,is_favorite:fav,notes:null,created_at:ts,updated_at:ts});
    setStorageItem("p72_food_items", [
      f("f1","Chicken Breast","per 100g",165,31,0,3.6,0,"Protein",true),
      f("f2","Egg (Whole)","per 1 egg (50g)",78,6.3,0.6,5.3,0,"Protein",true),
      f("f3","Egg White","per 1 white (33g)",17,3.6,0.2,0.1,0,"Protein"),
      f("f4","Paneer","per 100g",265,18.3,1.2,20.8,0,"Dairy",true),
      f("f5","Greek Yogurt","per 100g",59,10,3.6,0.4,0,"Dairy"),
      f("f6","Whole Milk","per 100ml",61,3.2,4.8,3.3,0,"Dairy"),
      f("f7","Whey Protein","per 1 scoop (30g)",120,25,2,1,0,"Supplement",true),
      f("f8","White Rice (Cooked)","per 100g",130,2.7,28,0.3,0.4,"Grains"),
      f("f9","Brown Rice (Cooked)","per 100g",112,2.6,24,0.9,1.8,"Grains"),
      f("f10","Chapati/Roti","per 1 piece (40g)",120,3.1,18.3,3.7,1.9,"Grains",true),
      f("f11","Oats","per 100g",389,16.9,66,6.9,10.6,"Grains"),
      f("f12","White Bread","per 1 slice (30g)",79,2.7,15,1,0.6,"Grains"),
      f("f13","Banana","per 1 medium (120g)",105,1.3,27,0.4,3.1,"Fruit"),
      f("f14","Apple","per 1 medium (180g)",95,0.5,25,0.3,4.4,"Fruit"),
      f("f15","Dal (Cooked Toor)","per 100g",128,7.6,18.5,2.7,4.2,"Legumes",true),
      f("f16","Chickpeas (Cooked)","per 100g",164,8.9,27.4,2.6,7.6,"Legumes"),
      f("f17","Moong Dal (Cooked)","per 100g",105,7.1,18.3,0.4,1.5,"Legumes"),
      f("f18","Broccoli","per 100g",34,2.8,7,0.4,2.6,"Vegetables"),
      f("f19","Spinach (Raw)","per 100g",23,2.9,3.6,0.4,2.2,"Vegetables"),
      f("f20","Sweet Potato","per 100g",86,1.6,20,0.1,3,"Vegetables"),
      f("f21","Potato (Boiled)","per 100g",87,1.9,20,0.1,1.8,"Vegetables"),
      f("f22","Salmon","per 100g",208,20,0,13,0,"Protein"),
      f("f23","Tuna (Canned)","per 100g",116,26,0,1,0,"Protein"),
      f("f24","Mutton (Cooked)","per 100g",294,25,0,21,0,"Protein"),
      f("f25","Peanut Butter","per 1 tbsp (16g)",94,4,3.5,8,0.8,"Fats"),
      f("f26","Almonds","per 100g",579,21,22,50,12.5,"Nuts"),
      f("f27","Olive Oil","per 1 tbsp (14ml)",119,0,0,14,0,"Fats"),
      f("f28","Ghee","per 1 tbsp (14g)",123,0,0,14,0,"Fats"),
      f("f29","Idli","per 1 piece (60g)",39,2,8,0.1,0.4,"Grains"),
      f("f30","Dosa (Plain)","per 1 piece (80g)",120,2.7,18,3.7,0.6,"Grains"),
    ]);
  }

  // Nutrition logs for today
  if (!localStorage.getItem("p72_nutrition_logs")) {
    const nutrition: NutritionLog[] = [
      { id: "n1", user_id: "user-1", date: todayStr, meal_type: "breakfast", created_at: new Date().toISOString() }
    ];
    const nutritionItems = [
      { id: "ni1", nutrition_log_id: "n1", food_item_id: "f2", servings: 3, calories: 234, protein: 18.9, carbs: 1.8, fat: 15.9, fiber: 0 }
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

  // Daily Summaries — generate 30 days of history so charts work
  if (!localStorage.getItem("p72_daily_summaries")) {
    const daily: DailySummary[] = [];
    for (let i = 30; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const factor = (30 - i) / 30;
      const w = parseFloat((90 - factor * 4.5 + Math.sin(i*0.7)*0.3).toFixed(1));
      daily.push({
        id: `ds-${d}`, user_id: "user-1", date: d, weight: w,
        total_calories: Math.round(1500 + Math.random()*500),
        total_protein: Math.round(100 + Math.random()*60),
        total_carbs: Math.round(120 + Math.random()*80),
        total_fat: Math.round(40 + Math.random()*30),
        total_fiber: Math.round(15 + Math.random()*15),
        water_ml: Math.round(2000 + Math.random()*1500),
        steps: Math.round(6000 + Math.random()*8000),
        sleep_hours: parseFloat((6 + Math.random()*2.5).toFixed(1)),
        workout_completed: Math.random() > 0.3,
        mood: Math.floor(3 + Math.random()*2),
        notes: null,
        compliance_score: Math.round(50 + Math.random()*45),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
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
