import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { LocalRoutineBlock } from "../types/planner";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../types/planner";
import { minutesToTime, nowMinutes } from "../utils/timeUtils";

interface Props {
  blocks: LocalRoutineBlock[];
  wakeTime: number;
  sleepTime: number;
}

const PX_PER_MIN = 1.5;

export function TimelineView({ blocks, wakeTime, sleepTime }: Props) {
  const [currentMins, setCurrentMins] = useState(nowMinutes);
  const nowLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentMins(nowMinutes()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    nowLineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const dayStart = wakeTime;
  const dayEnd = sleepTime;
  const totalMins = dayEnd - dayStart;
  const totalHeight = totalMins * PX_PER_MIN;

  const hourMarkers: number[] = [];
  const startHour = Math.floor(dayStart / 60);
  const endHour = Math.ceil(dayEnd / 60);
  for (let h = startHour; h <= endHour; h++) {
    hourMarkers.push(h * 60);
  }

  const nowOffset = (currentMins - dayStart) * PX_PER_MIN;
  const isNowVisible = currentMins >= dayStart && currentMins <= dayEnd;

  return (
    <div className="space-y-4">
      <Card className="shadow-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Full Day Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(
              [
                ["class", "Class"],
                ["study", "Study"],
                ["break", "Break"],
                ["meal", "Meal"],
                ["exercise", "Exercise"],
                ["morning-routine", "Morning"],
                ["wind-down", "Wind Down"],
                ["sleep", "Sleep"],
                ["free", "Free"],
              ] as const
            ).map(([cat, label]) => (
              <div key={cat} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ background: CATEGORY_COLORS[cat] }}
                />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div
            className="overflow-y-auto max-h-[600px]"
            data-ocid="timeline.scroll_area"
          >
            <div
              className="relative ml-12"
              style={{ height: `${totalHeight}px`, minHeight: "200px" }}
            >
              {/* Hour grid lines */}
              {hourMarkers.map((mins) => {
                const top = (mins - dayStart) * PX_PER_MIN;
                if (top < 0 || top > totalHeight) return null;
                return (
                  <div
                    key={mins}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top }}
                  >
                    <span
                      className="absolute text-xs text-muted-foreground"
                      style={{
                        left: "-48px",
                        top: "-8px",
                        width: "44px",
                        textAlign: "right",
                      }}
                    >
                      {minutesToTime(mins)}
                    </span>
                  </div>
                );
              })}

              {/* Blocks */}
              {blocks.map((block, idx) => {
                const top = (block.startTime - dayStart) * PX_PER_MIN;
                const height = Math.max(
                  (block.endTime - block.startTime) * PX_PER_MIN,
                  20,
                );
                const isActive =
                  currentMins >= block.startTime && currentMins < block.endTime;

                if (top < 0) return null;

                return (
                  <motion.div
                    key={block.id}
                    data-ocid={`timeline.block.item.${idx + 1}`}
                    initial={{ opacity: 0, scaleX: 0.95 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`absolute left-1 right-2 rounded-md px-2 py-1 overflow-hidden transition-shadow ${
                      isActive ? "ring-2 ring-offset-1 shadow-md" : ""
                    }`}
                    style={
                      {
                        top,
                        height,
                        background: `${CATEGORY_COLORS[block.category]}25`,
                        borderLeft: `3px solid ${CATEGORY_COLORS[block.category]}`,
                        ringColor: isActive
                          ? CATEGORY_COLORS[block.category]
                          : undefined,
                      } as React.CSSProperties
                    }
                  >
                    {height > 24 && (
                      <div className="flex items-center gap-1 h-full">
                        <span className="text-xs">
                          {CATEGORY_ICONS[block.category]}
                        </span>
                        <span
                          className="text-xs font-medium truncate"
                          style={{ color: CATEGORY_COLORS[block.category] }}
                        >
                          {block.blockLabel}
                        </span>
                        {height > 40 && (
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {minutesToTime(block.startTime)}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Current time indicator */}
              {isNowVisible && (
                <div
                  ref={nowLineRef}
                  data-ocid="timeline.now_indicator"
                  className="absolute left-0 right-0 z-10 flex items-center"
                  style={{ top: nowOffset }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                  <span className="text-xs text-red-500 font-medium pl-1 shrink-0">
                    {minutesToTime(currentMins)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
