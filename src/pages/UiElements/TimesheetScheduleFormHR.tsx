// TimesheetScheduleForm.tsx (No comments, final)
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

enum DayOfWeekEnum {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

interface TimesheetSchedule {
  id?: number;
  userId: number;
  chosenDays: DayOfWeekEnum[];
  startTime: string;
  totalHoursPerWeek: number;
  hoursPerDay: number;
  status?: string;
  createdAt?: string;
}

const TimesheetScheduleFormHR: React.FC = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [chosenDays, setChosenDays] = useState<DayOfWeekEnum[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const totalHoursPerWeek = 40;
  const hoursPerDay = chosenDays.length > 0 ? Math.floor(totalHoursPerWeek / chosenDays.length) : 0;
  const [errorMessage, setErrorMessage] = useState<string|null>(null);
  const [successMessage, setSuccessMessage] = useState<string|null>(null);
  const [existingSchedule, setExistingSchedule] = useState<TimesheetSchedule|null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setUserId(parsedUser.id);
        }
        setToken(storedToken);
      } catch (err) {}
    }
  }, []);

  useEffect(() => {
    if (!userId || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`http://localhost:9090/api/timesheet-schedules/user/${userId}`, { headers })
      .then(res => {
        if (res.data) {
          setExistingSchedule(res.data);
          setChosenDays(res.data.chosenDays);
          setStartTime(res.data.startTime);
        }
      })
      .catch(() => {});
  }, [userId, token]);

  const handleDayChange = (day: DayOfWeekEnum) => {
    if (existingSchedule && (existingSchedule.status === 'PENDING' || existingSchedule.status === 'PENDING_DELETION')) return;
    if (chosenDays.includes(day)) {
      setChosenDays(chosenDays.filter(d => d !== day));
    } else {
      setChosenDays([...chosenDays, day]);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!userId || !token) {
      setErrorMessage("You are not logged in.");
      return;
    }
    if (existingSchedule && (existingSchedule.status === 'PENDING' || existingSchedule.status === 'PENDING_DELETION')) {
      setErrorMessage("Wait for HR review before making changes.");
      return;
    }
    if (chosenDays.length === 0) {
      setErrorMessage("Please select at least one day.");
      return;
    }
    if (!startTime) {
      setErrorMessage("Please select a start time.");
      return;
    }
    const dto: TimesheetSchedule = {
      userId: userId,
      chosenDays: chosenDays,
      startTime: startTime,
      totalHoursPerWeek: totalHoursPerWeek,
      hoursPerDay: hoursPerDay
    };
    const headers = { Authorization: `Bearer ${token}` };
    try {
      if (existingSchedule && existingSchedule.id) {
        dto.id = existingSchedule.id;
        await axios.put(`http://localhost:9090/api/timesheet-schedules/${existingSchedule.id}`, dto, { headers });
        setSuccessMessage("Your weekly timesheet schedule has been updated and is pending HR approval!");
      } else {
        await axios.post('http://localhost:9090/api/timesheet-schedules', dto, { headers });
        setSuccessMessage("Your weekly timesheet schedule has been submitted and is pending HR approval!");
      }
      axios.get(`http://localhost:9090/api/timesheet-schedules/user/${userId}`, { headers })
        .then(res => {
          if (res.data) {
            setExistingSchedule(res.data);
            setChosenDays(res.data.chosenDays);
            setStartTime(res.data.startTime);
          }
        })
        .catch(() => {});
    } catch {
      setErrorMessage("Failed to submit timesheet schedule. Please try again.");
    }
  }

  const handleDeleteRequest = async () => {
    if (!existingSchedule || !existingSchedule.id || !userId || !token) return;
    if (existingSchedule.status === 'PENDING' || existingSchedule.status === 'PENDING_DELETION') {
      setErrorMessage("Wait for HR review before requesting deletion.");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.put(`http://localhost:9090/api/timesheet-schedules/${existingSchedule.id}/delete-request?userId=${userId}`, {}, { headers });
      setSuccessMessage("Your request to delete the schedule is pending HR approval!");
      axios.get(`http://localhost:9090/api/timesheet-schedules/user/${userId}`, { headers })
        .then(res => {
          if (res.data) {
            setExistingSchedule(res.data);
            setChosenDays(res.data.chosenDays);
            setStartTime(res.data.startTime);
          } else {
            setExistingSchedule(null);
            setChosenDays([]);
            setStartTime('');
          }
        })
        .catch(() => {});
    } catch {
      setErrorMessage("Failed to request schedule deletion. Please try again.");
    }
  }

  const isPending = existingSchedule && (existingSchedule.status === 'PENDING' || existingSchedule.status === 'PENDING_DELETION');
  const disableForm = isPending;

  const days = [
    DayOfWeekEnum.MONDAY,
    DayOfWeekEnum.TUESDAY,
    DayOfWeekEnum.WEDNESDAY,
    DayOfWeekEnum.THURSDAY,
    DayOfWeekEnum.FRIDAY,
    DayOfWeekEnum.SATURDAY,
    DayOfWeekEnum.SUNDAY,
  ];

  return (
    <>
      <Breadcrumb pageName="Weekly Timesheet Schedule" />

      <div className="mb-5 flex w-full border-l-6 border-warning bg-warning bg-opacity-[15%] px-7 py-4 shadow-md dark:bg-[#1B1B24] dark:bg-opacity-30 md:p-5 rounded-sm">
        <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-warning bg-opacity-30">
          <svg
            width="19"
            height="16"
            viewBox="0 0 19 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.50493 16H17.5023C18.6204 16 19.3413 14.9018 18.8354 13.9735L10.8367 0.770573C10.2852 -0.256858 8.70677 -0.256858 8.15528 0.770573L0.156617 13.9735C-0.334072 14.8998 0.386764 16 1.50493 16ZM10.7585 12.9298C10.7585 13.6155 10.2223 14.1433 9.45583 14.1433C8.6894 14.1433 8.15311 13.6155 8.15311 12.9298V12.9015C8.15311 12.2159 8.6894 11.688 9.45583 11.688C10.2223 11.688 10.7585 12.2159 10.7585 12.9015V12.9298ZM8.75236 4.01062H10.2548C10.6674 4.01062 10.9127 4.33826 10.8671 4.75288L10.2071 10.1186C10.1615 10.5049 9.88572 10.7455 9.50142 10.7455C9.11929 10.7455 8.84138 10.5028 8.79579 10.1186L8.13574 4.75288C8.09449 4.33826 8.33984 4.01062 8.75236 4.01062Z"
              fill="#FBBF24"
            ></path>
          </svg>
        </div>
        <div className="w-full">
          <h5 className="mb-1 text-lg font-semibold text-[#9D5425]">
            Setting Your Weekly Timesheet Schedule
          </h5>
          <ul className="list-disc ml-5 text-[#D0915C]">
            {!existingSchedule && <li>No schedule yet. Create one now.</li>}
            {existingSchedule && existingSchedule.status !== 'PENDING' && existingSchedule.status !== 'PENDING_DELETION' && <li>You have a schedule. Edit or request deletion.</li>}
            {existingSchedule && (existingSchedule.status === 'PENDING' || existingSchedule.status === 'PENDING_DELETION') && <li className="text-red-600">Wait for HR review.</li>}
            <li>Select your workdays and start time.</li>
            <li>All changes need HR approval.</li>
          </ul>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 flex w-full border-l-6 border-[#F87171] bg-[#F87171] bg-opacity-[15%] px-5 py-4 shadow-md rounded-sm">
          <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F87171] bg-opacity-30">
            <svg width="13" height="13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.4917 ... Z" fill="#fff" stroke="#fff"></path>
            </svg>
          </div>
          <div className="w-full">
            <h5 className="mb-1 font-semibold text-[#B45454]">Error</h5>
            <p className="text-[#CD5D5D]">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex w-full border-l-6 border-[#34D399] bg-[#34D399] bg-opacity-[15%] px-5 py-4 shadow-md rounded-sm">
          <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#34D399] bg-opacity-30">
            <svg width="16" height="12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.2984 ... Z" fill="#fff" stroke="#fff"></path>
            </svg>
          </div>
          <div className="w-full">
            <h5 className="mb-1 text-lg font-semibold text-black">Success</h5>
            <p className="text-base text-body">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6.5">
        <h3 className="font-medium text-black dark:text-white mb-4 text-lg">
          {existingSchedule ? "Edit Your Weekly Timesheet Schedule" : "Create Your Weekly Timesheet Schedule"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium">
              Select Days of the Week
            </label>
            <div className="flex flex-wrap gap-3">
              {days.map(day => (
                <label key={day} className="flex items-center gap-2 text-black dark:text-white">
                  <input
                    type="checkbox"
                    checked={chosenDays.includes(day)}
                    onChange={() => handleDayChange(day)}
                    disabled={disableForm || (existingSchedule && !existingSchedule.id)}
                    className="h-4 w-4 border-stroke rounded focus:ring-primary"
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => !disableForm && setStartTime(e.target.value)}
              disabled={disableForm || (existingSchedule && !existingSchedule.id)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-black transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              required
            />
          </div>

          {chosenDays.length > 0 && (
            <div className="text-sm text-black dark:text-white">
              <p>Total Hours/Week: {totalHoursPerWeek}</p>
              <p>Days Selected: {chosenDays.length}</p>
              <p className="font-medium">Hours/Day: {hoursPerDay}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4">
            <button
              type="submit"
              disabled={disableForm}
              className={`rounded bg-primary py-2 px-4 text-white hover:bg-opacity-90 ${disableForm ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {existingSchedule ? "Update Schedule" : "Create Schedule"}
            </button>

            {existingSchedule && existingSchedule.id && (
              <button
                type="button"
                onClick={handleDeleteRequest}
                disabled={disableForm}
                className={`rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 ${disableForm ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Delete Schedule
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default TimesheetScheduleFormHR;
