import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock, Sparkles, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getDailyMessage } from "../data/motivationalMessages";
import { useCompletions, useSaveCompletions } from "../hooks/useQueries";
import type { LocalRoutineBlock } from "../types/planner";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../types/planner";
import { formatDuration, minutesToTime, nowMinutes } from "../utils/timeUtils";

interface Props {
  blocks: LocalRoutineBlock[];
}

export function Dashboard({ blocks }: Props) {
  const [currentMinutes, setCurrentMinutes] = useState(nowMinutes);
  const [localCompleted, setLocalCompleted] = useState<Set<number>>(new Set());
  const motivationalMessage = getDailyMessage();

  const { data: completionData } = useCompletions();
  const saveCompletions = useSaveCompletions();

  // Sync backend completions
  useEffect(() => {
    if (completionData && completionData.length > 0) {
      setLocalCompleted(new Set(completionData.map(Number)));
    }
  }, [completionData]);

  // Tick every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentMinutes(nowMinutes()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentBlock = blocks.find(
    (b) => currentMinutes >= b.startTime && currentMinutes < b.endTime,
  );

  const timeRemaining = currentBlock
    ? currentBlock.endTime - currentMinutes
    : 0;

  const todayBlocks = blocks.filter((b) => b.category !== "sleep");
  const completedCount = todayBlocks.filter((b) =>
    localCompleted.has(b.id),
  ).length;
  const progressPct =
    todayBlocks.length > 0 ? (completedCount / todayBlocks.length) * 100 : 0;

  const toggleComplete = useCallback(
    async (blockId: number, blockLabel: string) => {
      setLocalCompleted((prev) => {
        const next = new Set(prev);
        if (next.has(blockId)) {
          next.delete(blockId);
        } else {
          next.add(blockId);
          toast.success("Task completed! Keep going 🎉", { duration: 2000 });
          // Notify SPB Assistant
          window.dispatchEvent(
            new CustomEvent("spb:taskCompleted", {
              detail: { name: blockLabel },
            }),
          );
        }
        const ids = Array.from(next).map(BigInt);
        saveCompletions.mutateAsync(ids).catch(() => {});
        return next;
      });
    },
    [saveCompletions],
  );

  const upcomingBlocks = blocks
    .filter((b) => b.startTime > currentMinutes)
    .slice(0, 4);

  return (
    <div className="space-y-5">
      {/* "What should I do now?" card */}
      <AnimatePresence mode="wait">
        {currentBlock ? (
          <motion.div
            key={currentBlock.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              data-ocid="dashboard.current_task.card"
              className="overflow-hidden shadow-card border-0"
              style={{
                background: `${CATEGORY_COLORS[currentBlock.category]}18`,
              }}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-2xl text-2xl shrink-0"
                    style={{
                      background: `${CATEGORY_COLORS[currentBlock.category]}30`,
                    }}
                  >
                    {CATEGORY_ICONS[currentBlock.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className="text-white text-xs border-0"
                        style={{
                          background: CATEGORY_COLORS[currentBlock.category],
                        }}
                      >
                        Now
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {minutesToTime(currentBlock.startTime)} –{" "}
                        {minutesToTime(currentBlock.endTime)}
                      </span>
                    </div>
                    <h2 className="text-xl font-display font-bold text-foreground">
                      {currentBlock.blockLabel}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <Clock className="inline w-3.5 h-3.5 mr-1" />
                      {formatDuration(timeRemaining)} remaining
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid="dashboard.current_task.toggle"
                    onClick={() =>
                      toggleComplete(currentBlock.id, currentBlock.blockLabel)
                    }
                    className="shrink-0 mt-1"
                    aria-label="Mark complete"
                  >
                    <CheckCircle2
                      className={`w-6 h-6 transition-colors ${
                        localCompleted.has(currentBlock.id)
                          ? "text-primary fill-primary/20"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                </div>
                {/* Progress bar for current block */}
                <div className="mt-4">
                  <Progress
                    value={
                      ((currentBlock.endTime -
                        currentBlock.startTime -
                        timeRemaining) /
                        (currentBlock.endTime - currentBlock.startTime)) *
                      100
                    }
                    className="h-1.5"
                    style={{ "--tw-bg-opacity": "1" } as React.CSSProperties}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="no-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card
              data-ocid="dashboard.no_current_task.card"
              className="shadow-card border-border"
            >
              <CardContent className="pt-5 pb-5 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-semibold">You have free time right now!</p>
                <p className="text-sm text-muted-foreground">
                  No scheduled block at this time
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Motivational message */}
      <div className="bg-accent/30 rounded-xl p-4 border border-accent/20">
        <p className="text-sm text-accent-foreground italic">
          &ldquo;{motivationalMessage}&rdquo;
        </p>
      </div>

      {/* Today's Progress */}
      <Card
        data-ocid="dashboard.progress.card"
        className="shadow-card border-border"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Today&apos;s Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {completedCount} of {todayBlocks.length} tasks
            </span>
            <span className="font-semibold text-primary">
              {Math.round(progressPct)}%
            </span>
          </div>
          <Progress value={progressPct} className="h-3" />
          {completedCount === todayBlocks.length && todayBlocks.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-center mt-2 text-primary font-medium"
            >
              🎉 You&apos;ve completed all tasks today!
            </motion.p>
          )}
        </CardContent>
      </Card>

      {/* Schedule list */}
      <Card className="shadow-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <div
              className="px-4 pb-4 space-y-2"
              data-ocid="dashboard.schedule.list"
            >
              {blocks.map((block, idx) => {
                const isActive =
                  currentMinutes >= block.startTime &&
                  currentMinutes < block.endTime;
                const isPast = currentMinutes >= block.endTime;
                const isCompleted = localCompleted.has(block.id);

                return (
                  <motion.div
                    key={block.id}
                    data-ocid={`dashboard.schedule.item.${idx + 1}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isActive
                        ? "border-primary/30 bg-primary/5"
                        : isCompleted || isPast
                          ? "opacity-50 border-transparent bg-muted/30"
                          : "border-border bg-card"
                    }`}
                  >
                    {/* Color indicator */}
                    <div
                      className="w-2 h-10 rounded-full shrink-0"
                      style={{ background: CATEGORY_COLORS[block.category] }}
                    />
                    {/* Icon */}
                    <span className="text-lg shrink-0">
                      {CATEGORY_ICONS[block.category]}
                    </span>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm truncate ${
                          isCompleted
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {block.blockLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {minutesToTime(block.startTime)} –{" "}
                        {minutesToTime(block.endTime)}
                        <span className="ml-2 opacity-70">
                          ({formatDuration(block.endTime - block.startTime)})
                        </span>
                      </p>
                    </div>
                    {/* Checkbox */}
                    {block.category !== "sleep" && (
                      <Checkbox
                        data-ocid={`dashboard.schedule.checkbox.${idx + 1}`}
                        checked={isCompleted}
                        onCheckedChange={() =>
                          toggleComplete(block.id, block.blockLabel)
                        }
                        className="shrink-0"
                      />
                    )}
                    {isActive && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs"
                        style={{
                          background: `${CATEGORY_COLORS[block.category]}20`,
                          color: CATEGORY_COLORS[block.category],
                        }}
                      >
                        Active
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
              {blocks.length === 0 && (
                <div
                  data-ocid="dashboard.schedule.empty_state"
                  className="text-center py-8 text-muted-foreground"
                >
                  <p className="text-sm">
                    No schedule yet. Complete setup to generate your routine.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Upcoming */}
      {upcomingBlocks.length > 0 && (
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Up Next</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingBlocks.map((block, idx) => (
                <div
                  key={block.id}
                  data-ocid={`dashboard.upcoming.item.${idx + 1}`}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: CATEGORY_COLORS[block.category] }}
                  />
                  <span className="text-sm font-medium flex-1">
                    {block.blockLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {minutesToTime(block.startTime)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
