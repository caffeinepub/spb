import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Edit3, LayoutDashboard, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { EditRoutine } from "./components/EditRoutine";
import { LoginGate } from "./components/LoginGate";
import { SPBAssistant } from "./components/SPBAssistant";
import { Scene3D } from "./components/Scene3D";
import { SetupWizard } from "./components/SetupWizard";
import { TimelineView } from "./components/TimelineView";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserData } from "./hooks/useQueries";
import type { LocalRoutineBlock } from "./types/planner";
import { generateSchedule } from "./utils/scheduleGenerator";
import { nowMinutes } from "./utils/timeUtils";

const DEFAULT_PREFS = {
  exerciseDuration: 30,
  exerciseTiming: "morning" as const,
  pomodoroEnabled: true,
  pomodoroStudy: 45,
  pomodoroBreak: 15,
};

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-4 max-w-lg mx-auto">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function App() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { data: userData, isLoading: isUserDataLoading } = useUserData();
  const [blocks, setBlocks] = useState<LocalRoutineBlock[]>([]);
  const [blocksLoaded, setBlocksLoaded] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState(nowMinutes);
  const [isSetupComplete, setIsSetupComplete] = useState(
    () => localStorage.getItem("dayflow_setup_complete") === "true",
  );
  const [activeTab, setActiveTab] = useState("dashboard");

  // Tick every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentMinutes(nowMinutes()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Populate blocks from backend data
  useEffect(() => {
    if (!userData || blocksLoaded) return;

    if (userData.routineBlocks && userData.routineBlocks.length > 0) {
      const backendBlocks: LocalRoutineBlock[] = userData.routineBlocks
        .map((b) => ({
          id: Number(b.id),
          startTime: Number(b.startTime),
          endTime: Number(b.endTime),
          blockLabel: b.blockLabel,
          category: b.category as LocalRoutineBlock["category"],
          completed: false,
        }))
        .sort((a, b) => a.startTime - b.startTime);
      setBlocks(backendBlocks);
      setBlocksLoaded(true);
      setIsSetupComplete(true);
      localStorage.setItem("dayflow_setup_complete", "true");
    } else if (userData.profile) {
      const prefs = (() => {
        try {
          return JSON.parse(
            localStorage.getItem("dayflow_prefs") || "",
          ) as typeof DEFAULT_PREFS;
        } catch {
          return DEFAULT_PREFS;
        }
      })();
      const localClasses = (userData.classBlocks || []).map((c) => ({
        name: c.name,
        days: c.days.map(Number),
        startTime: Number(c.startTime),
        endTime: Number(c.endTime),
      }));
      const generated = generateSchedule(
        Number(userData.profile.wakeTime),
        Number(userData.profile.sleepTime),
        localClasses,
        prefs,
      );
      setBlocks(generated);
      setBlocksLoaded(true);
    }
  }, [userData, blocksLoaded]);

  const wakeTime = userData?.profile
    ? Number(userData.profile.wakeTime)
    : 7 * 60;
  const sleepTime = userData?.profile
    ? Number(userData.profile.sleepTime)
    : 23 * 60;

  const principalStr = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principalStr ? principalStr.slice(0, 5) : "U";

  // Derive current block for assistant
  const currentBlock = blocks.find(
    (b) => currentMinutes >= b.startTime && currentMinutes < b.endTime,
  );

  if (isInitializing) return <LoadingSkeleton />;
  if (!identity) return <LoginGate />;
  if (isUserDataLoading) return <LoadingSkeleton />;

  if (
    !isSetupComplete ||
    (userData && !userData.profile && blocks.length === 0)
  ) {
    return (
      <>
        <SetupWizard onComplete={() => setIsSetupComplete(true)} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* 3D Scene Hero */}
      <Scene3D />

      {/* Top Navigation */}
      <header className="sticky top-0 z-20 bg-card/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="font-black text-xl tracking-widest"
              style={{
                background: "linear-gradient(90deg, #f0c060, #8899ff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              SPB
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Student Day Planner
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {shortPrincipal.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              data-ocid="nav.logout.button"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
          <TabsList className="w-full mb-5 h-10">
            <TabsTrigger
              value="dashboard"
              data-ocid="nav.dashboard.tab"
              className="flex-1 gap-1.5 text-xs sm:text-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              data-ocid="nav.timeline.tab"
              className="flex-1 gap-1.5 text-xs sm:text-sm"
            >
              <Clock className="w-3.5 h-3.5" /> Timeline
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              data-ocid="nav.edit.tab"
              className="flex-1 gap-1.5 text-xs sm:text-sm"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent
                value="dashboard"
                forceMount
                className={activeTab !== "dashboard" ? "hidden" : ""}
              >
                <Dashboard blocks={blocks} />
              </TabsContent>

              <TabsContent
                value="timeline"
                forceMount
                className={activeTab !== "timeline" ? "hidden" : ""}
              >
                <TimelineView
                  blocks={blocks}
                  wakeTime={wakeTime}
                  sleepTime={sleepTime}
                />
              </TabsContent>

              <TabsContent
                value="edit"
                forceMount
                className={activeTab !== "edit" ? "hidden" : ""}
              >
                <EditRoutine
                  blocks={blocks}
                  onSaved={(updated) => {
                    setBlocks(updated);
                    setActiveTab("dashboard");
                  }}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="max-w-lg mx-auto px-4 pb-20 pt-2 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Floating SPB Assistant */}
      <SPBAssistant
        currentBlockName={currentBlock?.blockLabel}
        currentBlockEnd={currentBlock?.endTime}
      />
    </div>
  );
}
