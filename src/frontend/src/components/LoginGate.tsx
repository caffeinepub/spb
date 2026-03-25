import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Clock, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginGate() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sun className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">
            DayFlow
          </h1>
          <p className="text-muted-foreground text-base">
            Your personal daily routine planner for college life
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            {
              icon: Calendar,
              label: "Auto-schedule",
              desc: "Generates your perfect day",
            },
            {
              icon: Clock,
              label: "Time blocks",
              desc: "Pomodoro study sessions",
            },
            {
              icon: BookOpen,
              label: "Smart study",
              desc: "45-min focus intervals",
            },
            { icon: Sun, label: "Daily tips", desc: "Motivational messages" },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-card rounded-xl p-4 shadow-xs border border-border"
            >
              <f.icon className="w-5 h-5 text-primary mb-2" />
              <p className="font-semibold text-sm text-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <Button
          data-ocid="login.primary_button"
          className="w-full h-12 text-base font-semibold"
          onClick={login}
          disabled={isLoggingIn || isInitializing}
        >
          {isLoggingIn ? "Connecting..." : "Sign In to Get Started"}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Secure, private login with Internet Identity
        </p>
      </motion.div>
    </div>
  );
}
