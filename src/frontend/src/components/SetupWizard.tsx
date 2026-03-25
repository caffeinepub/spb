import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Plus, Sun, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useSaveClasses,
  useSaveProfile,
  useSaveRoutines,
} from "../hooks/useQueries";
import type { LocalClass, UserPreferences } from "../types/planner";
import { generateSchedule } from "../utils/scheduleGenerator";
import { minutesToTime, timeToMinutes } from "../utils/timeUtils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [classes, setClasses] = useState<LocalClass[]>([
    {
      name: "Intro to Psychology",
      days: [1, 3],
      startTime: 9 * 60,
      endTime: 10 * 60 + 30,
    },
    {
      name: "Calculus II",
      days: [2, 4],
      startTime: 11 * 60,
      endTime: 12 * 60 + 30,
    },
  ]);
  const [newClass, setNewClass] = useState<
    Omit<LocalClass, "days"> & { days: number[] }
  >({
    name: "",
    days: [],
    startTime: 9 * 60,
    endTime: 10 * 60,
  });
  const [prefs, setPrefs] = useState<UserPreferences>({
    exerciseDuration: 30,
    exerciseTiming: "morning",
    pomodoroEnabled: true,
    pomodoroStudy: 45,
    pomodoroBreak: 15,
  });

  const saveProfile = useSaveProfile();
  const saveClasses = useSaveClasses();
  const saveRoutines = useSaveRoutines();

  const handleAddClass = () => {
    if (!newClass.name.trim()) {
      toast.error("Please enter a class name");
      return;
    }
    if (newClass.days.length === 0) {
      toast.error("Please select at least one day");
      return;
    }
    setClasses((prev) => [...prev, { ...newClass }]);
    setNewClass({ name: "", days: [], startTime: 9 * 60, endTime: 10 * 60 });
  };

  const handleRemoveClass = (idx: number) => {
    setClasses((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleDay = (day: number) => {
    setNewClass((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleGenerate = async () => {
    try {
      const wakeMins = timeToMinutes(wakeTime);
      const sleepMins = timeToMinutes(sleepTime);

      await saveProfile.mutateAsync({
        wakeTime: BigInt(wakeMins),
        sleepTime: BigInt(sleepMins),
      });

      const classBlocks = classes.map((c) => ({
        name: c.name,
        days: c.days.map(BigInt),
        startTime: BigInt(c.startTime),
        endTime: BigInt(c.endTime),
      }));
      await saveClasses.mutateAsync(classBlocks);

      const schedule = generateSchedule(wakeMins, sleepMins, classes, prefs);
      const routineInputs = schedule.map((b) => ({
        startTime: BigInt(b.startTime),
        endTime: BigInt(b.endTime),
        blockLabel: b.blockLabel,
        category: b.category,
      }));
      await saveRoutines.mutateAsync(routineInputs);

      localStorage.setItem("dayflow_prefs", JSON.stringify(prefs));
      localStorage.setItem("dayflow_setup_complete", "true");

      toast.success("Your daily schedule has been created! 🎉");
      onComplete();
    } catch {
      toast.error("Failed to save schedule. Please try again.");
    }
  };

  const isLoading =
    saveProfile.isPending || saveClasses.isPending || saveRoutines.isPending;

  const steps = [
    { num: 1, label: "Schedule" },
    { num: 2, label: "Classes" },
    { num: 3, label: "Preferences" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sun className="w-6 h-6 text-primary" />
            <span className="text-2xl font-display font-bold text-foreground">
              DayFlow
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Let&apos;s set up your perfect daily routine
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                data-ocid={`setup.step.${s.num}`}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  step === s.num
                    ? "bg-primary text-primary-foreground"
                    : step > s.num
                      ? "bg-primary/30 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s.num}
              </div>
              <span
                className={`text-sm hidden sm:block ${
                  step === s.num
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle>Your Daily Schedule</CardTitle>
                  <CardDescription>
                    When do you wake up and go to sleep?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wake-time">Wake Up Time</Label>
                      <Input
                        id="wake-time"
                        data-ocid="setup.wake_time.input"
                        type="time"
                        value={wakeTime}
                        onChange={(e) => setWakeTime(e.target.value)}
                        className="text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sleep-time">Bedtime</Label>
                      <Input
                        id="sleep-time"
                        data-ocid="setup.sleep_time.input"
                        type="time"
                        value={sleepTime}
                        onChange={(e) => setSleepTime(e.target.value)}
                        className="text-center"
                      />
                    </div>
                  </div>
                  <div className="bg-secondary/60 rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">
                      💡 Pro tip
                    </p>
                    <p>
                      Aim for 7-9 hours of sleep. Quality sleep improves memory,
                      focus, and mood.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle>Your Classes</CardTitle>
                  <CardDescription>
                    Add your college schedule so we can plan around it
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {classes.map((cls, idx) => (
                      <div
                        key={`${cls.name}-${cls.startTime}`}
                        data-ocid={`setup.class.item.${idx + 1}`}
                        className="flex items-center gap-3 p-3 bg-secondary/60 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {cls.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cls.days.map((d) => DAYS[d]).join(", ")} ·{" "}
                            {minutesToTime(cls.startTime)} –{" "}
                            {minutesToTime(cls.endTime)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`setup.class.delete_button.${idx + 1}`}
                          onClick={() => handleRemoveClass(idx)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {classes.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No classes added yet. Add your first class below.
                      </p>
                    )}
                  </div>

                  <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium">Add a Class</p>
                    <Input
                      data-ocid="setup.class_name.input"
                      placeholder="Class name (e.g. Calculus II)"
                      value={newClass.name}
                      onChange={(e) =>
                        setNewClass((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          data-ocid="setup.class_start.input"
                          type="time"
                          value={minutesToTime(newClass.startTime)}
                          onChange={(e) =>
                            setNewClass((p) => ({
                              ...p,
                              startTime: timeToMinutes(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Time</Label>
                        <Input
                          data-ocid="setup.class_end.input"
                          type="time"
                          value={minutesToTime(newClass.endTime)}
                          onChange={(e) =>
                            setNewClass((p) => ({
                              ...p,
                              endTime: timeToMinutes(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Days of Week</Label>
                      <div className="flex gap-1.5 flex-wrap">
                        {DAYS.map((day, i) => (
                          <button
                            key={day}
                            type="button"
                            data-ocid={`setup.day.toggle.${i + 1}`}
                            onClick={() => toggleDay(i)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                              newClass.days.includes(i)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary"
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      data-ocid="setup.add_class.button"
                      className="w-full"
                      onClick={handleAddClass}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Class
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle>Your Preferences</CardTitle>
                  <CardDescription>
                    Customize your routine to fit your lifestyle
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Exercise</Label>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Exercise Timing
                      </Label>
                      <Select
                        value={prefs.exerciseTiming}
                        onValueChange={(v: "morning" | "evening" | "none") =>
                          setPrefs((p) => ({ ...p, exerciseTiming: v }))
                        }
                      >
                        <SelectTrigger data-ocid="setup.exercise_timing.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                          <SelectItem value="none">No Exercise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {prefs.exerciseTiming !== "none" && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Duration
                        </Label>
                        <Select
                          value={String(prefs.exerciseDuration)}
                          onValueChange={(v) =>
                            setPrefs((p) => ({
                              ...p,
                              exerciseDuration: Number(v),
                            }))
                          }
                        >
                          <SelectTrigger data-ocid="setup.exercise_duration.select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">
                          Pomodoro Study Blocks
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Focus sessions with structured breaks
                        </p>
                      </div>
                      <Switch
                        data-ocid="setup.pomodoro.switch"
                        checked={prefs.pomodoroEnabled}
                        onCheckedChange={(v) =>
                          setPrefs((p) => ({ ...p, pomodoroEnabled: v }))
                        }
                      />
                    </div>
                    {prefs.pomodoroEnabled && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Study Duration
                          </Label>
                          <Select
                            value={String(prefs.pomodoroStudy)}
                            onValueChange={(v) =>
                              setPrefs((p) => ({
                                ...p,
                                pomodoroStudy: Number(v),
                              }))
                            }
                          >
                            <SelectTrigger data-ocid="setup.study_duration.select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="25">25 min</SelectItem>
                              <SelectItem value="30">30 min</SelectItem>
                              <SelectItem value="45">45 min</SelectItem>
                              <SelectItem value="50">50 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Break Duration
                          </Label>
                          <Select
                            value={String(prefs.pomodoroBreak)}
                            onValueChange={(v) =>
                              setPrefs((p) => ({
                                ...p,
                                pomodoroBreak: Number(v),
                              }))
                            }
                          >
                            <SelectTrigger data-ocid="setup.break_duration.select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 min</SelectItem>
                              <SelectItem value="10">10 min</SelectItem>
                              <SelectItem value="15">15 min</SelectItem>
                              <SelectItem value="20">20 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">
                      🎯 Goal: Build consistent habits
                    </Badge>
                    <Badge variant="secondary">
                      📅 {classes.length} classes added
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-4">
          {step > 1 && (
            <Button
              variant="outline"
              data-ocid="setup.back.button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              data-ocid="setup.next.button"
              onClick={() => setStep((s) => s + 1)}
              className="flex-1"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              data-ocid="setup.generate.button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Generating..." : "Generate My Schedule ✨"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
