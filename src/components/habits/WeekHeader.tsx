import { formatMonthName, formatWeekRange } from "@/lib/date-utils";

interface WeekHeaderProps {
  startDate: Date;
  endDate: Date;
}

export function WeekHeader({ startDate, endDate }: WeekHeaderProps) {
  const monthName = formatMonthName(startDate);
  const weekRange = formatWeekRange(startDate, endDate);

  return (
    <div>
      <h1 className="text-2xl sm:text-4xl font-bold text-white">{monthName}</h1>
      <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">{weekRange}</p>
    </div>
  );
}
