"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { subDays, addDays, eachDayOfInterval, format, isToday } from "date-fns"
import { cn } from "@/lib/utils"

export type CalendarEvent = {
  id: string
  title: string
  date: string // ISO
  type?: string
}

interface ThreeDWallCalendarProps {
  events: CalendarEvent[]
  onDayClick?: (date: Date) => void
  panelWidth?: number
  panelHeight?: number
  columns?: number
  currentDate?: Date
  onDateChange?: (date: Date) => void
}

export function ThreeDWallCalendar({
  events,
  onDayClick,
  panelWidth = 140,
  panelHeight = 110,
  columns = 8,
  currentDate,
  onDateChange
}: ThreeDWallCalendarProps) {
  const [internalDate, setInternalDate] = React.useState<Date>(new Date())
  const dateRef = currentDate || internalDate;

  const handleSetDateRef = (updater: (d: Date) => Date) => {
    const nextDate = updater(dateRef);
    if (onDateChange) onDateChange(nextDate);
    else setInternalDate(nextDate);
  }

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const wallRef = React.useRef<HTMLDivElement | null>(null)

  // Calculate date bounds from actual events (10 days padding)
  const { minDate, maxDate } = React.useMemo(() => {
    if (!events || events.length === 0) {
      return {
        minDate: subDays(dateRef, 10),
        maxDate: addDays(dateRef, 10)
      };
    }
    const timestamps = events.map(e => new Date(e.date).getTime());
    return {
      minDate: new Date(Math.min(...timestamps)),
      maxDate: new Date(Math.max(...timestamps))
    };
  }, [events, dateRef]);

  const days = eachDayOfInterval({
    start: subDays(minDate, 10),
    end: addDays(maxDate, 10),
  })

  const eventsForDay = (d: Date) =>
    events.filter((ev) => format(new Date(ev.date), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"))

  // wheel tilt (optional, can keep or remove, let's keep it for scrolling scale or extra tilt)
  const onWheel = (e: React.WheelEvent) => {
    // Optional: could add z-zoom here by applying to wallRef
  }

  // fluid parallax tilt (bypasses state to prevent 80-card re-renders)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !wallRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from center (-1 to 1)
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);

    // Max rotation angles - reduced for subtle, smooth tilt
    const maxTiltY = 15;
    const maxTiltX = 10;

    // Inverse rotation: where mouse is, that side comes forward
    const newTiltY = -normalizedX * maxTiltY;
    const newTiltX = 0 + (normalizedY * maxTiltX);

    wallRef.current.style.transform = `rotateX(${newTiltX}deg) rotateY(${newTiltY}deg)`;
  }

  const handlePointerLeave = () => {
    // Smoothly return to center
    if (wallRef.current) {
      wallRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
    }
  }

  const gap = 12
  const rowCount = Math.ceil(days.length / columns)
  const wallCenterRow = (rowCount - 1) / 2

  // Dynamically calculate height to prevent footer overlap
  const gridHeight = rowCount * (panelHeight + gap)
  const containerHeight = Math.max(600, gridHeight + 100)

  return (
    <div className="space-y-6 select-none relative z-10 w-full overflow-visible flex flex-col items-center">
      {/* Wall container */}
      <div
        ref={containerRef}
        onWheel={onWheel}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="w-full flex items-center justify-center overflow-visible"
        style={{ perspective: 1200, minHeight: containerHeight }}
      >
        <div
          ref={wallRef}
          className="mx-auto flex justify-center items-center"
          style={{
            width: columns * (panelWidth + gap),
            transformStyle: "preserve-3d",
            transform: `rotateX(0deg) rotateY(0deg)`,
            transition: "transform 700ms cubic-bezier(0.25, 0.8, 0.25, 1)",
          }}
        >
          <div
            className="relative"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, ${panelWidth}px)`,
              gridAutoRows: `${panelHeight}px`,
              gap: `${gap}px`,
              transformStyle: "preserve-3d",
              padding: gap,
            }}
          >
            {days.map((day, idx) => {
              const row = Math.floor(idx / columns)
              const rowOffset = row - wallCenterRow
              const z = Math.max(-80, 40 - Math.abs(rowOffset) * 20)
              const dayEvents = eventsForDay(day)
              const hasEvents = dayEvents.length > 0
              const isTodayDay = isToday(day)

              let cardClass = "h-full overflow-hidden transition-all duration-300 ";

              if (hasEvents) {
                cardClass += "cursor-pointer pointer-events-auto shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)] group-hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)] ";
                if (isTodayDay) {
                  cardClass += "bg-[var(--accent)] text-white border-[var(--accent)] shadow-[0_0_25px_rgba(var(--accent-rgb),0.5)] group-hover:shadow-[0_0_40px_rgba(var(--accent-rgb),0.7)] ";
                } else {
                  cardClass += "bg-[var(--surface-container)] border-[var(--accent)] ";
                }
              } else {
                cardClass += "bg-[var(--surface)] border-[var(--border)] opacity-60 ";
              }

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative group transition-all duration-500 will-change-transform pointer-events-none",
                    "[transform:translateZ(var(--card-z))]",
                    hasEvents && "hover:[transform:translateZ(120px)_scale(1.15)_translateY(-8px)] hover:z-50"
                  )}
                  onClick={() => hasEvents && onDayClick?.(day)}
                  style={{
                    "--card-z": `${z}px`,
                  } as React.CSSProperties}
                >
                  <Card className={cardClass}>
                    <CardContent className="p-3 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className={cn("text-lg font-display font-bold transition-colors", isTodayDay ? "text-white" : hasEvents ? "text-[var(--accent)]" : "text-[var(--text-muted)]")}>{format(day, "MMM d")}</div>
                        <div className={cn("text-[10px] uppercase tracking-widest transition-colors", isTodayDay ? "text-white/70" : "text-[var(--text-muted)]")}>{format(day, "EEE")}</div>
                      </div>

                      {hasEvents && (
                        <div className={cn("mt-auto text-xs font-medium", isTodayDay ? "text-white/80" : "text-[var(--text-secondary)]")}>
                          {dayEvents.length} map{dayEvents.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </CardContent>

                    {/* Glowing indicator line at bottom if active */}
                    {hasEvents && (
                      <div className={cn("absolute bottom-0 left-0 right-0 h-1 opacity-80", isTodayDay ? "bg-white/30" : "bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]")} />
                    )}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
