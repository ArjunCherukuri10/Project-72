export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          height_cm: number | null;
          goal_weight: number;
          starting_weight: number;
          date_of_birth: string | null;
          gender: string | null;
          activity_level: string | null;
          units: "metric" | "imperial";
          theme: "light" | "dark" | "system";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          height_cm?: number | null;
          goal_weight?: number;
          starting_weight?: number;
          date_of_birth?: string | null;
          gender?: string | null;
          activity_level?: string | null;
          units?: "metric" | "imperial";
          theme?: "light" | "dark" | "system";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          height_cm?: number | null;
          goal_weight?: number;
          starting_weight?: number;
          date_of_birth?: string | null;
          gender?: string | null;
          activity_level?: string | null;
          units?: "metric" | "imperial";
          theme?: "light" | "dark" | "system";
          updated_at?: string;
        };
      };
      weight_logs: {
        Row: {
          id: string;
          user_id: string;
          weight: number;
          date: string;
          time_recorded: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight: number;
          date: string;
          time_recorded?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          weight?: number;
          date?: string;
          time_recorded?: string | null;
          notes?: string | null;
        };
      };
      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          waist: number | null;
          neck: number | null;
          chest: number | null;
          shoulders: number | null;
          biceps: number | null;
          forearms: number | null;
          hips: number | null;
          thighs: number | null;
          calves: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          waist?: number | null;
          neck?: number | null;
          chest?: number | null;
          shoulders?: number | null;
          biceps?: number | null;
          forearms?: number | null;
          hips?: number | null;
          thighs?: number | null;
          calves?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          date?: string;
          waist?: number | null;
          neck?: number | null;
          chest?: number | null;
          shoulders?: number | null;
          biceps?: number | null;
          forearms?: number | null;
          hips?: number | null;
          thighs?: number | null;
          calves?: number | null;
          notes?: string | null;
        };
      };
      food_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          serving_size: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
          sugar: number;
          sodium: number;
          category: string | null;
          is_favorite: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          serving_size: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
          sugar?: number;
          sodium?: number;
          category?: string | null;
          is_favorite?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          serving_size?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
          sugar?: number;
          sodium?: number;
          category?: string | null;
          is_favorite?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
      };
      nutrition_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snacks";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snacks";
          created_at?: string;
        };
        Update: {
          date?: string;
          meal_type?: "breakfast" | "lunch" | "dinner" | "snacks";
        };
      };
      nutrition_log_items: {
        Row: {
          id: string;
          nutrition_log_id: string;
          food_item_id: string;
          servings: number;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nutrition_log_id: string;
          food_item_id: string;
          servings: number;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
          created_at?: string;
        };
        Update: {
          servings?: number;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
        };
      };
      workout_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      template_exercises: {
        Row: {
          id: string;
          template_id: string;
          exercise_name: string;
          target_sets: number;
          target_reps: number;
          rest_time_seconds: number | null;
          sort_order: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          exercise_name: string;
          target_sets: number;
          target_reps: number;
          rest_time_seconds?: number | null;
          sort_order: number;
          notes?: string | null;
        };
        Update: {
          exercise_name?: string;
          target_sets?: number;
          target_reps?: number;
          rest_time_seconds?: number | null;
          sort_order?: number;
          notes?: string | null;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          name: string;
          type: string;
          date: string;
          duration_minutes: number | null;
          notes: string | null;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          name: string;
          type: string;
          date: string;
          duration_minutes?: number | null;
          notes?: string | null;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          date?: string;
          duration_minutes?: number | null;
          notes?: string | null;
          completed?: boolean;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_name: string;
          sort_order: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_name: string;
          sort_order: number;
          notes?: string | null;
        };
        Update: {
          exercise_name?: string;
          sort_order?: number;
          notes?: string | null;
        };
      };
      exercise_sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          reps: number;
          weight: number;
          is_warmup: boolean;
          is_pr: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          reps: number;
          weight: number;
          is_warmup?: boolean;
          is_pr?: boolean;
          created_at?: string;
        };
        Update: {
          set_number?: number;
          reps?: number;
          weight?: number;
          is_warmup?: boolean;
          is_pr?: boolean;
        };
      };
      cardio_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          type: string;
          duration_minutes: number;
          distance_km: number | null;
          calories_burned: number | null;
          avg_pace: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          type: string;
          duration_minutes: number;
          distance_km?: number | null;
          calories_burned?: number | null;
          avg_pace?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          date?: string;
          type?: string;
          duration_minutes?: number;
          distance_km?: number | null;
          calories_burned?: number | null;
          avg_pace?: string | null;
          notes?: string | null;
        };
      };
      habit_definitions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          target_frequency: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          target_frequency?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string | null;
          color?: string | null;
          target_frequency?: string;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      habit_logs: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          date: string;
          completed: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          date: string;
          completed: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          completed?: boolean;
          notes?: string | null;
        };
      };
      health_metrics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          metric_type: string;
          value: number;
          unit: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          metric_type: string;
          value: number;
          unit: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          date?: string;
          metric_type?: string;
          value?: number;
          unit?: string;
          notes?: string | null;
        };
      };
      goals: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          title: string;
          description?: string | null;
          target_value?: number | null;
          current_value?: number | null;
          unit?: string | null;
          start_date: string;
          target_date?: string | null;
          status?: "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          title?: string;
          description?: string | null;
          target_value?: number | null;
          current_value?: number | null;
          unit?: string | null;
          start_date?: string;
          target_date?: string | null;
          status?: "active" | "completed" | "archived";
          updated_at?: string;
        };
      };
      daily_summaries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight: number | null;
          total_calories: number | null;
          total_protein: number | null;
          total_carbs: number | null;
          total_fat: number | null;
          total_fiber: number | null;
          water_ml: number | null;
          steps: number | null;
          sleep_hours: number | null;
          workout_completed: boolean;
          mood: number | null;
          notes: string | null;
          compliance_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          weight?: number | null;
          total_calories?: number | null;
          total_protein?: number | null;
          total_carbs?: number | null;
          total_fat?: number | null;
          total_fiber?: number | null;
          water_ml?: number | null;
          steps?: number | null;
          sleep_hours?: number | null;
          workout_completed?: boolean;
          mood?: number | null;
          notes?: string | null;
          compliance_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          weight?: number | null;
          total_calories?: number | null;
          total_protein?: number | null;
          total_carbs?: number | null;
          total_fat?: number | null;
          total_fiber?: number | null;
          water_ml?: number | null;
          steps?: number | null;
          sleep_hours?: number | null;
          workout_completed?: boolean;
          mood?: number | null;
          notes?: string | null;
          compliance_score?: number | null;
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          description: string | null;
          unlocked_at: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          description?: string | null;
          unlocked_at?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          unlocked_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
