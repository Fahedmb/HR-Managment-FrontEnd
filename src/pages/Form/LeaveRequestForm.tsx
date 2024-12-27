// File: src/pages/UiElements/LeaveRequestFormHR.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

type LeaveType = 'VACATION' | 'SICK' | 'OTHER';

interface LeaveBalance {
  maxDaysPerYear: number;
  usedDaysThisYear: number;
  remainingDays: number;
}

const LeaveRequestForm: React.FC = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Form state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [leaveType, setLeaveType] = useState<LeaveType>('VACATION');

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Leave balance from backend
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    maxDaysPerYear: 30,
    usedDaysThisYear: 0,
    remainingDays: 30
  });

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
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }
  }, []);

  // Fetch leave balance
  useEffect(() => {
    if (!token) return; // Ensure token exists

    axios.get(`http://localhost:9090/api/leave-requests/balance`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        setLeaveBalance(response.data);
      })
      .catch(error => {
        console.error("Error fetching leave balance:", error);
        setErrorMessage("Failed to fetch leave balance. Please try again later.");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!token) {
      setErrorMessage("You are not logged in. Please log in first.");
      return;
    }

    if (!startDate || !endDate || !reason) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setErrorMessage("End date cannot be before start date.");
      return;
    }

    const daysRequested = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    if (daysRequested > leaveBalance.remainingDays) {
      setErrorMessage(`You requested ${daysRequested} days, but you only have ${leaveBalance.remainingDays} days remaining this year.`);
      return;
    }

    const requestBody = {
      userId: userId, // Optional if backend infers from token
      startDate: startDate,
      endDate: endDate,
      type: leaveType,
      status: "PENDING",
      reason: reason
    };

    try {
      await axios.post('http://localhost:9090/api/leave-requests', requestBody, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccessMessage("Your leave request has been submitted successfully!");
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('VACATION');

      // Refresh leave balance
      const balanceResponse = await axios.get(`http://localhost:9090/api/leave-requests/balance`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setLeaveBalance(balanceResponse.data);
    } catch (error: any) {
      console.error("Error submitting leave request:", error);
      setErrorMessage("Failed to submit leave request. Please try again.");
    }
  };

  return (
    <>
      <Breadcrumb pageName="Request Holiday/Day-Off" />

      <div className="mb-5 flex w-full border-l-6 border-warning bg-warning bg-opacity-[15%] px-7 py-4 shadow-md dark:bg-[#1B1B24] dark:bg-opacity-30 md:p-5">
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
            Important Rules for Leave Requests
          </h5>
          <ul className="list-disc ml-5 text-[#D0915C]">
            <li>You have a total of {leaveBalance.maxDaysPerYear} days of leave per year.</li>
            <li>You currently have {leaveBalance.remainingDays} leave days remaining this year.</li>
            <li>Make sure all information is correct before submitting.</li>
            <li>Provide a clear reason for your leave request.</li>
            <li>Submit your request well in advance.</li>
          </ul>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 flex w-full border-l-6 border-[#F87171] bg-[#F87171] bg-opacity-[15%] px-5 py-4 shadow-md dark:bg-[#1B1B24] dark:bg-opacity-30">
          <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F87171]">
            <svg
              width="13"
              height="13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.4917 7.65579L11.106 12.2645C11.2545 12.4128 11.4715 12.5 11.6738 12.5C11.8762 12.5 12.0931 12.4128 12.2416 12.2645C12.5621 11.9445 12.5623 11.4317 12.2423 11.1114L7.64539 6.50351L12.2589 1.91221C12.5802 1.59132 12.5802 1.07805 12.2595 0.757793C11.9393 0.437994 11.4268 0.437869 11.1064 0.757418L6.49234 5.34931L1.89459 0.740581C1.57364 0.420019 1.0608 0.420019 0.740487 0.739944C0.419837 1.05999 0.419837 1.57279 0.73985 1.89309L6.4917 7.65579Z"
                fill="#fff"
                stroke="#fff"
              ></path>
            </svg>
          </div>
          <div className="w-full">
            <h5 className="mb-1 font-semibold text-[#B45454]">Error</h5>
            <p className="text-[#CD5D5D]">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex w-full border-l-6 border-[#34D399] bg-[#34D399] bg-opacity-[15%] px-5 py-4 shadow-md dark:border-strokedark dark:bg-boxdark dark:bg-opacity-30">
          <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#34D399]">
            <svg
              width="16"
              height="12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.2984.826822l-.0116-.015-..0127-.014071C14.9173.401867 14.3238.400754 13.9657.794406L5.91888 9.45376 2.05667 5.2868c-.3581-.39393-.9518-.39291-1.3099.00305C.417335 5.65675.417335 6.22337.747996 6.59026L4.86742 11.0348c.27703.3057.66116.4652 1.02839.4652.39661 0 .75597-.1645 1.0282-.465l8.29219-8.92339C15.5833 1.74452 15.576 1.18615 15.2984.826822Z"
                fill="#fff"
                stroke="#fff"
              ></path>
            </svg>
          </div>
          <div className="w-full">
            <h5 className="mb-1 text-lg font-semibold text-black dark:text-[#34D399]">
              Success
            </h5>
            <p className="text-base text-body">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Submit Leave Request
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6.5">
            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white">
                Leave Type
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              >
                <option value="VACATION">Vacation</option>
                <option value="SICK">Sick</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white">
                Start Date <span className="text-meta-1">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                required
              />
            </div>

            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white">
                End Date <span className="text-meta-1">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                required
              />
            </div>

            <div className="mb-6">
              <label className="mb-2.5 block text-black dark:text-white">
                Reason <span className="text-meta-1">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Explain the reason for your leave"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
            >
              Submit Leave Request
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default LeaveRequestForm;
