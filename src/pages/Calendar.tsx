import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Video, Briefcase, CheckSquare, CalendarRange, Filter, X
} from 'lucide-react';
import { meetingsApi, leaveApi, projectsApi, tasksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  isSameMonth, isSameDay, isToday, parseISO, addMonths, subMonths
} from 'date-fns';

type EventType = 'MEETING' | 'LEAVE' | 'DEADLINE' | 'TASK';

interface CalEvent {
  id: number;
  type: EventType;
  title: string;
  date: Date;
  endDate?: Date;
  status?: string;
  color: string;
  bg: string;
}

const TYPE_META: Record<EventType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  MEETING:  { label: 'Meeting',  color: 'text-blue-700',   bg: 'bg-blue-100',   icon: <Video className="w-3.5 h-3.5" /> },
  LEAVE:    { label: 'Leave',    color: 'text-amber-700',  bg: 'bg-amber-100',  icon: <CalendarRange className="w-3.5 h-3.5" /> },
  DEADLINE: { label: 'Deadline', color: 'text-red-700',    bg: 'bg-red-100',    icon: <Briefcase className="w-3.5 h-3.5" /> },
  TASK:     { label: 'Task Due', color: 'text-purple-700', bg: 'bg-purple-100', icon: <CheckSquare className="w-3.5 h-3.5" /> },
};

const ALL_TYPES: EventType[] = ['MEETING', 'LEAVE', 'DEADLINE', 'TASK'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set(ALL_TYPES));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    Promise.all([
      meetingsApi.getAll().catch(() => ({ data: [] })),
      (user.role === 'HR' ? leaveApi.getAll() : leaveApi.getByUser(user.id)).catch(() => ({ data: [] })),
      projectsApi.getAll().catch(() => ({ data: [] })),
      tasksApi.getByAssignee(user.id).catch(() => ({ data: [] })),
    ]).then(([meetRes, leaveRes, projRes, taskRes]) => {
      const result: CalEvent[] = [];

      // Meetings
      for (const m of (meetRes.data as any[])) {
        try {
          const d = parseISO(m.startTime ?? m.date);
          result.push({
            id: m.id, type: 'MEETING', title: m.title, date: d,
            endDate: m.endTime ? parseISO(m.endTime) : undefined,
            status: m.status, color: TYPE_META.MEETING.color, bg: TYPE_META.MEETING.bg,
          });
        } catch {}
      }

      // Leave requests — expand each request into daily events
      for (const lr of (leaveRes.data as any[])) {
        if (lr.status === 'REJECTED' || lr.status === 'CANCELLED') continue;
        try {
          const start = parseISO(lr.startDate);
          const end = parseISO(lr.endDate);
          const label = `${lr.type}${user.role === 'HR' && lr.firstName ? ` — ${lr.firstName} ${lr.lastName}` : ''}`;
          for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
            result.push({
              id: lr.id, type: 'LEAVE', title: label, date: new Date(d),
              status: lr.status, color: TYPE_META.LEAVE.color, bg: TYPE_META.LEAVE.bg,
            });
          }
        } catch {}
      }

      // Project deadlines
      for (const p of (projRes.data as any[])) {
        if (!p.deadline) continue;
        try {
          result.push({
            id: p.id, type: 'DEADLINE', title: p.name, date: parseISO(p.deadline),
            status: p.status, color: TYPE_META.DEADLINE.color, bg: TYPE_META.DEADLINE.bg,
          });
        } catch {}
      }

      // Task due dates
      for (const t of (taskRes.data as any[])) {
        if (!t.dueDate) continue;
        try {
          result.push({
            id: t.id, type: 'TASK', title: t.title, date: parseISO(t.dueDate),
            status: t.status, color: TYPE_META.TASK.color, bg: TYPE_META.TASK.bg,
          });
        } catch {}
      }

      setEvents(result);
      setLoading(false);
    });
  }, [user]);

  const eventsForDay = (day: Date) =>
    events.filter(e => activeFilters.has(e.type) && isSameDay(e.date, day));

  const monthEventsCount = useMemo(() =>
    events.filter(e => activeFilters.has(e.type) && isSameMonth(e.date, month)).length,
    [events, activeFilters, month]
  );

  // Build calendar grid (6 rows × 7 cols)
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(new Date(d));

  const toggleFilter = (t: EventType) =>
    setActiveFilters(prev => { const s = new Set(prev); s.has(t) ? s.delete(t) : s.add(t); return s; });

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : [];

  return (
    <>
      <Breadcrumb pageName="Calendar" />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="flex items-center gap-1 text-xs text-gray-400 font-medium"><Filter className="w-3.5 h-3.5" />Filter:</span>
        {ALL_TYPES.map(t => {
          const { label, color, bg, icon } = TYPE_META[t];
          const active = activeFilters.has(t);
          return (
            <button key={t} onClick={() => toggleFilter(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all select-none
                ${active ? `${bg} ${color} border-transparent` : 'bg-white dark:bg-boxdark text-gray-400 border-stroke dark:border-strokedark opacity-50'}`}>
              {icon}{label}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-gray-400 font-medium">{monthEventsCount} event{monthEventsCount !== 1 ? 's' : ''} this month</span>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark">
          <button onClick={() => setMonth(m => subMonths(m, 1))}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-black dark:text-white">
              {format(month, 'MMMM yyyy')}
            </h2>
            <button onClick={() => { const t = new Date(); setMonth(t); setSelectedDay(t); }}
              className="ml-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              Today
            </button>
          </div>
          <button onClick={() => setMonth(m => addMonths(m, 1))}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-stroke dark:border-strokedark">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-stroke dark:divide-strokedark">
            {days.map(day => {
              const dayEvts = eventsForDay(day);
              const inMonth = isSameMonth(day, month);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);

              return (
                <div key={day.toISOString()} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[88px] p-1.5 cursor-pointer transition-colors select-none
                    ${inMonth ? 'bg-white dark:bg-boxdark' : 'bg-gray-50/60 dark:bg-boxdark-2'}
                    ${isSelected ? 'ring-2 ring-inset ring-primary' : 'hover:bg-blue-50/60 dark:hover:bg-meta-4'}`}>
                  <div className={`w-7 h-7 flex items-center justify-center mx-auto rounded-full text-sm mb-1 font-medium
                    ${today ? 'bg-primary text-white font-bold'
                    : inMonth ? 'text-black dark:text-white'
                    : 'text-gray-300 dark:text-gray-600'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvts.slice(0, 3).map((e, i) => (
                      <div key={`${e.type}-${e.id}-${i}`}
                        className={`flex items-center gap-1 px-1 py-0.5 rounded text-[11px] leading-tight truncate ${e.bg} ${e.color}`}>
                        {TYPE_META[e.type].icon}
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                    {dayEvts.length > 3 && (
                      <div className="text-[11px] text-gray-400 text-center leading-tight">+{dayEvts.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day detail panel */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div key="day-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="mt-4 rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span className="font-semibold text-black dark:text-white">
                  {format(selectedDay, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <button onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No events on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map((e, i) => {
                  const meta = TYPE_META[e.type];
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl ${meta.bg}`}>
                      <div className={`flex-shrink-0 ${meta.color}`}>{meta.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${meta.color}`}>{e.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {e.endDate && (
                            <span className="text-xs text-gray-500">
                              {format(e.date, 'HH:mm')} – {format(e.endDate, 'HH:mm')}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{meta.label}</span>
                          {e.status && <span className="text-xs text-gray-400">· {e.status}</span>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Calendar;
