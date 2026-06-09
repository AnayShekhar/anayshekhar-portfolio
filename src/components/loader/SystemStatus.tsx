"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SYSTEM_MESSAGES } from "@/lib/content";

const LOG_TRANSITION = { duration: 0.3, ease: "easeInOut" as const };

type SystemStatusProps = {
  message: "stabilized" | "awaiting" | null;
};

export function SystemStatus({ message }: SystemStatusProps) {
  return (
    <div className="pointer-events-none relative mt-6 h-6 w-full font-mono text-xs text-mono-tag">
      <AnimatePresence mode="wait">
        {message && (
          <motion.p
            key={message}
            className="absolute inset-x-0 top-0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={LOG_TRANSITION}
          >
            {message === "stabilized"
              ? SYSTEM_MESSAGES.stabilized
              : SYSTEM_MESSAGES.awaiting}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
