import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChartThree from '../../components/Charts/ChartThree';
import TableThree from '../../components/Tables/TableThree';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [chartDataUrl, setChartDataUrl] = useState<string>('');

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

  const handleChartReady = (dataUrl: string) => {
    setChartDataUrl(dataUrl);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Employee: ${user?.firstName || ''} ${user?.lastName || ''}`, 10, 10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 20);
    doc.text(`Employee Requests Report`, 10, 30);

    let currentY = 40;

    if (chartDataUrl) {
      doc.addImage(chartDataUrl, 'PNG', 10, currentY, 80, 80);
      currentY += 90;


      doc.setFontSize(10);
      doc.setTextColor(60,80,224);
      doc.text('■ Worked Days', 10, currentY);
      doc.setTextColor(248,113,113);
      doc.text('■ Leave Days', 45, currentY);

      currentY += 10;
      doc.setFontSize(12);
      doc.setTextColor(0,0,0);
    }

    const tableData = requests.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.date,
      item.status,
      item.type
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Request', 'Date', 'Status', 'Type']],
      body: tableData,
    });

    doc.save('employee_requests_report.pdf');
  };

  return (
    <>
      <div className="flex justify-end mb-4 pr-4">
        <button
          onClick={handleExportPDF}
          className="rounded bg-primary py-2 px-4 text-white hover:bg-opacity-90"
        >
          Export as PDF
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <ChartThree onChartReady={handleChartReady} />
        <div className="col-span-12 xl:col-span-8">
          <TableThree requests={requests} />
        </div>
      </div>
    </>
  );
};

export default DashboardEmployee;
