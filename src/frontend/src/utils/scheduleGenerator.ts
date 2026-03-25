import type {
  Category,
  LocalClass,
  LocalRoutineBlock,
  UserPreferences,
} from "../types/planner";

interface RawBlock {
  start: number;
  end: number;
  label: string;
  category: Category;
}

export function generateSchedule(
  wakeTime: number,
  sleepTime: number,
  classes: LocalClass[],
  prefs: UserPreferences,
): LocalRoutineBlock[] {
  const fixed: RawBlock[] = [];

  // Morning routine
  let cursor = wakeTime;
  fixed.push({
    start: cursor,
    end: cursor + 30,
    label: "Morning Routine",
    category: "morning-routine",
  });
  cursor += 30;

  // Morning exercise
  if (prefs.exerciseTiming === "morning") {
    fixed.push({
      start: cursor,
      end: cursor + prefs.exerciseDuration,
      label: "Exercise",
      category: "exercise",
    });
    cursor += prefs.exerciseDuration;
  }

  // Breakfast
  fixed.push({
    start: cursor,
    end: cursor + 30,
    label: "Breakfast",
    category: "meal",
  });

  // Today's classes
  const todayDow = new Date().getDay();
  const todayClasses = classes
    .filter((c) => c.days.includes(todayDow))
    .map((c) => ({
      start: c.startTime,
      end: c.endTime,
      label: c.name,
      category: "class" as Category,
    }))
    .sort((a, b) => a.start - b.start);

  for (const cls of todayClasses) {
    fixed.push(cls);
  }

  // Lunch around noon (720)
  const LUNCH = 720;
  const lunchConflict = fixed.some(
    (b) => b.start < LUNCH + 45 && b.end > LUNCH,
  );
  if (!lunchConflict && LUNCH > wakeTime && LUNCH < sleepTime - 45) {
    fixed.push({
      start: LUNCH,
      end: LUNCH + 45,
      label: "Lunch",
      category: "meal",
    });
  }

  // Dinner around 18:00 (1080)
  const DINNER = 1080;
  const dinnerConflict = fixed.some(
    (b) => b.start < DINNER + 45 && b.end > DINNER,
  );
  if (!dinnerConflict && DINNER > wakeTime && DINNER < sleepTime - 45) {
    fixed.push({
      start: DINNER,
      end: DINNER + 45,
      label: "Dinner",
      category: "meal",
    });
  }

  // Wind-down before sleep
  const windStart = Math.max(sleepTime - 30, wakeTime + 60);
  const windConflict = fixed.some(
    (b) => b.start < sleepTime && b.end > windStart,
  );
  if (!windConflict) {
    fixed.push({
      start: windStart,
      end: sleepTime,
      label: "Wind Down",
      category: "wind-down",
    });
  }

  // Sleep
  const sleepEnd = sleepTime >= 1320 ? sleepTime - 1440 + 480 : sleepTime + 480; // approximate 8h
  fixed.push({
    start: sleepTime,
    end: sleepEnd > sleepTime ? sleepEnd : sleepTime + 480,
    label: "Sleep",
    category: "sleep",
  });

  // Evening exercise
  if (prefs.exerciseTiming === "evening") {
    const exEnd = windStart;
    const exStart = exEnd - prefs.exerciseDuration;
    if (exStart > DINNER + 45 && exStart > wakeTime) {
      const exConflict = fixed.some((b) => b.start < exEnd && b.end > exStart);
      if (!exConflict) {
        fixed.push({
          start: exStart,
          end: exEnd,
          label: "Exercise",
          category: "exercise",
        });
      }
    }
  }

  // Sort fixed blocks
  fixed.sort((a, b) => a.start - b.start);

  // Merge overlapping blocks (keep first)
  const merged: RawBlock[] = [];
  for (const block of fixed) {
    if (merged.length === 0) {
      merged.push(block);
      continue;
    }
    const prev = merged[merged.length - 1];
    if (block.start < prev.end) {
      // overlap: extend or skip
      if (block.end > prev.end) {
        prev.end = block.end;
      }
    } else {
      merged.push(block);
    }
  }

  // Fill gaps with study/break or free time
  const studyBlocks: RawBlock[] = [];
  for (let i = 0; i < merged.length - 1; i++) {
    const gapStart = merged[i].end;
    const gapEnd = merged[i + 1].start;
    let pos = gapStart;

    if (gapEnd - gapStart <= 10) continue;

    if (prefs.pomodoroEnabled) {
      while (pos + prefs.pomodoroStudy <= gapEnd) {
        studyBlocks.push({
          start: pos,
          end: pos + prefs.pomodoroStudy,
          label: "Study Session",
          category: "study",
        });
        pos += prefs.pomodoroStudy;
        if (pos + prefs.pomodoroBreak <= gapEnd) {
          studyBlocks.push({
            start: pos,
            end: pos + prefs.pomodoroBreak,
            label: "Break",
            category: "break",
          });
          pos += prefs.pomodoroBreak;
        }
      }
      if (pos < gapEnd - 5) {
        studyBlocks.push({
          start: pos,
          end: gapEnd,
          label: "Free Time",
          category: "free",
        });
      }
    } else {
      studyBlocks.push({
        start: pos,
        end: gapEnd,
        label: "Study / Free Time",
        category: "study",
      });
    }
  }

  const allBlocks = [...merged, ...studyBlocks].sort(
    (a, b) => a.start - b.start,
  );

  return allBlocks.map((b, i) => ({
    id: i + 1,
    startTime: b.start,
    endTime: b.end,
    blockLabel: b.label,
    category: b.category,
    completed: false,
  }));
}
