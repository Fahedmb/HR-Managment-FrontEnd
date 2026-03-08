import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, CheckCircle, XCircle, Clock, Info } from 'lucide-react';
import { leaveApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { Alert, StatusBadge } from '../components/ui/Alert';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import type { LeaveRequest, LeaveStatus, LeaveType } from '../types';
import { format, differenceInDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LEAVE_TYPES: LeaveType[] = ['VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID', 'OTHER'];
const STATUSES: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const defaultForm = { leaveType: 'VACATION' as LeaveType, startDate: '', endDate: '', reason: '', halfDay: false };

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MiniLeaveCalendar: React.FC<{ startDate: string; endDate: string }> = ({ startDate, endDate }) => {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const months: { year: number; month: number }[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const endM = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= endM) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Leave Calendar Preview</p>
      {months.map(({ year, month }) => {
        const firstDow = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const blanks = Array(firstDow).fill(null);
        return (
          <div key={`${year}-${month}`}>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 text-center">
              {MONTH_NAMES[month]} {year}
            </p>
            <div className="grid grid-cols-7 text-center gap-y-0.5">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-[10px] font-medium text-gray-400 py-0.5">{d}</div>
              ))}
              {blanks.map((_, i) => <div key={`b${i}`} />)}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
                const thisDate = new Date(year, month, d);
                const inRange = thisDate >= start && thisDate <= end;
                const isEdge = thisDate.toDateString() === start.toDateString() || thisDate.toDateString() === end.toDateString();
                return (
                  <div key={d} className={`text-[11px] py-0.5 mx-0.5 rounded-md font-medium leading-5 ${
                    isEdge ? 'bg-primary text-white' :
                    inRange ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LeaveRequests: React.FC = () => {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<{ total: number; used: number; balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; msg: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<LeaveRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    setLoading(true);
    try {
      const endpoint = isHR ? leaveApi.getAll() : leaveApi.getByUser(user!.id);
      const [reqRes] = await Promise.all([endpoint]);
      setRequests(reqRes.data);
      if (!isHR) {
        leaveApi.getBalance().then(r => setBalance(r.data)).catch(() => {});
      }
    } catch { setAlert({ type: 'danger', msg: 'Failed to load.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = requests.filter(r => filterStatus === 'ALL' || r.status === filterStatus);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate) { setAlert({ type: 'danger', msg: 'Please fill all required fields.' }); return; }
    try {
      await leaveApi.create({ type: form.leaveType, startDate: form.startDate, endDate: form.endDate, reason: form.reason, halfDay: form.halfDay, userId: user!.id });
      setAlert({ type: 'success', msg: 'Leave request submitted.' });
      setFormOpen(false); load();
    } catch (err: any) { setAlert({ type: 'danger', msg: err?.response?.data?.message || 'Failed to submit request.' }); }
  };

  const handleCancel = async (id: number) => {
    try { await leaveApi.cancel(id, 'Cancelled by employee'); setAlert({ type: 'success', msg: 'Request cancelled.' }); load(); }
    catch { setAlert({ type: 'danger', msg: 'Failed to cancel.' }); }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!reviewModal) return;
    try {
      if (action === 'approve') await leaveApi.updateStatus(reviewModal.id, 'APPROVED', user!.id, reviewComment);
      else await leaveApi.updateStatus(reviewModal.id, 'REJECTED', user!.id, reviewComment);
      setAlert({ type: 'success', msg: `Request ${action}d.` });
      setReviewModal(null); setReviewComment(''); setReviewAction(null); load();
    } catch (err: any) { setAlert({ type: 'danger', msg: err?.response?.data?.message || `Failed to ${action} request.` }); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setTextColor(30, 64, 175); doc.text('HRPRO - Leave Requests', 14, 20);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
    autoTable(doc, {
      startY: 33,
      head: [['Employee', 'Type', 'Start', 'End', 'Days', 'Status', 'Reason']],
      body: filtered.map(r => [`${r.firstName} ${r.lastName}`, r.type, r.startDate, r.endDate, String(differenceInDays(new Date(r.endDate), new Date(r.startDate)) + 1), r.status, r.reason || '—']),
      headStyles: { fillColor: [30, 64, 175] }, styles: { fontSize: 8 },
    });
    doc.save('HRPRO-LeaveRequests.pdf');
  };

  const days = (start: string, end: string) => differenceInDays(new Date(end), new Date(start)) + 1;

  return (
    <>
      <Breadcrumb pageName="Leave Requests" />
      <AnimatePresence>
        {alert && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4"><Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></motion.div>}
      </AnimatePresence>

      {/* Balance Card (employee only) */}
      {!isHR && balance && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark p-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Annual Leave Balance {new Date().getFullYear()}</p>
              <p className="text-3xl font-bold text-black dark:text-white mt-0.5">
                {balance.balance}
                <span className="text-base font-normal text-gray-400 ml-1">/ {balance.total} days</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Used: <span className="font-semibold text-black dark:text-white">{balance.used}</span> days</p>
              <div className="w-40 h-2.5 bg-gray-100 dark:bg-meta-4 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min((balance.used / balance.total) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="ALL">All Status</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke dark:border-strokedark text-sm bg-white dark:bg-boxdark hover:bg-gray-50 transition-colors"><Download className="w-4 h-4" />PDF</button>
          {!isHR && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setForm(defaultForm); setFormOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" />New Request
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isHR && <span className="font-semibold text-black dark:text-white">{r.firstName} {r.lastName}</span>}
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{r.type}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(r.startDate), 'MMM d')} → {format(new Date(r.endDate), 'MMM d, yyyy')}</span>
                      <span className="font-medium text-black dark:text-white">{days(r.startDate, r.endDate)} day{days(r.startDate, r.endDate) !== 1 ? 's' : ''}</span>
                      {r.halfDay && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Half Day</span>}
                    </div>
                    {r.reason && <p className="text-sm text-gray-400 mt-1 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{r.reason}</p>}
                    {r.approverComment && <p className="text-sm mt-1 italic text-gray-500">Review note: {r.approverComment}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isHR && r.status === 'PENDING' && (
                      <>
                        <button onClick={() => { setReviewModal(r); setReviewAction('approve'); setReviewComment(''); }} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-meta-4 text-gray-400 hover:text-green-500 transition-colors" title="Approve"><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => { setReviewModal(r); setReviewAction('reject'); setReviewComment(''); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-meta-4 text-gray-400 hover:text-red-500 transition-colors" title="Reject"><XCircle className="w-5 h-5" /></button>
                      </>
                    )}
                    {!isHR && r.status === 'PENDING' && (
                      <button onClick={() => setCancelId(r.id)} className="px-3 py-1.5 text-xs rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 text-gray-500">Cancel</button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No leave requests found.</div>}
        </div>
      )}

      {/* New Request Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="New Leave Request" footer={
        <><button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 text-sm bg-primary hover:bg-opacity-90 text-white rounded-xl">Submit</button></>
      }>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium mb-1">Leave Type</label><select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value as LeaveType }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">{LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            <div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="halfDay" checked={form.halfDay} onChange={e => setForm(f => ({ ...f, halfDay: e.target.checked }))} className="rounded border-stroke text-primary focus:ring-primary" />
            <label htmlFor="halfDay" className="text-sm">Half Day</label>
          </div>
          <div><label className="block text-sm font-medium mb-1">Reason</label><textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Optional reason..." /></div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModal !== null} onClose={() => setReviewModal(null)} size="lg" title={reviewAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'} footer={
        <><button onClick={() => setReviewModal(null)} className="px-4 py-2 text-sm rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button>
        <button onClick={() => reviewAction && handleReview(reviewAction)} className={`px-4 py-2 text-sm rounded-xl text-white ${reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{reviewAction === 'approve' ? 'Approve' : 'Reject'}</button></>
      }>
        <div className="space-y-3">
          {reviewModal && (
            <>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-meta-4 text-sm space-y-1">
                <p><span className="font-medium">Employee: </span>{reviewModal.firstName} {reviewModal.lastName}</p>
                <p><span className="font-medium">Type: </span>{reviewModal.type}</p>
                <p><span className="font-medium">Period: </span>{format(new Date(reviewModal.startDate), 'MMM d, yyyy')} → {format(new Date(reviewModal.endDate), 'MMM d, yyyy')} ({reviewModal.daysCount} day{reviewModal.daysCount !== 1 ? 's' : ''})</p>
                {reviewModal.reason && <p><span className="font-medium">Reason: </span>{reviewModal.reason}</p>}
                {reviewModal.halfDay && <p className="text-yellow-600 dark:text-yellow-400 font-medium">⚡ Half Day Request</p>}
              </div>
              <MiniLeaveCalendar startDate={reviewModal.startDate} endDate={reviewModal.endDate} />
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Comment (optional)</label>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Add a note to the employee..." />
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={cancelId !== null} onClose={() => setCancelId(null)} onConfirm={() => cancelId && handleCancel(cancelId)} title="Cancel Request" message="Cancel this leave request?" confirmLabel="Yes, Cancel" variant="warning" />
    </>
  );
};

export default LeaveRequests;
