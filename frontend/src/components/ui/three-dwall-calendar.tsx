"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { subDays, addDays, eachDayOfInterval, format } from "date-fns"
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
  columns = 7,
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

  const wallRef = React.useRef<HTMLDivElement | null>(null)

  // 3D tilt state
  const [tiltX, setTiltX] = React.useState(25)
  const [tiltY, setTiltY] = React.useState(0)

  // 80 days continuous wall
  const days = eachDayOfInterval({
    start: subDays(dateRef, 40),
    end: addDays(dateRef, 40),
  })

  const eventsForDay = (d: Date) =>
    events.filter((ev) => format(new Date(ev.date), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"))

  // wheel tilt (optional, can keep or remove, let's keep it for scrolling scale or extra tilt)
  const onWheel = (e: React.WheelEvent) => {
    setTiltX((t) => Math.max(0, Math.min(50, t + e.deltaY * 0.02)))
    setTiltY((t) => Math.max(-45, Math.min(45, t + e.deltaX * 0.05)))
  }

  // fluid parallax tilt
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!wallRef.current) return;
    const rect = wallRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center (-1 to 1)
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);

    // Max rotation angles
    const maxTiltY = 45; 
    const maxTiltX = 35;
    
    setTiltY(normalizedX * maxTiltY); 
    setTiltX(25 - (normalizedY * maxTiltX));
  }

  const handlePointerLeave = () => {
    // Smoothly return to center
    setTiltX(25);
    setTiltY(0);
  }

  const gap = 12
  const rowCount = Math.ceil(days.length / columns)
  const wallCenterRow = (rowCount - 1) / 2

  return (
    <div className="space-y-6 select-none relative z-10 w-full overflow-hidden flex flex-col items-center">
      {/* Wall container */}
      <div
        ref={wallRef}
        onWheel={onWheel}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="w-full h-[600px] flex items-center justify-center overflow-visible"
        style={{ perspective: 1200 }}
      >
        <div
          className="mx-auto flex justify-center items-center"
          style={{
            width: columns * (panelWidth + gap),
            transformStyle: "preserve-3d",
            transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            transition: "transform 300ms cubic-bezier(0.25, 0.8, 0.25, 1)",
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
              
              // Only highlight the whole card if it has events
              const cardClass = hasEvents 
                ? "h-full overflow-hidden bg-[var(--surface-container)] border border-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.4)] transition-all duration-300 hover:scale-[1.15] hover:-translate-y-2 hover:z-50 cursor-pointer" 
                : "h-full overflow-hidden bg-[var(--surface)] border border-[var(--border)] opacity-60";

              return (
                <div
                  key={day.toISOString()}
                  className="relative group"
                  onClick={() => hasEvents && onDayClick?.(day)}
                  style={{
                    transform: `translateZ(${z}px)`,
                    zIndex: Math.round(100 - Math.abs(rowOffset)),
                  }}
                >
                  <Card className={cardClass}>
                    <CardContent className="p-3 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className={cn("text-lg font-display font-bold", hasEvents ? "text-[var(--accent)]" : "text-[var(--text-muted)]")}>{format(day, "d")}</div>
                        <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{format(day, "EEE")}</div>
                      </div>

                      {hasEvents && (
                        <div className="mt-auto text-xs font-medium text-[var(--text-secondary)]">
                          {dayEvents.length} map{dayEvents.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </CardContent>
                    
                    {/* Glowing indicator line at bottom if active */}
                    {hasEvents && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] opacity-80" />
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
