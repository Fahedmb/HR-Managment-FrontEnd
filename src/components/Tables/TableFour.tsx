// File: src/components/Tables/TableFour.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type RequestItem = {
  id: number;
  name: string;
  date: string;
  status: string;
  type: string;
};

type TableFourProps = {
  requests: RequestItem[];
  token: string | null;
  refreshRequests: () => void;
};

const TableFour: React.FC<TableFourProps> = ({ requests, token, refreshRequests }) => {
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof RequestItem; direction: 'asc' | 'desc' } | null>(null);

  // Fetch requests when the component mounts or when refreshRequests is called
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const resp = await axios.get('http://localhost:9090/api/requests', {
          headers: { Authorization: token || '' },
        });
        // Assuming the API returns an array of requests
        setSelected(null); // Reset selected when refreshing
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };
    fetchRequests();
  }, [refreshRequests, token]);

  const handleView = (item: RequestItem) => {
    setSelected(item);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelected(null);
  };

  const handleApprove = async () => {
    if (!selected || !token) return;
    setLoading(true);
    try {
      const config = { headers: { Authorization: token } };
      if (selected.type === 'Leave') {
        await axios.put(`http://localhost:9090/api/leave-requests/${selected.id}`, { status: 'APPROVED' }, config);
      } else {
        await axios.put(`http://localhost:9090/api/time-sheets/${selected.id}`, { status: 'APPROVED' }, config);
      }
      await refreshRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
    setLoading(false);
    handleClose();
  };

  const handleReject = async () => {
    if (!selected || !token) return;
    setLoading(true);
    try {
      const config = { headers: { Authorization: token } };
      if (selected.type === 'Leave') {
        await axios.put(`http://localhost:9090/api/leave-requests/${selected.id}`, { status: 'REJECTED' }, config);
      } else {
        await axios.put(`http://localhost:9090/api/time-sheets/${selected.id}`, { status: 'REJECTED' }, config);
      }
      await refreshRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
    setLoading(false);
    handleClose();
  };

  const handleSort = (key: keyof RequestItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRequests = React.useMemo(() => {
    let sortableRequests = [...requests];
    if (sortConfig !== null) {
      sortableRequests.sort((a, b) => {
        if (a[sortConfig.key] === null) return 1;
        if (b[sortConfig.key] === null) return -1;
        if (a[sortConfig.key]! < b[sortConfig.key]!) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key]! > b[sortConfig.key]!) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRequests;
  }, [requests, sortConfig]);

  const filteredRequests = sortedRequests.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.date.toLowerCase().includes(search.toLowerCase()) ||
    item.status.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text('Requests List', 14, 16);

      const rows = filteredRequests.map((item) => [
        item.name,
        item.date,
        item.status,
        item.type,
      ]);

      (doc as any).autoTable({
        head: [['Request', 'Date', 'Status', 'Type']],
        body: rows,
        startY: 20,
      });

      doc.save('requests.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default 
                    dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">

      {/* Search and Export PDF */}
      <div className="mb-4 flex justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="border border-gray-300 rounded px-3 py-2"
        />
        <button
          onClick={handleExportPDF}
          className="rounded bg-primary py-2 px-4 text-white hover:bg-opacity-90"
        >
          Extract PDF
        </button>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th
                className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11 cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Request {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white cursor-pointer"
                onClick={() => handleSort('date')}
              >
                Date {sortConfig?.key === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white cursor-pointer"
                onClick={() => handleSort('type')}
              >
                Type {sortConfig?.key === 'type' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((item) => (
              <tr key={item.id}>
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <h5 className="font-medium text-black dark:text-white">{item.name}</h5>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">{item.date}</p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p
                    className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                      item.status === 'APPROVED'
                        ? 'bg-success text-success'
                        : item.status === 'REJECTED'
                        ? 'bg-danger text-danger'
                        : 'bg-warning text-warning'
                    }`}
                  >
                    {item.status}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">{item.type}</p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  {item.status === 'PENDING' && (
                    <button
                      onClick={() => handleView(item)}
                      className="rounded bg-primary px-3 py-1 text-white hover:bg-primary/80"
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={5} className="py-5 px-4 text-center text-gray-500 dark:text-gray-300">
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Viewing Request Details */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={handleClose}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
              Request Details
            </h3>
            <div className="mb-4 space-y-2">
              <p className="text-sm">
                <span className="font-semibold">ID:</span> {selected.id}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Name:</span> {selected.name}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Date:</span> {selected.date}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Type:</span> {selected.type}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Current Status:</span>{' '}
                <span
                  className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                    selected.status === 'APPROVED'
                      ? 'bg-success text-success'
                      : selected.status === 'REJECTED'
                      ? 'bg-danger text-danger'
                      : 'bg-warning text-warning'
                  }`}
                >
                  {selected.status}
                </span>
              </p>
            </div>
            {selected.status === 'PENDING' && (
              <div className="flex justify-end space-x-4">
                <button
                  className="rounded bg-success px-4 py-2 font-medium text-white hover:bg-success/80 disabled:opacity-50"
                  onClick={handleApprove}
                  disabled={loading}
                >
                  Approve
                </button>
                <button
                  className="rounded bg-danger px-4 py-2 font-medium text-white hover:bg-danger/80 disabled:opacity-50"
                  onClick={handleReject}
                  disabled={loading}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFour;
