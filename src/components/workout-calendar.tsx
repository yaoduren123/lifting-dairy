"use client";

import { useState, useMemo } from "react";
import { format, isSameMonth } from "date-fns";
import { Clock, ArrowRight, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Workout {
  id: number;
  date: Date;
  type: string;
  duration: number | null;
  notes: string | null;
}

interface WorkoutCalendarProps {
  workouts: Workout[];
}

export function WorkoutCalendar({ workouts }: WorkoutCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDateWorkouts, setSelectedDateWorkouts] = useState<{ date: Date; workouts: Workout[] } | null>(null);

  // Derived state to quickly look up workouts by full date string
  const workoutsByDate = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    workouts.forEach((w) => {
      const dateStr = format(new Date(w.date), "yyyy-MM-dd");
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(w);
    });
    return map;
  }, [workouts]);

  // Derived state for current month count
  const workoutsThisMonthCount = useMemo(() => {
    return workouts.filter((w) => isSameMonth(new Date(w.date), currentMonth)).length;
  }, [workouts, currentMonth]);

  // Custom Day Button to overlay dots
  const CustomDayButton = (props: React.ComponentProps<typeof CalendarDayButton>) => {
    const { day, modifiers, className, children, ...rest } = props;
    const dateStr = format(day.date, "yyyy-MM-dd");
    const dayWorkouts = workoutsByDate[dateStr] || [];

    // Deduplicate types for coloring
    const types = Array.from(new Set(dayWorkouts.map(w => w.type)));

    return (
      <CalendarDayButton
        day={day}
        modifiers={modifiers}
        className={className}
        {...rest}
      >
        <span className="relative z-10">{children}</span>
        {dayWorkouts.length > 0 && (
          <div className="absolute bottom-1 right-0 left-0 flex justify-center gap-[2px] z-10">
            {types.map((type, idx) => {
              let colorClass = "bg-primary";
              if (type === "strength") colorClass = "bg-emerald-500";
              else if (type === "cardio") colorClass = "bg-blue-500";
              else if (type === "flexibility") colorClass = "bg-purple-500";

              return (
                <span
                  key={idx}
                  className={`block w-1.5 h-1.5 rounded-full ${colorClass} shadow-sm`}
                />
              );
            })}
          </div>
        )}
      </CalendarDayButton>
    );
  };

  const CustomCaptionLabel = () => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap hidden sm:inline-block">
          {workoutsThisMonthCount} workout{workoutsThisMonthCount !== 1 && "s"}
        </span>
        <Button 
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentMonth(new Date());
          }}
          className="h-6 px-2 text-[10px] ml-1 hidden sm:flex cursor-pointer hover:bg-primary hover:text-primary-foreground font-bold tracking-wider"
        >
          TODAY
        </Button>
      </div>
    );
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayWs = workoutsByDate[dateStr];
    if (dayWs && dayWs.length > 0) {
      if (typeof window !== "undefined" && window.innerWidth < 640) {
        router.push(`/workouts?date=${dateStr}`);
      } else {
        setSelectedDateWorkouts({ date, workouts: dayWs });
      }
    }
  };

  return (
    <>
      <div className="p-2 sm:p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col items-center sm:items-stretch overflow-hidden">
         {/* Mobile stat overlay (since CaptionLabel override might be tight on super small screens) */}
         <div className="sm:hidden flex items-center justify-between w-full mb-4 px-2">
           <h3 className="font-semibold text-sm flex items-center gap-2">
             <CalendarDays className="w-4 h-4 text-orange-500" /> 
             {format(currentMonth, "MMM yyyy")}
           </h3>
           <div className="flex items-center gap-2">
             <Button variant="secondary" size="sm" className="h-6 px-2 text-[10px] font-bold tracking-wider" onClick={() => setCurrentMonth(new Date())}>
               TODAY
             </Button>
             <span className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full font-medium">
               {workoutsThisMonthCount} {workoutsThisMonthCount === 1 ? "workout" : "workouts"}
             </span>
           </div>
         </div>

        <div key={currentMonth.toISOString()} className="w-full h-full animate-in fade-in zoom-in-[0.98] duration-300">
          <Calendar
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            onDayClick={handleDayClick}
            className="w-full h-full flex items-center justify-center [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-day]:w-full [&_.rdp-day]:h-12 sm:[&_.rdp-day]:h-14 md:[&_.rdp-day]:h-16 [&_.rdp-day_button]:w-full [&_.rdp-day_button]:h-full [&_.rdp-day_button]:max-w-full [&_.rdp-day_button]:max-h-full [&_.rdp-table_th]:w-full [&_.rdp-table_th]:h-8"
            components={{
              DayButton: CustomDayButton,
              CaptionLabel: CustomCaptionLabel,
            }}
          />
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground w-full px-2">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Strength</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Cardio</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Flexibility</div>
        </div>
      </div>

      <Dialog open={!!selectedDateWorkouts} onOpenChange={(open) => !open && setSelectedDateWorkouts(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-[family-name:var(--font-barlow-condensed)] text-xl tracking-wide">
              {selectedDateWorkouts && format(selectedDateWorkouts.date, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedDateWorkouts?.workouts.map((workout) => (
              <div key={workout.id} className="flex flex-col gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    workout.type === "strength" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                    workout.type === "cardio" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}>
                    {workout.type}
                  </span>
                  
                  {workout.duration && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {workout.duration} min
                    </span>
                  )}
                </div>

                {workout.notes && (
                   <p className="text-sm text-foreground line-clamp-2 leading-relaxed">&quot;{workout.notes}&quot;</p>
                )}

                <Link href={`/workouts/${workout.id}`} className="mt-1" onClick={() => setSelectedDateWorkouts(null)}>
                  <Button variant="ghost" className="w-full text-sm font-medium justify-between group hover:bg-background h-auto py-2.5 px-3">
                    View full details
                    <ArrowRight className="w-4 h-4 opacity-50 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
