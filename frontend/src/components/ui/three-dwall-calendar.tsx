"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns"
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
  const isDragging = React.useRef(false)
  const dragStart = React.useRef<{ x: number; y: number } | null>(null)

  // month days
  const days = eachDayOfInterval({
    start: startOfMonth(dateRef),
    end: endOfMonth(dateRef),
  })

  const eventsForDay = (d: Date) =>
    events.filter((ev) => format(new Date(ev.date), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"))

  // wheel tilt
  const onWheel = (e: React.WheelEvent) => {
    setTiltX((t) => Math.max(0, Math.min(50, t + e.deltaY * 0.02)))
    setTiltY((t) => Math.max(-45, Math.min(45, t + e.deltaX * 0.05)))
  }

  // drag tilt
  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setTiltY((t) => Math.max(-60, Math.min(60, t + dx * 0.1)))
    setTiltX((t) => Math.max(0, Math.min(60, t - dy * 0.1)))
    dragStart.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = () => {
    isDragging.current = false
    dragStart.current = null
  }

  const gap = 12
  const rowCount = Math.ceil(days.length / columns)
  const wallCenterRow = (rowCount - 1) / 2

  return (
    <div className="space-y-6 select-none relative z-10 w-full overflow-hidden flex flex-col items-center">
      <div className="flex gap-4 items-center bg-[var(--surface-container)] px-6 py-2 rounded-full border border-[var(--border)] shadow-md z-20">
        <button 
          onClick={() => handleSetDateRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          Prev Month
        </button>
        <div className="text-lg font-display font-medium w-40 text-center text-[var(--text-primary)]">
          {format(dateRef, "MMMM yyyy")}
        </div>
        <button 
          onClick={() => handleSetDateRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          Next Month
        </button>
      </div>

      {/* Wall container */}
      <div
        ref={wallRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="w-full h-[600px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-visible"
        style={{ perspective: 1200 }}
      >
        <div
          className="mx-auto flex justify-center items-center"
          style={{
            width: columns * (panelWidth + gap),
            transformStyle: "preserve-3d",
            transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            transition: "transform 120ms linear",
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
                ? "h-full overflow-hidden bg-[var(--surface-container)] border border-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.3)] transition-all duration-300 hover:scale-105 cursor-pointer" 
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
