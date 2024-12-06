// DashboardEmployee.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChartThree from '../../components/Charts/ChartThree';
import TableThree from '../../components/Tables/TableThree';

type User = {
  id?: number;
  firstName?: string;
  lastName?: string;
};

type RequestItem = {
  name: string;
  date: string;
  status: string;
  type: string;
};

const DashboardEmployee: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
        }
        setToken(storedToken);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!user || !user.id || !token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      try {
        const userId = user.id;
        const leaveRes = await axios.get(`http://localhost:9090/api/leave-requests/user/${userId}`, { headers });
        const scheduleRes = await axios.get(`http://localhost:9090/api/timesheet-schedules/user/${userId}`, { headers });

        const leaves = leaveRes.data.map((lr: any) => ({
          name: 'Leave Request',
          date: lr.createdAt ? new Date(lr.createdAt).toLocaleDateString() : '',
          status: lr.status,
          type: 'Leave'
        }));

        const scheduleItems = scheduleRes.data
          ? [{
            name: 'Timesheet Schedule',
            date: scheduleRes.data.createdAt ? new Date(scheduleRes.data.createdAt).toLocaleDateString() : '',
            status: scheduleRes.data.status,
            type: 'Timesheet'
          }]
          : [];

        setRequests([...leaves, ...scheduleItems]);
      } catch {}
    };

    fetchData();
  }, [user, token]);

  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <ChartThree />
        <div className="col-span-12 xl:col-span-8">
          <TableThree requests={requests} />
        </div>
      </div>
    </>
  );
};

export default DashboardEmployee;
