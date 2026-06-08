export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
    description: "Overview of your progress",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: "Calendar",
    description: "Daily tracking calendar",
  },
  {
    title: "Weight",
    href: "/weight",
    icon: "Scale",
    description: "Weight tracking & trends",
  },
  {
    title: "Measurements",
    href: "/measurements",
    icon: "Ruler",
    description: "Body measurements",
  },
  {
    title: "Food Database",
    href: "/food",
    icon: "Apple",
    description: "Custom food database",
  },
  {
    title: "Nutrition",
    href: "/nutrition",
    icon: "UtensilsCrossed",
    description: "Meal & nutrition tracking",
  },
  {
    title: "Workouts",
    href: "/workouts",
    icon: "Dumbbell",
    description: "Workout tracking",
  },
  {
    title: "Cardio",
    href: "/cardio",
    icon: "HeartPulse",
    description: "Cardio activity tracking",
  },
  {
    title: "Habits",
    href: "/habits",
    icon: "CheckSquare",
    description: "Habit tracking & streaks",
  },
  {
    title: "Health",
    href: "/health",
    icon: "Activity",
    description: "Health metrics & labs",
  },
  {
    title: "Goals",
    href: "/goals",
    icon: "Target",
    description: "Goal setting & tracking",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: "BarChart3",
    description: "Advanced analytics",
  },
  {
    title: "Weekly Review",
    href: "/reviews",
    icon: "FileText",
    description: "Weekly summaries",
  },
  {
    title: "Milestones",
    href: "/milestones",
    icon: "Trophy",
    description: "Achievements & badges",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
    description: "App settings",
  },
] as const;

export const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", icon: "☀️" },
  { value: "lunch", label: "Lunch", icon: "🌤️" },
  { value: "dinner", label: "Dinner", icon: "🌙" },
  { value: "snacks", label: "Snacks", icon: "🍿" },
] as const;

export const WORKOUT_TYPES = [
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "legs", label: "Legs" },
  { value: "upper", label: "Upper Body" },
  { value: "lower", label: "Lower Body" },
  { value: "full_body", label: "Full Body" },
  { value: "custom", label: "Custom" },
] as const;

export const CARDIO_TYPES = [
  { value: "walking", label: "Walking", icon: "🚶" },
  { value: "running", label: "Running", icon: "🏃" },
  { value: "cycling", label: "Cycling", icon: "🚴" },
  { value: "treadmill", label: "Treadmill", icon: "🏋️" },
  { value: "stair_climber", label: "Stair Climber", icon: "🪜" },
  { value: "swimming", label: "Swimming", icon: "🏊" },
  { value: "custom", label: "Custom", icon: "⚡" },
] as const;

export const HEALTH_METRIC_TYPES = [
  { value: "blood_pressure_systolic", label: "Blood Pressure (Systolic)", unit: "mmHg" },
  { value: "blood_pressure_diastolic", label: "Blood Pressure (Diastolic)", unit: "mmHg" },
  { value: "hba1c", label: "HbA1c", unit: "%" },
  { value: "fasting_glucose", label: "Fasting Glucose", unit: "mg/dL" },
  { value: "vitamin_d", label: "Vitamin D", unit: "ng/mL" },
  { value: "vitamin_b12", label: "Vitamin B12", unit: "pg/mL" },
  { value: "cholesterol", label: "Cholesterol", unit: "mg/dL" },
  { value: "triglycerides", label: "Triglycerides", unit: "mg/dL" },
  { value: "resting_heart_rate", label: "Resting Heart Rate", unit: "bpm" },
] as const;

export const FOOD_CATEGORIES = [
  "Protein",
  "Dairy",
  "Grains",
  "Fruits",
  "Vegetables",
  "Snacks",
  "Beverages",
  "Supplements",
  "Other",
] as const;

export const DEFAULT_HABITS = [
  { name: "Workout", icon: "💪" },
  { name: "10k Steps", icon: "🚶" },
  { name: "Protein Goal", icon: "🥩" },
  { name: "Fiber Goal", icon: "🥦" },
  { name: "Water Goal", icon: "💧" },
  { name: "Sleep Goal", icon: "😴" },
  { name: "No Soft Drinks", icon: "🚫" },
  { name: "No Junk Food", icon: "🍔" },
  { name: "Meditation", icon: "🧘" },
  { name: "Reading", icon: "📚" },
] as const;

export const MILESTONE_DEFINITIONS = [
  { type: "first_workout", title: "First Workout", description: "Completed your first workout!", icon: "🎯" },
  { type: "streak_7", title: "7 Day Streak", description: "Maintained a 7-day streak!", icon: "🔥" },
  { type: "streak_30", title: "30 Day Streak", description: "Maintained a 30-day streak!", icon: "💎" },
  { type: "lost_5kg", title: "5kg Lost", description: "Lost 5kg from starting weight!", icon: "⭐" },
  { type: "lost_10kg", title: "10kg Lost", description: "Lost 10kg from starting weight!", icon: "🌟" },
  { type: "goal_weight", title: "Goal Weight!", description: "Reached your goal weight!", icon: "🏆" },
  { type: "workouts_100", title: "100 Workouts", description: "Completed 100 workouts!", icon: "💪" },
  { type: "protein_100", title: "100 Protein Days", description: "Hit protein goal 100 times!", icon: "🥩" },
] as const;

// Nutritional targets (can be customized per user)
export const DEFAULT_TARGETS = {
  calories: 1800,
  protein: 150,
  carbs: 180,
  fat: 60,
  fiber: 30,
  water_ml: 3000,
  steps: 10000,
  sleep_hours: 7.5,
} as const;
