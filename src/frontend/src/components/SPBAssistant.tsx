import { Bot, Mic, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { nowMinutes } from "../utils/timeUtils";

interface Props {
  currentBlockName?: string;
  currentBlockEnd?: number;
}

const GREETINGS = [
  "Hello! I'm your SPB assistant. Let's have a productive day!",
  "Welcome back! SPB is here to keep you on track. You've got this!",
  "Hey there! Ready to crush your schedule today? Let's go!",
];

const TIPS = [
  "Remember to stay hydrated. Drink water every hour!",
  "Taking short breaks boosts your focus. Use your break time wisely!",
  "Great students review their notes within 24 hours of class.",
  "Consistency beats perfection. Keep showing up every day!",
  "Your future self will thank you for the effort you put in today.",
  "Sleep is your brain's reset button. Don't skip it!",
];

function formatRemaining(endMinutes: number): string {
  const now = nowMinutes();
  const diff = endMinutes - now;
  if (diff <= 0) return "ending soon";
  if (diff < 60) return `${diff} minute${diff !== 1 ? "s" : ""} remaining`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0
    ? `${h} hour${h !== 1 ? "s" : ""} and ${m} minutes remaining`
    : `${h} hour${h !== 1 ? "s" : ""} remaining`;
}

export function SPBAssistant({ currentBlockName, currentBlockEnd }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [bubble, setBubble] = useState("");
  const [showBubble, setShowBubble] = useState(false);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasGreeted = useRef(false);

  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!canSpeak) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(
        (v) => v.lang.startsWith("en") && !v.name.includes("Google"),
      ) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0] ||
      null
    );
  }, [canSpeak]);

  const speak = useCallback(
    (text: string) => {
      if (!canSpeak) {
        setBubble(text);
        setShowBubble(true);
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = setTimeout(() => setShowBubble(false), 4000);
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1.05;
      utter.volume = 0.9;
      const voice = getVoice();
      if (voice) utter.voice = voice;

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);

      setBubble(text);
      setShowBubble(true);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(
        () => setShowBubble(false),
        Math.max(4000, text.length * 60),
      );

      window.speechSynthesis.speak(utter);
    },
    [canSpeak, getVoice],
  );

  // Greet on load
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    // Delay slightly so voices load
    const t = setTimeout(() => speak(greeting), 1500);
    return () => clearTimeout(t);
  }, [speak]);

  // 30-minute interval announcements
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (currentBlockName && currentBlockEnd !== undefined) {
          const remaining = formatRemaining(currentBlockEnd);
          speak(
            `Time for your ${currentBlockName}. ${remaining}. Stay focused!`,
          );
        } else {
          const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
          speak(tip);
        }
      },
      30 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [speak, currentBlockName, currentBlockEnd]);

  // Listen for task completion events from Dashboard
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ name: string }>;
      speak(`Great job completing ${custom.detail.name}! Keep it up!`);
    };
    window.addEventListener("spb:taskCompleted", handler);
    return () => window.removeEventListener("spb:taskCompleted", handler);
  }, [speak]);

  const handleButtonClick = useCallback(() => {
    if (currentBlockName && currentBlockEnd !== undefined) {
      const remaining = formatRemaining(currentBlockEnd);
      speak(`You are currently in ${currentBlockName}. ${remaining}.`);
    } else {
      const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
      speak(tip);
    }
  }, [speak, currentBlockName, currentBlockEnd]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      data-ocid="assistant.panel"
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showBubble && bubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative max-w-xs rounded-2xl rounded-br-sm px-4 py-3 shadow-xl text-sm"
            style={{
              background: "linear-gradient(135deg, #1a1060 0%, #0d0530 100%)",
              border: "1px solid rgba(130,100,255,0.4)",
              color: "#e8e0ff",
            }}
          >
            <button
              type="button"
              data-ocid="assistant.close_button"
              onClick={() => setShowBubble(false)}
              className="absolute top-1 right-1 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="pr-3 leading-relaxed">{bubble}</p>
            {/* triangle tail */}
            <div className="absolute -bottom-2 right-4 w-4 h-2 overflow-hidden">
              <div
                className="w-4 h-4 rotate-45 -translate-y-2"
                style={{
                  background: "#0d0530",
                  border: "1px solid rgba(130,100,255,0.4)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assistant button */}
      <button
        type="button"
        data-ocid="assistant.button"
        onClick={handleButtonClick}
        aria-label="SPB Assistant - click to hear current task"
        className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #5533ff 0%, #9922ff 100%)",
          boxShadow: isSpeaking
            ? "0 0 0 4px rgba(140,80,255,0.3), 0 0 24px rgba(140,80,255,0.6), 0 4px 20px rgba(0,0,0,0.4)"
            : "0 0 0 2px rgba(140,80,255,0.2), 0 4px 16px rgba(0,0,0,0.35)",
        }}
      >
        {isSpeaking ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 0.6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Mic className="w-6 h-6 text-white" />
          </motion.div>
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
        {/* Pulse ring when speaking */}
        {isSpeaking && (
          <motion.span
            className="absolute inset-0 rounded-full"
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut",
            }}
            style={{ background: "rgba(130,80,255,0.4)" }}
          />
        )}
      </button>

      {/* Label */}
      <span
        className="text-xs font-medium"
        style={{ color: "rgba(200,180,255,0.8)" }}
      >
        SPB Assistant
      </span>
    </div>
  );
}
