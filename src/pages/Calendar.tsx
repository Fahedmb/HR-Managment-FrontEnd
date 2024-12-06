import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

type User = {
  id?: number;
  firstName?: string;
  lastName?: string;
  // ... other fields if needed
};

type TimeSheetEvent = {
  id: number;
  date: string;       // in YYYY-MM-DD format
  hoursWorked: number;
  status: string;
};

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [events, setEvents] = useState<TimeSheetEvent[]>([]);
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

  // Fetch timesheet events whenever month/year changes or user updates
  useEffect(() => {
    if (!user || !user.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // We will fetch the user's timesheets for the given month/year
    // and treat each timesheet as an event on its date.
    // Adjust the endpoint as needed if you have month/year filters in the backend.
    // For now, we fetch all and filter client-side.
    axios.get(`http://localhost:9090/api/time-sheets/user/${user.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        const allSheets: TimeSheetEvent[] = response.data.map((ts: any) => ({
          id: ts.id,
          date: ts.date, // Ensure this is in YYYY-MM-DD format as per your backend
          hoursWorked: ts.hoursWorked,
          status: ts.status
        }));

        // Filter events for the current month/year
        const filtered = allSheets.filter(ev => {
          const evDate = new Date(ev.date);
          return evDate.getMonth() === currentMonth && evDate.getFullYear() === currentYear;
        });
        setEvents(filtered);
      })
      .catch(err => {
        console.error("Error fetching timesheets:", err);
      });
  }, [currentMonth, currentYear, user]);

  // Helper function to get days in month
  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get array of days for the calendar
  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, daysInMonth(currentMonth, currentYear));

    const startDay = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const endDay = lastDayOfMonth.getDay();

    const totalDays = daysInMonth(currentMonth, currentYear);

    // Number of days from previous month to display
    // For simplicity, we won't show previous/next month days in this example,
    // but if you want a full calendar view, uncomment this logic:
    // const prevMonthDaysToShow = startDay;
    // const nextMonthDaysToShow = 6 - endDay;

    // We'll just leave blank cells at the start.
    const calendarCells: (number | null)[] = [];

    // Add empty cells for days before the first day of month (if you want the full calendar)
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

  // Function to get events for a specific day
  const getEventsForDay = (day: number | null): TimeSheetEvent[] => {
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
                      <div className="group h-16 w-full flex-grow cursor-pointer py-1 md:h-30">
                          <span className="group-hover:text-primary md:hidden">
                            More
                          </span>
                        <div className="event invisible absolute left-2 z-99 mb-1 flex w-[200%] flex-col rounded-sm border-l-[3px] border-primary bg-gray px-3 py-1 text-left opacity-0 group-hover:visible group-hover:opacity-100 dark:bg-meta-4 md:visible md:w-[190%] md:opacity-100">
                          {dayEvents.map(ev => (
                            <div key={ev.id}>
                                <span className="event-name text-sm font-semibold text-black dark:text-white">
                                  Hours: {ev.hoursWorked}
                                </span>
                              <span className="time text-sm font-medium text-black dark:text-white">
                                  Status: {ev.status}
                                </span>
                            </div>
                          ))}
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
