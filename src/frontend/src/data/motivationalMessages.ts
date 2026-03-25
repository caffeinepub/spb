export const MOTIVATIONAL_MESSAGES = [
  "Small steps every day lead to big results. Keep going! 🚀",
  "You don't have to be perfect to make progress. Just keep moving forward.",
  "Your future self will thank you for studying today. 📖",
  "Every expert was once a beginner. You're doing great!",
  "Focus on progress, not perfection. One task at a time.",
  "The secret of getting ahead is getting started. — Mark Twain",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "Great things are not done by impulse, but by a series of small things.",
  "You are capable of more than you know. Push a little further today.",
  "Rest when you're weary. Refresh and renew yourself, your body, your mind.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "A day of productive study beats a week of cramming. You've got this!",
  "Your brain is a muscle — exercise it daily! 💪",
  "Take breaks. They're not a sign of weakness, they're a sign of wisdom.",
  "Every assignment you complete is one step closer to your degree.",
  "Hydrate, study, rest, repeat. Consistency is everything.",
  "Challenge yourself — it's the only path that leads to growth.",
  "Today's hard work is tomorrow's success. Keep pushing!",
  "You've survived 100% of your hardest days so far. You've got this.",
  "Start where you are. Use what you have. Do what you can.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Momentum is built one action at a time. What can you do in the next 5 minutes?",
];

export function getDailyMessage(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return MOTIVATIONAL_MESSAGES[dayOfYear % MOTIVATIONAL_MESSAGES.length];
}
