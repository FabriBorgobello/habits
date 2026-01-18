import { formatMonthName, formatWeekRange } from "@/lib/date-utils";

interface WeekHeaderProps {
  startDate: Date;
  endDate: Date;
}

export function WeekHeader({ startDate, endDate }: WeekHeaderProps) {
  const monthName = formatMonthName(startDate);
  const weekRange = formatWeekRange(startDate, endDate);

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-white">{monthName}</h1>
      <p className="text-gray-400 text-sm mt-1">{weekRange}</p>
    </div>
  );
}
