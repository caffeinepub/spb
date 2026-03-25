# Student Day Planner

## Current State
New project -- no existing application files.

## Requested Changes (Diff)

### Add
- Setup screen: wake-up time, sleep time, college class schedule, personal preferences (exercise, meal times, study preferences)
- Auto-generated daily schedule with time blocks: wake-up, morning routine, meals, study sessions, breaks, classes, exercise, sleep
- Visual timeline view: full day hour-by-hour with color-coded blocks
- Pomodoro-style smart intervals: 45 min study + 15 min break cycles
- "What should I do now?" feature: real-time current task based on current time
- Motivational messages and student tips (rotated daily/randomly)
- Routine customization: drag/edit time blocks, save custom routines
- Dashboard: today's schedule, progress bar, tasks completed vs remaining
- Motoko backend: save/load user routines, preferences, task completion state

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend (Motoko): store user profile (wake/sleep times, preferences), class schedule entries, routine time blocks, task completion records
2. Backend APIs: saveProfile, getProfile, saveRoutine, getRoutine, markTaskComplete, getCompletionStatus
3. Frontend pages:
   - Setup wizard (multi-step: times → classes → preferences)
   - Dashboard (current task highlight, progress tracking, today's timeline)
   - Timeline view (hour-by-hour visual blocks)
   - Routine editor (customize blocks)
4. Auto-schedule generation logic on frontend from user inputs
5. Pomodoro interval logic for study blocks
6. Real-time "What to do now" computed from current time vs schedule
7. Motivational quotes/tips component
