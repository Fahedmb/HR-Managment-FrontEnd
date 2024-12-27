// File: src/pages/Dashboard/ECommerce.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CardDataStats from '../../components/CardDataStats';
import ChartOne from '../../components/Charts/ChartOne';
import TableTwo from '../../components/Tables/TableTwo';
import TableFour from '../../components/Tables/TableFour';

type RequestItem = {
  id: number;
  name: string;
  date: string;
  status: string;
  type: string;
};

const ECommerce: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalHRs, setTotalHRs] = useState(0);
  const [totalLeaveRequests, setTotalLeaveRequests] = useState(0);
  const [totalWorkingHours, setTotalWorkingHours] = useState(0);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      const finalToken = stored.startsWith('Bearer ') ? stored : `Bearer ${stored}`;
      setToken(finalToken);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const config = token ? { headers: { Authorization: token } } : {};
        const usersResp = await axios.get('http://localhost:9090/api/users', config);
        const employeesCount = usersResp.data.filter((u: any) => u.role === 'EMPLOYEE').length;
        const hrCount = usersResp.data.filter((u: any) => u.role === 'HR').length;
        setTotalEmployees(employeesCount);
        setTotalHRs(hrCount);
        setTotalWorkingHours(employeesCount * 40);

        const leavesResp = await axios.get('http://localhost:9090/api/leave-requests', config);
        setTotalLeaveRequests(leavesResp.data.length);
        const leavesData = leavesResp.data.map((lr: any) => ({
          id: lr.id,
          name: 'Leave Request',
          date: lr.createdAt ? new Date(lr.createdAt).toLocaleDateString() : '',
          status: lr.status,
          type: 'Leave',
        }));

        const schedulesResp = await axios.get('http://localhost:9090/api/time-sheets', config);
        const scheduleData = schedulesResp.data.map((ts: any) => ({
          id: ts.id,
          name: 'Timesheet',
          date: ts.createdAt ? new Date(ts.createdAt).toLocaleDateString() : '',
          status: ts.status,
          type: 'Timesheet',
        }));

        setRequests([...leavesData, ...scheduleData]);
      } catch {}
    })();
  }, [token]);


  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats title="Total Employees" total={String(totalEmployees)} rate="0.00%" levelUp>
          <svg className="fill-primary dark:fill-white" width="22" height="16"><path d="..." /></svg>
        </CardDataStats>
        <CardDataStats title="Total Leave Requests" total={String(totalLeaveRequests)} rate="0.00%" levelUp>
          <svg className="fill-primary dark:fill-white" width="20" height="22"><path d="..." /></svg>
        </CardDataStats>
        <CardDataStats title="Total Working Hours" total={String(totalWorkingHours)} rate="0.00%" levelUp>
          <svg className="fill-primary dark:fill-white" width="22" height="22"><path d="..." /></svg>
        </CardDataStats>
        <CardDataStats title="Total HRs" total={String(totalHRs)} rate="0.00%" levelDown>
          <svg className="fill-primary dark:fill-white" width="22" height="18"><path d="..." /></svg>
        </CardDataStats>
      </div>
      <div className="mt-6">
        <ChartOne />
      </div>
      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-8 gap-4">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-title-md2 font-semibold text-black dark:text-white">Employees</h2>
          </div>
          <TableTwo />
          <div className="mb-6 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-title-md2 font-semibold text-black dark:text-white">All Requests</h2>
          </div>
          <TableFour requests={requests} />
        </div>
      </div>
    </>
  );
};

export default ECommerce;
