import { AnimatePresence, motion } from "motion/react";
import { formatMonthName, formatWeekRange } from "@/lib/date-utils";

interface WeekHeaderProps {
  startDate: Date;
  endDate: Date;
  direction?: "prev" | "next";
}

const slideVariants = {
  enter: (xOffset: number) => ({ x: xOffset, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (xOffset: number) => ({ x: -xOffset, opacity: 0 }),
};

const transition = { duration: 0.2, ease: "easeInOut" as const };

export function WeekHeader({ startDate, endDate, direction }: WeekHeaderProps) {
  const monthName = formatMonthName(startDate);
  const weekRange = formatWeekRange(startDate, endDate);
  const xOffset = direction === "prev" ? -30 : 30;

  return (
    <div>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={xOffset}>
          <motion.h1
            key={monthName}
            custom={xOffset}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="text-2xl sm:text-4xl font-bold text-white"
          >
            {monthName}
          </motion.h1>
        </AnimatePresence>
      </div>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={xOffset}>
          <motion.p
            key={weekRange}
            custom={xOffset}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1"
          >
            {weekRange}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
