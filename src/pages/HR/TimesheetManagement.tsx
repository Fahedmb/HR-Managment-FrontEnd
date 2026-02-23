import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Download, Search, Filter, Eye } from 'lucide-react';
import { timesheetApi, usersApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { Alert } from '../../components/ui/Alert';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import type { TimesheetSchedule, User, ScheduleStatus } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUSES: ScheduleStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

const STATUS_STYLES: Record<ScheduleStatus, string> = {
  PENDING:  'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const DAY_ABBR: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const StatusBadge: React.FC<{ status: ScheduleStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>{status}</span>
);

const TimesheetManagement: React.FC = () => {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState<TimesheetSchedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; msg: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [viewSchedule, setViewSchedule] = useState<TimesheetSchedule | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: 'APPROVED' | 'REJECTED' } | null>(null);

  const userMap = useMemo(() => {
    const m = new Map<number, User>();
    users.forEach(u => m.set(u.id, u));
    return m;
  }, [users]);

  const userName = (uid: number) => {
    const u = userMap.get(uid);
    return u ? `${u.firstName} ${u.lastName}` : `User #${uid}`;
  };

  const totalHours = (s: TimesheetSchedule) => s.totalHoursPerWeek ?? 0;

  const load = async () => {
    setLoading(true);
    try {
      const [schRes, usrRes] = await Promise.all([timesheetApi.getAll(), usersApi.getAll()]);
      setSchedules(schRes.data);
      setUsers(usrRes.data);
    } catch {
      setAlert({ type: 'danger', msg: 'Failed to load timesheet schedules.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = schedules.filter(s => {
    const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
    const matchSearch = !search || userName(s.userId).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleUpdateStatus = async () => {
    if (!confirmAction) return;
    try {
      await timesheetApi.updateStatus(confirmAction.id, confirmAction.action);
      setAlert({ type: 'success', msg: `Schedule ${confirmAction.action.toLowerCase()}.` });
      setConfirmAction(null);
      load();
    } catch {
      setAlert({ type: 'danger', msg: 'Failed to update status.' });
      setConfirmAction(null);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setTextColor(30, 64, 175); doc.text('HRPRO - Timesheet Schedules', 14, 20);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()} | By: ${user?.firstName} ${user?.lastName}`, 14, 27);
    autoTable(doc, {
      startY: 33,
      head: [['Employee', 'Week Start', 'Days', 'Total Hrs/Week', 'Status']],
      body: filtered.map(s => [
        userName(s.userId),
        new Date(s.createdAt).toLocaleDateString(),
        (s.chosenDays ?? []).map(d => DAY_ABBR[d] ?? d).join(', '),
        `${s.hoursPerDay ?? 0}h`,
        `${totalHours(s)}h`,
        s.status,
      ]),
      headStyles: { fillColor: [30, 64, 175] }, styles: { fontSize: 9 },
    });
    doc.save('HRPRO-Timesheets.pdf');
  };

  const pending = schedules.filter(s => s.status === 'PENDING').length;
  const approved = schedules.filter(s => s.status === 'APPROVED').length;
  const rejected = schedules.filter(s => s.status === 'REJECTED').length;

  return (
    <>
      <Breadcrumb pageName="Timesheet Management" />

      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
            <Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {([
          ['Pending Review', pending, 'bg-amber-50 dark:bg-meta-4', 'text-amber-600'],
          ['Approved', approved, 'bg-green-50 dark:bg-meta-4', 'text-green-600'],
          ['Rejected', rejected, 'bg-red-50 dark:bg-meta-4', 'text-red-600'],
        ] as const).map(([label, count, bg, color]) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl ${bg} border border-stroke dark:border-strokedark p-4`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..."
              className="pl-9 pr-4 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="ALL">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button onClick={exportPDF}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke dark:border-strokedark text-sm bg-white dark:bg-boxdark hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />PDF
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Employee</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Week Start</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Work Days</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Hrs/Day</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Total Hrs</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                <AnimatePresence>
                  {filtered.map((s, i) => {
                    return (
                      <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-black dark:text-white">{userName(s.userId)}</td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" />{new Date(s.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                          <div className="flex flex-wrap gap-1">
                            {(s.chosenDays ?? []).map(d => (
                              <span key={d} className="px-1.5 py-0.5 bg-blue-50 dark:bg-boxdark text-blue-600 text-xs rounded-md font-medium">
                                {DAY_ABBR[d] ?? d}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">{s.hoursPerDay ?? '—'}h</td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">{totalHours(s)}h</td>
                        <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewSchedule(s)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-boxdark text-gray-400 hover:text-blue-500 transition-colors" title="View details">
                              <Eye className="w-4 h-4" />
                            </button>
                            {s.status === 'PENDING' && (
                              <>
                                <button onClick={() => setConfirmAction({ id: s.id, action: 'APPROVED' })}
                                  className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-boxdark text-gray-400 hover:text-green-500 transition-colors" title="Approve">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => setConfirmAction({ id: s.id, action: 'REJECTED' })}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-boxdark text-gray-400 hover:text-red-500 transition-colors" title="Reject">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">No timesheet schedules found.</div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={viewSchedule !== null} onClose={() => setViewSchedule(null)} title="Schedule Details">
        {viewSchedule && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Employee</p>
                <p className="font-semibold text-black dark:text-white">{userName(viewSchedule.userId)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <StatusBadge status={viewSchedule.status} />
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Submitted</p>
                <p className="text-sm font-medium text-black dark:text-white">{new Date(viewSchedule.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Hours / Week</p>
                <p className="text-sm font-medium text-black dark:text-white">{totalHours(viewSchedule)}h</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Hrs / Day</p>
                <p className="text-sm font-medium text-black dark:text-white">{viewSchedule.hoursPerDay ?? '—'}h</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Start Time</p>
                <p className="text-sm font-medium text-black dark:text-white">{viewSchedule.startTime ?? '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Work Days</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {(viewSchedule.chosenDays ?? []).map(d => (
                  <span key={d} className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-boxdark text-blue-600 text-sm font-medium">
                    {DAY_ABBR[d] ?? d}
                  </span>
                ))}
              </div>
            </div>
            {viewSchedule.status === 'PENDING' && (
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setViewSchedule(null); setConfirmAction({ id: viewSchedule.id, action: 'APPROVED' }); }}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />Approve
                </button>
                <button onClick={() => { setViewSchedule(null); setConfirmAction({ id: viewSchedule.id, action: 'REJECTED' }); }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
                  <XCircle className="w-4 h-4" />Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleUpdateStatus}
        title={confirmAction?.action === 'APPROVED' ? 'Approve Schedule' : 'Reject Schedule'}
        message={`${confirmAction?.action === 'APPROVED' ? 'Approve' : 'Reject'} this employee's timesheet schedule?`}
        confirmLabel={confirmAction?.action === 'APPROVED' ? 'Approve' : 'Reject'}
        variant={confirmAction?.action === 'APPROVED' ? 'success' : 'danger'}
      />
    </>
  );
};

export default TimesheetManagement;
