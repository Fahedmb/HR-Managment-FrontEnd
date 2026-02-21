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

const LEAVE_TYPES: LeaveType[] = ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'EMERGENCY', 'BEREAVEMENT'];
const STATUSES: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const defaultForm = { leaveType: 'ANNUAL' as LeaveType, startDate: '', endDate: '', reason: '', isHalfDay: false };

const LeaveRequests: React.FC = () => {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<Record<string, number>>({});
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
      const endpoint = isHR ? leaveApi.getAll() : leaveApi.getMyRequests(user!.id);
      const [reqRes] = await Promise.all([endpoint]);
      setRequests(reqRes.data);
      if (!isHR) {
        leaveApi.getBalance(user!.id).then(r => setBalance(r.data)).catch(() => {});
      }
    } catch { setAlert({ type: 'danger', msg: 'Failed to load.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = requests.filter(r => filterStatus === 'ALL' || r.status === filterStatus);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate) { setAlert({ type: 'danger', msg: 'Please fill all required fields.' }); return; }
    try {
      await leaveApi.create({ ...form, employeeId: user!.id });
      setAlert({ type: 'success', msg: 'Leave request submitted.' });
      setFormOpen(false); load();
    } catch { setAlert({ type: 'danger', msg: 'Failed to submit request.' }); }
  };

  const handleCancel = async (id: number) => {
    try { await leaveApi.cancel(id); setAlert({ type: 'success', msg: 'Request cancelled.' }); load(); }
    catch { setAlert({ type: 'danger', msg: 'Failed to cancel.' }); }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!reviewModal) return;
    try {
      if (action === 'approve') await leaveApi.approve(reviewModal.id, reviewComment);
      else await leaveApi.reject(reviewModal.id, reviewComment);
      setAlert({ type: 'success', msg: `Request ${action}d.` });
      setReviewModal(null); setReviewComment(''); setReviewAction(null); load();
    } catch { setAlert({ type: 'danger', msg: `Failed to ${action} request.` }); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setTextColor(30, 64, 175); doc.text('HRPRO - Leave Requests', 14, 20);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
    autoTable(doc, {
      startY: 33,
      head: [['Employee', 'Type', 'Start', 'End', 'Days', 'Status', 'Reason']],
      body: filtered.map(r => [r.employeeName || '—', r.leaveType, r.startDate, r.endDate, String(differenceInDays(new Date(r.endDate), new Date(r.startDate)) + 1), r.status, r.reason || '—']),
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

      {/* Balance Cards (employee only) */}
      {!isHR && Object.keys(balance).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {Object.entries(balance).map(([type, remaining]) => (
            <motion.div key={type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark p-4 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{type}</p>
              <p className="text-3xl font-bold text-black dark:text-white mt-1">{remaining}</p>
              <p className="text-xs text-gray-400">days left</p>
            </motion.div>
          ))}
        </div>
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
                      {isHR && <span className="font-semibold text-black dark:text-white">{r.employeeName}</span>}
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{r.leaveType}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(r.startDate), 'MMM d')} → {format(new Date(r.endDate), 'MMM d, yyyy')}</span>
                      <span className="font-medium text-black dark:text-white">{days(r.startDate, r.endDate)} day{days(r.startDate, r.endDate) !== 1 ? 's' : ''}</span>
                      {r.isHalfDay && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Half Day</span>}
                    </div>
                    {r.reason && <p className="text-sm text-gray-400 mt-1 flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{r.reason}</p>}
                    {r.reviewComment && <p className="text-sm mt-1 italic text-gray-500">Review note: {r.reviewComment}</p>}
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
            <input type="checkbox" id="halfDay" checked={form.isHalfDay} onChange={e => setForm(f => ({ ...f, isHalfDay: e.target.checked }))} className="rounded border-stroke text-primary focus:ring-primary" />
            <label htmlFor="halfDay" className="text-sm">Half Day</label>
          </div>
          <div><label className="block text-sm font-medium mb-1">Reason</label><textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Optional reason..." /></div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModal !== null} onClose={() => setReviewModal(null)} title={reviewAction === 'approve' ? 'Approve Request' : 'Reject Request'} footer={
        <><button onClick={() => setReviewModal(null)} className="px-4 py-2 text-sm rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button>
        <button onClick={() => reviewAction && handleReview(reviewAction)} className={`px-4 py-2 text-sm rounded-xl text-white ${reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{reviewAction === 'approve' ? 'Approve' : 'Reject'}</button></>
      }>
        <div>
          {reviewModal && (
            <div className="mb-3 p-3 rounded-xl bg-gray-50 dark:bg-meta-4 text-sm">
              <p><span className="font-medium">Employee: </span>{reviewModal.employeeName}</p>
              <p><span className="font-medium">Type: </span>{reviewModal.leaveType}</p>
              <p><span className="font-medium">Period: </span>{reviewModal.startDate} → {reviewModal.endDate}</p>
            </div>
          )}
          <label className="block text-sm font-medium mb-1">Comment (optional)</label>
          <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Add a note to the employee..." />
        </div>
      </Modal>

      <ConfirmModal isOpen={cancelId !== null} onClose={() => setCancelId(null)} onConfirm={() => cancelId && handleCancel(cancelId)} title="Cancel Request" message="Cancel this leave request?" confirmLabel="Yes, Cancel" variant="warning" />
    </>
  );
};

export default LeaveRequests;
