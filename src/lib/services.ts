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
  UserGoal,
  DailySummary,
  Milestone,
  NutritionTargets,
  AIWorkoutPlan,
  AICardioPlan,
  AIWorkoutAnalysis,
  AIMealPlan,
  WeeklyReview,
  Reminder,
  Profile,
} from "@/types";
import { format, subDays } from "date-fns";
import { createClient } from "./supabase/client";

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

// Seed reference data only (food database + blank profile)
const initReferenceData = () => {
  if (isServer) return;

  // Blank profile — user fills in their own details in Settings
  if (!localStorage.getItem("p72_profile")) {
    setStorageItem("p72_profile", {
      id: "user-1",
      email: "",
      full_name: "",
      height_cm: null,
      starting_weight: null,
      goal_weight: null,
      date_of_birth: null,
      gender: null,
      activity_level: "moderate",
      units: "metric",
      theme: "dark",
      created_at: new Date().toISOString(),
    });
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
};

// Execute init on load
initReferenceData();

// Lazy Supabase client getter to avoid server-side render issues
const getSupabase = (): any => {
  if (typeof window === "undefined") return null;
  return createClient();
};

const getUserId = async (): Promise<string | null> => {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: { session } } = await sb.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
};

// Service APIs
export const trackerService = {
  // Profile
  getProfile: async (): Promise<Profile | null> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data, error } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) {
        console.error("Error getting profile:", error);
      }
      if (data) {
        return data;
      }
      // If profile is missing (e.g. signup trigger didn't run or local db sync issue),
      // auto-create profile to avoid foreign key violations in other tables
      try {
        const { data: { session } } = await sb.auth.getSession();
        const email = session?.user?.email || `user_${uid}@example.com`;
        const fullName = session?.user?.user_metadata?.full_name || "";
        const avatarUrl = session?.user?.user_metadata?.avatar_url || "";
        
        const newProfile = {
          id: uid,
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          goal_weight: 72.00,
          starting_weight: 94.00,
          units: "metric",
          theme: "dark",
          primary_goal: "Lose Weight",
          target_date: null,
          recommended_date: null,
          recommended_weekly_change: 0.5,
          recommended_deficit: 500,
        };

        const { data: inserted, error: insertError } = await sb
          .from("profiles")
          .insert(newProfile)
          .select("*")
          .maybeSingle();

        if (insertError) {
          console.error("Error auto-creating profile:", insertError);
        } else if (inserted) {
          return inserted;
        }
      } catch (e) {
        console.error("Failed to auto-create profile:", e);
      }
    }
    return getStorageItem<Profile | null>("p72_profile", null);
  },
  updateProfile: async (data: any) => {
    const uid = await getUserId();
    const cleanData = { ...data };
    
    // Map age to date_of_birth if present and date_of_birth not already provided
    if (cleanData.age !== undefined && !cleanData.date_of_birth) {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - Number(cleanData.age);
      cleanData.date_of_birth = `${birthYear}-01-01`;
    }
    delete cleanData.age;

    if (uid) {
      const sb = getSupabase()!;
      delete cleanData.id;
      delete cleanData.email;
      delete cleanData.created_at;

      const { data: updated, error } = await sb
        .from("profiles")
        .update({ ...cleanData, updated_at: new Date().toISOString() })
        .eq("id", uid)
        .select()
        .single();
      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      return updated;
    }
    const current = getStorageItem("p72_profile", {});
    const updated = { ...current, ...cleanData, updated_at: new Date().toISOString() };
    setStorageItem("p72_profile", updated);
    return updated;
  },

  // Weight Logs
  getWeightLogs: async (): Promise<WeightLog[]> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data, error } = await sb.from("weight_logs").select("*").eq("user_id", uid).order("date", { ascending: false });
      if (error) {
        console.error("Error getting weight logs:", error);
      }
      return data || [];
    }
    return getStorageItem<WeightLog[]>("p72_weight_logs", []).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
  addWeightLog: async (weight: number, date: string, time?: string, notes?: string) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const newLog = {
        user_id: uid,
        weight,
        date,
        time_recorded: time || null,
        notes: notes || null,
      };
      const { data, error } = await sb.from("weight_logs").insert(newLog).select().single();
      if (error) {
        console.error("Error adding weight log:", error);
        throw error;
      }
      await trackerService.updateDailySummaryField(date, { weight });
      return data;
    }
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
    await trackerService.updateDailySummaryField(date, { weight });
    return newLog;
  },
  updateWeightLog: async (id: string, data: { weight?: number; date?: string; time_recorded?: string | null; notes?: string | null }) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { error } = await sb.from("weight_logs").update(data).eq("id", id).eq("user_id", uid);
      if (error) throw error;
      return;
    }
    const logs = getStorageItem<WeightLog[]>("p72_weight_logs", []);
    const idx = logs.findIndex((l) => l.id === id);
    if (idx > -1) {
      logs[idx] = { ...logs[idx], ...data };
      setStorageItem("p72_weight_logs", logs);
    }
  },
  deleteWeightLog: async (id: string) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { error } = await sb.from("weight_logs").delete().eq("id", id).eq("user_id", uid);
      if (error) throw error;
      return;
    }
    const logs = getStorageItem<WeightLog[]>("p72_weight_logs", []);
    setStorageItem("p72_weight_logs", logs.filter((l) => l.id !== id));
  },

  // Aliases used by nutrition page
  getMealLogs: async (date: string) => trackerService.getNutritionLogsToday(date),
  searchFoods: async (query: string): Promise<FoodItem[]> => {
    const items = await trackerService.getFoodItems();
    const q = query.toLowerCase();
    return items.filter((f) => f.name.toLowerCase().includes(q));
  },
  deleteMealLogItem: async (itemId: string) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data: item } = await sb.from("nutrition_log_items").select("*, nutrition_logs(date)").eq("id", itemId).maybeSingle();
      if (item) {
        const date = (item.nutrition_logs as any)?.date;
        await sb.from("nutrition_log_items").delete().eq("id", itemId);
        if (date) {
          await trackerService.recalculateDailyNutrition(date);
        }
      }
      return;
    }
    const logItems = getStorageItem<any[]>("p72_nutrition_log_items", []);
    const item = logItems.find((i) => i.id === itemId);
    const filtered = logItems.filter((i) => i.id !== itemId);
    setStorageItem("p72_nutrition_log_items", filtered);
    if (item) {
      const logs = getStorageItem<any[]>("p72_nutrition_logs", []);
      const log = logs.find((l) => l.id === item.nutrition_log_id);
      if (log) {
        await trackerService.deleteMealItem(itemId, log.date);
      }
    }
  },

  // Food Database
  getFoodItems: async (): Promise<FoodItem[]> => {
    const uid = await getUserId();
    const localFoods = getStorageItem<FoodItem[]>("p72_food_items", []);
    if (uid) {
      const sb = getSupabase()!;
      const { data, error } = await sb.from("food_items").select("*").eq("user_id", uid);
      if (error) {
        console.error("Error getting food items:", error);
      }
      const dbFoods = data || [];
      const dbFoodNames = new Set(dbFoods.map((f: any) => f.name.toLowerCase()));
      const combined = [...dbFoods, ...localFoods.filter(lf => !dbFoodNames.has(lf.name.toLowerCase()))];
      return combined;
    }
    return localFoods;
  },
  addFoodItem: async (item: Omit<FoodItem, "id" | "user_id" | "created_at" | "updated_at">) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const newItem = {
        ...item,
        user_id: uid,
        is_favorite: false,
      };
      const { data, error } = await sb.from("food_items").insert(newItem).select().single();
      if (error) {
        console.error("Error adding food item:", error);
        throw error;
      }
      return data;
    }
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
  toggleFoodFavorite: async (id: string) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data: current } = await sb.from("food_items").select("is_favorite").eq("id", id).eq("user_id", uid).maybeSingle();
      if (current) {
        await sb.from("food_items").update({ is_favorite: !current.is_favorite }).eq("id", id).eq("user_id", uid);
      } else {
        const localFoods = getStorageItem<FoodItem[]>("p72_food_items", []);
        const food = localFoods.find(f => f.id === id);
        if (food) {
          const newItem = {
            name: food.name,
            serving_size: food.serving_size,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            fiber: food.fiber,
            sugar: food.sugar,
            sodium: food.sodium,
            category: food.category,
            is_favorite: true,
            user_id: uid
          };
          await sb.from("food_items").insert(newItem);
        }
      }
      return;
    }
    const items = getStorageItem<FoodItem[]>("p72_food_items", []);
    const updated = items.map((i) =>
      i.id === id ? { ...i, is_favorite: !i.is_favorite } : i
    );
    setStorageItem("p72_food_items", updated);
  },

  // Nutrition Logs
  getNutritionLogsToday: async (date: string) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data: logs } = await sb.from("nutrition_logs").select("*").eq("user_id", uid).eq("date", date);
      if (!logs || logs.length === 0) return [];
      
      const logIds = logs.map((l: any) => l.id);
      const { data: logItems } = await sb.from("nutrition_log_items").select("*, food:food_items(*)").in("nutrition_log_id", logIds);
      
      return logs.map((l: any) => {
        const items = (logItems || [])
          .filter((item: any) => item.nutrition_log_id === l.id)
          .map((item: any) => {
            return {
              ...item,
              food: item.food || { name: "Custom Item" }
            };
          });
        return { ...l, items };
      });
    }

    const logs = getStorageItem<NutritionLog[]>("p72_nutrition_logs", []);
    const logItems = getStorageItem<any[]>("p72_nutrition_log_items", []);
    const foods = await trackerService.getFoodItems();

    const filteredLogs = logs.filter((l) => l.date === date);
    return filteredLogs.map((l) => {
      const items = logItems
        .filter((item) => item.nutrition_log_id === l.id)
        .map((item) => {
          const food = foods.find((f) => f.id === item.food_item_id);
          return { ...item, food: food || item.food };
        });
      return { ...l, items };
    });
  },
  addMealItem: async (
    date: string,
    mealType: "breakfast" | "lunch" | "dinner" | "snacks",
    foodItemId: string,
    servings: number,
    customItem?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      food?: { name: string };
    }
  ) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      let { data: log } = await sb.from("nutrition_logs").select("*").eq("user_id", uid).eq("date", date).eq("meal_type", mealType).maybeSingle();
      if (!log) {
        const { data: newLog, error: logErr } = await sb.from("nutrition_logs").insert({
          user_id: uid,
          date,
          meal_type: mealType
        }).select().single();
        if (logErr) throw logErr;
        log = newLog;
      }
      
      let foodName = "";
      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;
      let fiber = 0;
      let dbFoodId = foodItemId;

      if (customItem) {
        foodName = customItem.food?.name || "Custom Food";
        calories = customItem.calories;
        protein = customItem.protein;
        carbs = customItem.carbs;
        fat = customItem.fat;
        fiber = customItem.fiber;
        
        const { data: tempFood } = await sb.from("food_items").insert({
          user_id: uid,
          name: foodName,
          serving_size: "1 serving",
          calories,
          protein,
          carbs,
          fat,
          fiber,
          category: "Custom"
        }).select().single();
        if (tempFood) {
          dbFoodId = tempFood.id;
        }
      } else {
        const foods = await trackerService.getFoodItems();
        const food = foods.find((f) => f.id === foodItemId);
        if (!food) return;
        foodName = food.name;
        calories = Math.round(food.calories * servings);
        protein = Math.round(food.protein * servings);
        carbs = Math.round(food.carbs * servings);
        fat = Math.round(food.fat * servings);
        fiber = Math.round(food.fiber * servings);
        
        if (foodItemId.startsWith("f")) {
          const { data: dbFood } = await sb.from("food_items").insert({
            user_id: uid,
            name: food.name,
            serving_size: food.serving_size,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            fiber: food.fiber,
            category: food.category
          }).select().single();
          if (dbFood) {
            dbFoodId = dbFood.id;
          }
        }
      }

      const newItem = {
        nutrition_log_id: log.id,
        food_item_id: dbFoodId,
        servings,
        calories,
        protein,
        carbs,
        fat,
        fiber
      };
      
      await sb.from("nutrition_log_items").insert(newItem);
      await trackerService.recalculateDailyNutrition(date);
      return;
    }

    const logs = getStorageItem<NutritionLog[]>("p72_nutrition_logs", []);
    const logItems = getStorageItem<any[]>("p72_nutrition_log_items", []);

    let foodName = "";
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;

    if (customItem) {
      foodName = customItem.food?.name || "Custom Food";
      calories = customItem.calories;
      protein = customItem.protein;
      carbs = customItem.carbs;
      fat = customItem.fat;
      fiber = customItem.fiber;
    } else {
      const foods = await trackerService.getFoodItems();
      const food = foods.find((f) => f.id === foodItemId);
      if (!food) return;
      foodName = food.name;
      calories = Math.round(food.calories * servings);
      protein = Math.round(food.protein * servings);
      carbs = Math.round(food.carbs * servings);
      fat = Math.round(food.fat * servings);
      fiber = Math.round(food.fiber * servings);
    }

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
      calories,
      protein,
      carbs,
      fat,
      fiber,
      created_at: new Date().toISOString(),
    };

    if (customItem) {
      (newItem as any).food = { name: foodName };
    }

    logItems.push(newItem);
    setStorageItem("p72_nutrition_log_items", logItems);
    await trackerService.recalculateDailyNutrition(date);
  },
  deleteMealItem: async (itemId: string, date: string) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      await sb.from("nutrition_log_items").delete().eq("id", itemId);
      await trackerService.recalculateDailyNutrition(date);
      return;
    }
    const logItems = getStorageItem<any[]>("p72_nutrition_log_items", []);
    const filtered = logItems.filter((i) => i.id !== itemId);
    setStorageItem("p72_nutrition_log_items", filtered);
    await trackerService.recalculateDailyNutrition(date);
  },
  recalculateDailyNutrition: async (date: string) => {
    const allLogsToday = await trackerService.getNutritionLogsToday(date);
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    allLogsToday.forEach((l: any) => {
      l.items.forEach((item: any) => {
        totalCalories += item.calories;
        totalProtein += item.protein;
        totalCarbs += item.carbs;
        totalFat += item.fat;
        totalFiber += item.fiber;
      });
    });

    await trackerService.updateDailySummaryField(date, {
      total_calories: Math.round(totalCalories),
      total_protein: Math.round(totalProtein * 10) / 10,
      total_carbs: Math.round(totalCarbs * 10) / 10,
      total_fat: Math.round(totalFat * 10) / 10,
      total_fiber: Math.round(totalFiber * 10) / 10,
    });
  },

  // Clear all Project 72 data
  clearAllData: async () => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      await sb.from("weight_logs").delete().eq("user_id", uid);
      await sb.from("nutrition_logs").delete().eq("user_id", uid);
      await sb.from("habit_logs").delete().eq("user_id", uid);
      await sb.from("workout_sessions").delete().eq("user_id", uid);
      await sb.from("cardio_sessions").delete().eq("user_id", uid);
      await sb.from("goals").delete().eq("user_id", uid);
      await sb.from("health_metrics").delete().eq("user_id", uid);
      await sb.from("daily_summaries").delete().eq("user_id", uid);
      await sb.from("nutrition_targets").delete().eq("user_id", uid);
      await sb.from("ai_workout_plans").delete().eq("user_id", uid);
      await sb.from("ai_meal_plans").delete().eq("user_id", uid);
      await sb.from("weekly_reviews").delete().eq("user_id", uid);
      await sb.from("reminders").delete().eq("user_id", uid);
      
      await sb.from("profiles").update({
        height_cm: null,
        starting_weight: null,
        goal_weight: null,
        date_of_birth: null,
        gender: null,
        activity_level: "moderate",
        units: "metric",
        theme: "dark",
        has_completed_onboarding: false,
        updated_at: new Date().toISOString()
      }).eq("id", uid);
    }

    if (isServer) return;
    const keys = [
      "p72_profile", "p72_weight_logs", "p72_food_items",
      "p72_nutrition_logs", "p72_nutrition_log_items",
      "p72_habit_definitions", "p72_habit_logs",
      "p72_daily_summaries", "p72_goals",
      "p72_workout_sessions", "p72_cardio_sessions",
      "p72_health_metrics", "p72_body_measurements",
      "p72_nutrition_targets", "p72_ai_workout_plan",
      "p72_ai_cardio_plan", "p72_ai_workout_analysis", "p72_ai_meal_plan", "p72_weekly_reviews",
      "p72_reminders"
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  },

  // Habits Definitions & Logs
  getHabitDefinitions: async (): Promise<HabitDefinition[]> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("habit_definitions").select("*").eq("user_id", uid).order("sort_order", { ascending: true });
      return data || [];
    }
    return getStorageItem<HabitDefinition[]>("p72_habit_definitions", []);
  },
  getHabitLogs: async (date: string): Promise<HabitLog[]> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("habit_logs").select("*").eq("user_id", uid).eq("date", date);
      return data || [];
    }
    const logs = getStorageItem<HabitLog[]>("p72_habit_logs", []);
    return logs.filter((l) => l.date === date);
  },
  toggleHabit: async (habitId: string, date: string) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data: existing } = await sb.from("habit_logs").select("*").eq("user_id", uid).eq("habit_id", habitId).eq("date", date).maybeSingle();
      if (existing) {
        await sb.from("habit_logs").update({ completed: !existing.completed }).eq("id", existing.id);
      } else {
        await sb.from("habit_logs").insert({
          user_id: uid,
          habit_id: habitId,
          date,
          completed: true,
        });
      }
      
      const defs = await trackerService.getHabitDefinitions();
      const logs = await trackerService.getHabitLogs(date);
      const completedCount = logs.filter(l => l.completed).length;
      const score = defs.length > 0 ? Math.round((completedCount / defs.length) * 100) : 0;
      await trackerService.updateDailySummaryField(date, { compliance_score: score });
      return;
    }

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

    const defs = await trackerService.getHabitDefinitions();
    const logsToday = logs.filter((l) => l.date === date && l.completed);
    const score = defs.length > 0 ? Math.round((logsToday.length / defs.length) * 100) : 0;
    await trackerService.updateDailySummaryField(date, { compliance_score: score });
  },

  // Workouts
  getWorkouts: async (): Promise<WorkoutSession[]> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("workout_sessions").select("*").eq("user_id", uid).order("date", { ascending: false });
      return data || [];
    }
    return getStorageItem<WorkoutSession[]>("p72_workout_sessions", []);
  },
  addWorkoutSession: async (session: Omit<WorkoutSession, "id" | "user_id" | "created_at">) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data, error } = await sb.from("workout_sessions").insert({
        ...session,
        user_id: uid
      }).select().single();
      if (error) throw error;
      await trackerService.updateDailySummaryField(session.date, { workout_completed: true });
      return data;
    }
    const sessions = getStorageItem<WorkoutSession[]>("p72_workout_sessions", []);
    const newSession: WorkoutSession = {
      ...session,
      id: `w-${Date.now()}`,
      user_id: "user-1",
      created_at: new Date().toISOString(),
    };
    sessions.push(newSession);
    setStorageItem("p72_workout_sessions", sessions);

    await trackerService.updateDailySummaryField(session.date, { workout_completed: true });
    return newSession;
  },
  updateWorkoutSession: async (id: string, data: { name?: string; type?: string; date?: string; duration_minutes?: number | null; notes?: string | null; completed?: boolean }) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { error } = await sb.from("workout_sessions").update(data).eq("id", id).eq("user_id", uid);
      if (error) throw error;
      return;
    }
    const sessions = getStorageItem<WorkoutSession[]>("p72_workout_sessions", []);
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx > -1) {
      sessions[idx] = { ...sessions[idx], ...data };
      setStorageItem("p72_workout_sessions", sessions);
    }
  },
  deleteWorkoutSession: async (id: string) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { error } = await sb.from("workout_sessions").delete().eq("id", id).eq("user_id", uid);
      if (error) throw error;
      return;
    }
    const sessions = getStorageItem<WorkoutSession[]>("p72_workout_sessions", []);
    setStorageItem("p72_workout_sessions", sessions.filter((s) => s.id !== id));
  },

  // Cardio Tracker
  getCardioSessions: async (): Promise<CardioSession[]> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("cardio_sessions").select("*").eq("user_id", uid).order("date", { ascending: false });
      return data || [];
    }
    return getStorageItem<CardioSession[]>("p72_cardio_sessions", []);
  },
  addCardioSession: async (session: Omit<CardioSession, "id" | "user_id" | "created_at">) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data, error } = await sb.from("cardio_sessions").insert({
        ...session,
        user_id: uid
      }).select().single();
      if (error) throw error;
      return data;
    }
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
  updateCardioSession: async (id: string, data: Partial<Omit<CardioSession, "id" | "user_id" | "created_at">>) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { error } = await sb.from("cardio_sessions").update(data).eq("id", id).eq("user_id", uid);
      if (error) throw error;
      return;
    }
    const sessions = getStorageItem<CardioSession[]>("p72_cardio_sessions", []);
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx > -1) {
      sessions[idx] = { ...sessions[idx], ...data };
      setStorageItem("p72_cardio_sessions", sessions);
    }
  },
  deleteCardioSession: async (id: string) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { error } = await sb.from("cardio_sessions").delete().eq("id", id).eq("user_id", uid);
      if (error) throw error;
      return;
    }
    const sessions = getStorageItem<CardioSession[]>("p72_cardio_sessions", []);
    setStorageItem("p72_cardio_sessions", sessions.filter((s) => s.id !== id));
  },

  // Goals
  getGoals: async (): Promise<Goal[]> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("goals").select("*").eq("user_id", uid).order("created_at", { ascending: false });
      return data || [];
    }
    return getStorageItem<Goal[]>("p72_goals", []);
  },
  addGoal: async (goal: Omit<Goal, "id" | "user_id" | "created_at" | "updated_at" | "status"> & { status?: string }) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data, error } = await sb.from("goals").insert({
        ...goal,
        user_id: uid,
        status: goal.status || "active"
      }).select().single();
      if (error) throw error;
      return data;
    }
    const goals = getStorageItem<Goal[]>("p72_goals", []);
    const newGoal: Goal = {
      ...goal,
      id: `g-${Date.now()}`,
      user_id: "user-1",
      status: "active" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    goals.push(newGoal);
    setStorageItem("p72_goals", goals);
    return newGoal;
  },

  // Health Metrics
  getHealthMetrics: async (): Promise<HealthMetric[]> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("health_metrics").select("*").eq("user_id", uid).order("date", { ascending: false });
      return data || [];
    }
    return getStorageItem<HealthMetric[]>("p72_health_metrics", []);
  },
  addHealthMetric: async (metric: Omit<HealthMetric, "id" | "user_id" | "created_at">) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data, error } = await sb.from("health_metrics").insert({
        ...metric,
        user_id: uid
      }).select().single();
      if (error) throw error;
      return data;
    }
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
  getDailySummary: async (date: string): Promise<DailySummary | null> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("daily_summaries").select("*").eq("user_id", uid).eq("date", date).maybeSingle();
      return data;
    }
    const daily = getStorageItem<DailySummary[]>("p72_daily_summaries", []);
    return daily.find((d) => d.date === date) || null;
  },
  getDailySummaries: async (): Promise<DailySummary[]> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("daily_summaries").select("*").eq("user_id", uid).order("date", { ascending: false });
      return data || [];
    }
    return getStorageItem<DailySummary[]>("p72_daily_summaries", []);
  },
  updateDailySummaryField: async (date: string, fields: Partial<DailySummary>) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const existing = await trackerService.getDailySummary(date);
      
      const cleanFields = { ...fields };
      delete cleanFields.id;
      delete cleanFields.user_id;
      delete cleanFields.created_at;
      delete cleanFields.updated_at;

      if (existing) {
        await sb.from("daily_summaries").update({
          ...cleanFields,
          updated_at: new Date().toISOString()
        }).eq("id", existing.id);
      } else {
        await sb.from("daily_summaries").insert({
          user_id: uid,
          date,
          weight: null,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
          total_fiber: 0,
          water_ml: 0,
          steps: 0,
          sleep_hours: null,
          workout_completed: false,
          mood: null,
          notes: null,
          compliance_score: 0,
          energy_level: null,
          ...cleanFields
        });
      }
      return;
    }

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
        energy_level: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...fields,
      });
    }
    setStorageItem("p72_daily_summaries", daily);
  },

  // Nutrition & Daily Custom Targets
  getNutritionTargets: async (): Promise<NutritionTargets | null> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("nutrition_targets").select("*").eq("user_id", uid).maybeSingle();
      return data;
    }
    return getStorageItem<NutritionTargets | null>("p72_nutrition_targets", null);
  },
  updateNutritionTargets: async (targets: Partial<NutritionTargets>) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const current = await trackerService.getNutritionTargets();
      
      const updatedData = {
        user_id: uid,
        calories: targets.calories ?? current?.calories ?? 2000,
        protein: targets.protein ?? current?.protein ?? 130,
        carbs: targets.carbs ?? current?.carbs ?? 220,
        fat: targets.fat ?? current?.fat ?? 65,
        fiber: targets.fiber ?? current?.fiber ?? 30,
        water_ml: targets.water_ml ?? current?.water_ml ?? 2500,
        steps: targets.steps ?? current?.steps ?? 10000,
        sleep_hours: targets.sleep_hours ?? current?.sleep_hours ?? 8.0,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await sb.from("nutrition_targets").upsert(updatedData, { onConflict: ["user_id"] }).select().single();
      if (error) throw error;
      return data;
    }

    const current = getStorageItem<any>("p72_nutrition_targets", {});
    const updated = {
      id: current.id || `nt-${Date.now()}`,
      user_id: "user-1",
      calories: targets.calories ?? current.calories ?? 2000,
      protein: targets.protein ?? current.protein ?? 130,
      carbs: targets.carbs ?? current.carbs ?? 220,
      fat: targets.fat ?? current.fat ?? 65,
      fiber: targets.fiber ?? current.fiber ?? 30,
      water_ml: targets.water_ml ?? current.water_ml ?? 2500,
      steps: targets.steps ?? current.steps ?? 10000,
      sleep_hours: targets.sleep_hours ?? current.sleep_hours ?? 8.0,
      created_at: current.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorageItem("p72_nutrition_targets", updated);
    return updated;
  },

  // AI Workout Plans
  getAIWorkoutPlan: async (): Promise<AIWorkoutPlan | null> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("ai_workout_plans").select("*").eq("user_id", uid).maybeSingle();
      return data;
    }
    return getStorageItem<AIWorkoutPlan | null>("p72_ai_workout_plan", null);
  },
  saveAIWorkoutPlan: async (plan: Omit<AIWorkoutPlan, "id" | "user_id" | "created_at" | "updated_at">) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      // Build a flat exercises list from weekly_split if top-level exercises not provided
      let exercises: any = plan.exercises;
      if (!exercises || (Array.isArray(exercises) && exercises.length === 0)) {
        try {
          exercises = (plan.weekly_split || [])
            .filter((d: any) => d && d.type !== "rest" && Array.isArray(d.exercises))
            .flatMap((d: any) => d.exercises.map((ex: any) => ({ ...ex, day: d.day, split: d.type })));
        } catch {
          exercises = [];
        }
      }
      // Ensure exercises is never null/undefined
      if (!exercises) exercises = [];

      // First try to delete existing, then insert fresh (avoids upsert conflict issues)
      await sb.from("ai_workout_plans").delete().eq("user_id", uid);
      const { data, error } = await sb.from("ai_workout_plans").insert({
        user_id: uid,
        split_name: plan.split_name || "Custom Split",
        weekly_split: plan.weekly_split || [],
        exercises: exercises,
        progression_guidance: plan.progression_guidance || null,
      }).select().single();
      if (error) {
        console.error("Error saving AI workout plan:", error);
        throw error;
      }
      return data;
    }

    const current = getStorageItem<any>("p72_ai_workout_plan", {});
    const updated = {
      id: current.id || `aip-${Date.now()}`,
      user_id: "user-1",
      ...plan,
      created_at: current.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorageItem("p72_ai_workout_plan", updated);
    return updated;
  },

  // AI Cardio Plans
  getAICardioPlan: async (): Promise<AICardioPlan | null> => {
    return getStorageItem<AICardioPlan | null>("p72_ai_cardio_plan", null);
  },
  saveAICardioPlan: async (plan: Omit<AICardioPlan, "id" | "user_id" | "created_at" | "updated_at">) => {
    const current = getStorageItem<any>("p72_ai_cardio_plan", {});
    const updated = {
      id: current.id || `aic-${Date.now()}`,
      user_id: "user-1",
      ...plan,
      created_at: current.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorageItem("p72_ai_cardio_plan", updated);
    return updated;
  },

  // AI Workout Performance Analysis
  getAIWorkoutAnalysis: async (): Promise<AIWorkoutAnalysis | null> => {
    return getStorageItem<AIWorkoutAnalysis | null>("p72_ai_workout_analysis", null);
  },
  saveAIWorkoutAnalysis: async (analysis: Omit<AIWorkoutAnalysis, "id" | "user_id" | "created_at" | "updated_at">) => {
    const current = getStorageItem<any>("p72_ai_workout_analysis", {});
    const updated = {
      id: current.id || `aia-${Date.now()}`,
      user_id: "user-1",
      ...analysis,
      created_at: current.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorageItem("p72_ai_workout_analysis", updated);
    return updated;
  },

  // AI Meal Plans
  getAIMealPlan: async (): Promise<AIMealPlan | null> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("ai_meal_plans").select("*").eq("user_id", uid).maybeSingle();
      return data;
    }
    return getStorageItem<AIMealPlan | null>("p72_ai_meal_plan", null);
  },
  saveAIMealPlan: async (plan: Omit<AIMealPlan, "id" | "user_id" | "created_at" | "updated_at">) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data, error } = await sb.from("ai_meal_plans").upsert({
        user_id: uid,
        meal_plan: plan.meal_plan,
        updated_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return data;
    }

    const current = getStorageItem<any>("p72_ai_meal_plan", {});
    const updated = {
      id: current.id || `aim-${Date.now()}`,
      user_id: "user-1",
      ...plan,
      created_at: current.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorageItem("p72_ai_meal_plan", updated);
    return updated;
  },

  // Weekly Reviews
  getWeeklyReviews: async (): Promise<WeeklyReview[]> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("weekly_reviews").select("*").eq("user_id", uid).order("created_at", { ascending: false });
      return data || [];
    }
    return getStorageItem<WeeklyReview[]>("p72_weekly_reviews", []);
  },
  addWeeklyReview: async (review: Omit<WeeklyReview, "id" | "user_id" | "created_at">) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const { data, error } = await sb.from("weekly_reviews").insert({
        ...review,
        user_id: uid
      }).select().single();
      if (error) throw error;
      return data;
    }

    const reviews = getStorageItem<WeeklyReview[]>("p72_weekly_reviews", []);
    const newReview: WeeklyReview = Object.assign({
      workout_consistency: null,
      protein_consistency: null,
      calorie_adherence: null,
      habit_completion: null,
      avg_sleep: null,
      avg_water: null,
      avg_steps: null,
      avg_compliance_score: null,
      avg_calories: null,
      avg_protein: null,
      notes: null,
      highlights: null,
      lowlights: null,
      next_actions: null,
      ai_feedback: null,
      weight_change: null,
    }, review, {
      id: `wr-${Date.now()}`,
      user_id: "user-1",
      created_at: new Date().toISOString(),
    });
    reviews.push(newReview);
    setStorageItem("p72_weekly_reviews", reviews);
    return newReview;
  },

  // Reminders
  getReminders: async (): Promise<Reminder[]> => {
    const uid = await getUserId();
    const defaultReminders: Reminder[] = [
      { id: "r1", user_id: "user-1", reminder_type: "protein", enabled: true, time: "18:00:00", created_at: new Date().toISOString() },
      { id: "r2", user_id: "user-1", reminder_type: "water", enabled: true, time: "12:00:00", created_at: new Date().toISOString() },
      { id: "r3", user_id: "user-1", reminder_type: "workout", enabled: true, time: "08:00:00", created_at: new Date().toISOString() },
      { id: "r4", user_id: "user-1", reminder_type: "weight", enabled: true, time: "07:30:00", created_at: new Date().toISOString() },
    ];
    if (uid) {
      const sb = getSupabase()!;
      const { data } = await sb.from("reminders").select("*").eq("user_id", uid);
      if (data && data.length > 0) return data;
      
      const dbReminders = defaultReminders.map(r => ({
        user_id: uid,
        reminder_type: r.reminder_type,
        enabled: r.enabled,
        time: r.time
      }));
      const { data: inserted } = await sb.from("reminders").insert(dbReminders).select();
      return inserted || defaultReminders;
    }
    return getStorageItem<Reminder[]>("p72_reminders", defaultReminders);
  },
  updateReminder: async (id: string, enabled: boolean, time?: string | null) => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const updateData: any = { enabled };
      if (time !== undefined) {
        updateData.time = time;
      }
      await sb.from("reminders").update(updateData).eq("id", id).eq("user_id", uid);
      return trackerService.getReminders();
    }

    const reminders = await trackerService.getReminders();
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, enabled, ...(time !== undefined ? { time } : {}) } : r
    );
    setStorageItem("p72_reminders", updated);
    return updated;
  },

  // Export all data as JSON for backup
  exportAllData: async (): Promise<string> => {
    const uid = await getUserId();
    if (uid) {
      const sb = getSupabase()!;
      const [
        { data: profile },
        { data: weight_logs },
        { data: food_items },
        { data: nutrition_logs },
        { data: workout_sessions },
        { data: cardio_sessions },
        { data: habit_definitions },
        { data: habit_logs },
        { data: goals },
        { data: health_metrics },
        { data: daily_summaries },
        { data: nutrition_targets },
        { data: ai_workout_plan },
        { data: ai_meal_plan },
        { data: weekly_reviews },
        { data: reminders }
      ] = await Promise.all([
        sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
        sb.from("weight_logs").select("*").eq("user_id", uid),
        sb.from("food_items").select("*").eq("user_id", uid),
        sb.from("nutrition_logs").select("*").eq("user_id", uid),
        sb.from("workout_sessions").select("*").eq("user_id", uid),
        sb.from("cardio_sessions").select("*").eq("user_id", uid),
        sb.from("habit_definitions").select("*").eq("user_id", uid),
        sb.from("habit_logs").select("*").eq("user_id", uid),
        sb.from("goals").select("*").eq("user_id", uid),
        sb.from("health_metrics").select("*").eq("user_id", uid),
        sb.from("daily_summaries").select("*").eq("user_id", uid),
        sb.from("nutrition_targets").select("*").eq("user_id", uid).maybeSingle(),
        sb.from("ai_workout_plans").select("*").eq("user_id", uid).maybeSingle(),
        sb.from("ai_meal_plans").select("*").eq("user_id", uid).maybeSingle(),
        sb.from("weekly_reviews").select("*").eq("user_id", uid),
        sb.from("reminders").select("*").eq("user_id", uid)
      ]);
      
      return JSON.stringify({
        source: "Supabase (Cloud Sync)",
        exported_at: new Date().toISOString(),
        data: {
          profile,
          weight_logs,
          food_items,
          nutrition_logs,
          workout_sessions,
          cardio_sessions,
          habit_definitions,
          habit_logs,
          goals,
          health_metrics,
          daily_summaries,
          nutrition_targets,
          ai_workout_plan,
          ai_meal_plan,
          weekly_reviews,
          reminders
        }
      }, null, 2);
    }

    if (isServer) return "{}";
    const keys = [
      "p72_profile", "p72_weight_logs", "p72_food_items",
      "p72_nutrition_logs", "p72_nutrition_log_items",
      "p72_habit_definitions", "p72_habit_logs",
      "p72_daily_summaries", "p72_goals",
      "p72_workout_sessions", "p72_cardio_sessions",
      "p72_health_metrics", "p72_body_measurements",
      "p72_nutrition_targets", "p72_ai_workout_plan",
      "p72_ai_cardio_plan", "p72_ai_workout_analysis", "p72_ai_meal_plan", "p72_weekly_reviews",
      "p72_reminders",
    ];
    const data: Record<string, any> = {};
    keys.forEach((k) => {
      const item = localStorage.getItem(k);
      if (item) data[k] = JSON.parse(item);
    });
    return JSON.stringify(data, null, 2);
  },
};
