export type Category =
  | "class"
  | "study"
  | "break"
  | "meal"
  | "exercise"
  | "sleep"
  | "morning-routine"
  | "free"
  | "wind-down";

export interface LocalRoutineBlock {
  id: number;
  startTime: number; // minutes from midnight
  endTime: number; // minutes from midnight
  blockLabel: string;
  category: Category;
  completed?: boolean;
}

export interface LocalClass {
  name: string;
  days: number[]; // 0=Sunday ... 6=Saturday
  startTime: number; // minutes from midnight
  endTime: number;
}

export interface UserPreferences {
  exerciseDuration: number; // minutes
  exerciseTiming: "morning" | "evening" | "none";
  pomodoroEnabled: boolean;
  pomodoroStudy: number; // default 45
  pomodoroBreak: number; // default 15
}

export const CATEGORY_COLORS: Record<Category, string> = {
  class: "#3B82F6",
  study: "#22C55E",
  break: "#EC4899",
  meal: "#F97316",
  exercise: "#14B8A6",
  sleep: "#6366F1",
  "morning-routine": "#EAB308",
  free: "#9CA3AF",
  "wind-down": "#A855F7",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  class: "Class",
  study: "Study",
  break: "Break",
  meal: "Meal",
  exercise: "Exercise",
  sleep: "Sleep",
  "morning-routine": "Morning Routine",
  free: "Free Time",
  "wind-down": "Wind Down",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  class: "🎓",
  study: "📚",
  break: "☕",
  meal: "🍽️",
  exercise: "🏃",
  sleep: "🌙",
  "morning-routine": "🌅",
  free: "🎮",
  "wind-down": "😴",
};
