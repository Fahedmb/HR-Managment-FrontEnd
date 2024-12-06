import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

type User = {
  id?: number;
  firstName?: string;
  lastName?: string;
};

// Define a unified event type
type CalendarEvent = {
  id: number;
  date: string;       // YYYY-MM-DD
  type: 'TIMESHEET' | 'LEAVE';
  status: string;     // For LEAVE: PENDING/APPROVED/REJECTED, For TIMESHEET: PENDING/APPROVED/REJECTED
  hoursWorked?: number;   // Only for TIMESHEET
  reason?: string;        // Only for LEAVE
};

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // Fetch user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error("Failed to parse user data:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // We fetch timesheets and leave requests and combine them
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all timesheets
        const tsResponse = await axios.get(`http://localhost:9090/api/time-sheets/user/${user.id}`, { headers });
        const allTimesheets: CalendarEvent[] = tsResponse.data.map((ts: any) => ({
          id: ts.id,
          date: ts.date, // Ensure backend returns YYYY-MM-DD
          type: 'TIMESHEET',
          status: ts.status,
          hoursWorked: ts.hoursWorked
        }));

        // Fetch all leave requests
        const lrResponse = await axios.get(`http://localhost:9090/api/leave-requests/user/${user.id}`, { headers });
        const allLeaves: CalendarEvent[] = [];
        for (const lr of lrResponse.data) {
          // lr has startDate and endDate, both YYYY-MM-DD
          const start = new Date(lr.startDate);
          const end = new Date(lr.endDate);

          // Generate an event for each day in the leave range
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            allLeaves.push({
              id: lr.id,
              date: dateStr,
              type: 'LEAVE',
              status: lr.status, // PENDING, APPROVED, REJECTED
              reason: lr.reason
            });
          }
        }

        // Filter events for the current month/year
        const filteredEvents = [...allTimesheets, ...allLeaves].filter(ev => {
          const evDate = new Date(ev.date);
          return evDate.getMonth() === currentMonth && evDate.getFullYear() === currentYear;
        });

        setEvents(filteredEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchData();
  }, [currentMonth, currentYear, user]);

  // Helper function to get days in month
  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDay = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const totalDays = daysInMonth(currentMonth, currentYear);
    const calendarCells: (number | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDay; i++) {
      calendarCells.push(null);
    }

    // Add days of current month
    for (let day = 1; day <= totalDays; day++) {
      calendarCells.push(day);
    }

    return calendarCells;
  };

  const calendarCells = generateCalendarDays();

  // Split into weeks (rows)
  const rows = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    rows.push(calendarCells.slice(i, i + 7));
  }

  const getEventsForDay = (day: number | null): CalendarEvent[] => {
    if (!day) return [];
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(ev => ev.date === dateStr);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const goToPreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Determine border color based on event type and status
  const getEventBorderColor = (event: CalendarEvent) => {
    if (event.type === 'TIMESHEET') {
      // Keep the existing primary border
      return 'border-primary';
    } else if (event.type === 'LEAVE') {
      if (event.status === 'PENDING') {
        return 'border-yellow-500';
      } else if (event.status === 'APPROVED') {
        return 'border-green-500';
      } else if (event.status === 'REJECTED') {
        return 'border-red-500';
      } else {
        return 'border-stroke'; // fallback
      }
    }
    return 'border-stroke';
  };

  return (
    <>
      <Breadcrumb pageName="Calendar" />
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="rounded border border-stroke bg-white py-2 px-4 text-sm font-medium hover:bg-gray dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-meta-4"
        >
          Prev
        </button>
        <h2 className="text-xl font-semibold text-black dark:text-white">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button
          onClick={goToNextMonth}
          className="rounded border border-stroke bg-white py-2 px-4 text-sm font-medium hover:bg-gray dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-meta-4"
        >
          Next
        </button>
      </div>

      <div className="w-full max-w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <table className="w-full">
          <thead>
          <tr className="grid grid-cols-7 rounded-t-sm bg-primary text-white">
            <th className="flex h-15 items-center justify-center rounded-tl-sm p-1 text-xs font-semibold sm:text-base xl:p-5">
              <span className="hidden lg:block">Sunday</span>
              <span className="block lg:hidden">Sun</span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-xs font-semibold sm:text-base xl:p-5">
              <span className="hidden lg:block">Monday</span>
              <span className="block lg:hidden">Mon</span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-xs font-semibold sm:text-base xl:p-5">
              <span className="hidden lg:block">Tuesday</span>
              <span className="block lg:hidden">Tue</span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-xs font-semibold sm:text-base xl:p-5">
              <span className="hidden lg:block">Wednesday</span>
              <span className="block lg:hidden">Wed</span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-xs font-semibold sm:text-base xl:p-5">
              <span className="hidden lg:block">Thursday</span>
              <span className="block lg:hidden">Thur</span>
            </th>
            <th className="flex h-15 items-center justify-center p-1 text-xs font-semibold sm:text-base xl:p-5">
              <span className="hidden lg:block">Friday</span>
              <span className="block lg:hidden">Fri</span>
            </th>
            <th className="flex h-15 items-center justify-center rounded-tr-sm p-1 text-xs font-semibold sm:text-base xl:p-5">
              <span className="hidden lg:block">Saturday</span>
              <span className="block lg:hidden">Sat</span>
            </th>
          </tr>
          </thead>
          <tbody>
          {rows.map((week, rowIndex) => (
            <tr className="grid grid-cols-7" key={rowIndex}>
              {week.map((day, dayIndex) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <td
                    key={dayIndex}
                    className="ease relative h-20 cursor-pointer border border-stroke p-2 transition duration-500 hover:bg-gray dark:border-strokedark dark:hover:bg-meta-4 md:h-25 md:p-6 xl:h-31"
                  >
                    {day && (
                      <span className="font-medium text-black dark:text-white">
                          {day}
                        </span>
                    )}
                    {dayEvents.length > 0 && (
                      <div className="group h-16 w-full flex-grow cursor-pointer py-1 md:h-30 relative">
                        <span className="group-hover:text-primary md:hidden">More</span>
                        <div
                          className={`event invisible absolute left-2 z-99 mb-1 flex w-[200%] flex-col rounded-sm px-3 py-1 text-left opacity-0 group-hover:visible group-hover:opacity-100 dark:bg-meta-4 md:visible md:w-[190%] md:opacity-100 bg-gray`}
                          style={{ transition: 'opacity 0.2s' }}
                        >
                          {dayEvents.map(ev => {
                            const borderColor = getEventBorderColor(ev);
                            return (
                              <div key={ev.id} className={`mb-1 border-l-4 pl-2 ${borderColor}`}>
                                {ev.type === 'TIMESHEET' ? (
                                  <>
                                      <span className="event-name text-sm font-semibold text-black dark:text-white block">
                                        Hours: {ev.hoursWorked}
                                      </span>
                                    <span className="time text-sm font-medium text-black dark:text-white block">
                                        Status: {ev.status}
                                      </span>
                                  </>
                                ) : (
                                  // LEAVE event
                                  <>
                                      <span className="event-name text-sm font-semibold text-black dark:text-white block">
                                        Reason: {ev.reason}
                                      </span>
                                    <span className="time text-sm font-medium text-black dark:text-white block">
                                        Status: {ev.status}
                                      </span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Calendar;
