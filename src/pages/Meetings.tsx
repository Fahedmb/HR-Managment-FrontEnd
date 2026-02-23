import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, MapPin, Video, Users, XCircle, Edit2, Download } from 'lucide-react';
import { meetingsApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { Alert, StatusBadge } from '../components/ui/Alert';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import type { Meeting, MeetingStatus, User } from '../types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUSES: MeetingStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const pad = (n: number) => String(n).padStart(2, '0');

const defaultForm = {
  title: '',
  description: '',
  meetingDate: new Date().toISOString().slice(0, 10),
  startHour: 9,
  startMinute: 0,
  durationMinutes: 60,
  location: '',
  meetingLink: '',
  attendeeIds: [] as number[],
};

const Meetings: React.FC = () => {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; msg: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    setLoading(true);
    try {
      const [mr, ur] = await Promise.all([meetingsApi.getAll(), usersApi.getAll()]);
      setMeetings(mr.data);
      setAllUsers(ur.data);
    } catch { setAlert({ type: 'danger', msg: 'Failed to load.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = meetings.filter(m => filterStatus === 'ALL' || m.status === filterStatus);

  const openCreate = () => { setEditMeeting(null); setForm(defaultForm); setFormOpen(true); };
  const openEdit = (m: Meeting) => {
    setEditMeeting(m);
    const st = m.startTime ? new Date(m.startTime) : new Date();
    const et = m.endTime ? new Date(m.endTime) : new Date(st.getTime() + 3600000);
    const durMin = Math.round((et.getTime() - st.getTime()) / 60000);
    const validDurs = [30, 60, 90, 120, 180, 240];
    setForm({
      title: m.title,
      description: m.description || '',
      meetingDate: st.toISOString().slice(0, 10),
      startHour: st.getHours(),
      startMinute: st.getMinutes() >= 30 ? 30 : 0,
      durationMinutes: validDurs.includes(durMin) ? durMin : 60,
      location: m.location || '',
      meetingLink: m.meetingLink || '',
      attendeeIds: m.attendees?.map(a => a.id) ?? [],
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setAlert({ type: 'danger', msg: 'Title is required.' }); return; }
    try {
      const startTime = `${form.meetingDate}T${pad(form.startHour)}:${pad(form.startMinute)}:00`;
      const endMs = new Date(startTime).getTime() + form.durationMinutes * 60000;
      const endTime = new Date(endMs).toISOString().slice(0, 19);
      const payload = {
        title: form.title,
        description: form.description,
        startTime,
        endTime,
        location: form.location,
        meetingLink: form.meetingLink,
        attendeeIds: form.attendeeIds,
        organizerId: user!.id,
      };
      if (editMeeting) { await meetingsApi.update(editMeeting.id, payload); setAlert({ type: 'success', msg: 'Meeting updated.' }); }
      else { await meetingsApi.create(payload); setAlert({ type: 'success', msg: 'Meeting created.' }); }
      setFormOpen(false); load();
    } catch { setAlert({ type: 'danger', msg: 'Failed to save meeting.' }); }
  };

  const handleCancel = async (id: number) => {
    try { await meetingsApi.cancel(id); setAlert({ type: 'success', msg: 'Meeting cancelled.' }); load(); }
    catch { setAlert({ type: 'danger', msg: 'Failed to cancel meeting.' }); }
  };

  const toggleAttendee = (id: number) => {
    setForm(f => ({ ...f, attendeeIds: f.attendeeIds.includes(id) ? f.attendeeIds.filter(x => x !== id) : [...f.attendeeIds, id] }));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setTextColor(30, 64, 175); doc.text('HRPRO - Meetings Report', 14, 20);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
    autoTable(doc, {
      startY: 33,
      head: [['Title', 'Date', 'Status', 'Location', 'Attendees']],
      body: filtered.map(m => [m.title, m.startTime ? format(new Date(m.startTime), 'MMM d, yyyy HH:mm') : '—', m.status, m.location || m.meetingLink || '—', String(m.attendees?.length ?? 0)]),
      headStyles: { fillColor: [30, 64, 175] }, styles: { fontSize: 8 },
    });
    doc.save('HRPRO-Meetings.pdf');
  };

  const STATUS_BG: Record<MeetingStatus, string> = { SCHEDULED: 'border-l-blue-500', IN_PROGRESS: 'border-l-green-500', COMPLETED: 'border-l-gray-400', CANCELLED: 'border-l-red-400' };

  return (
    <>
      <Breadcrumb pageName="Meetings" />
      <AnimatePresence>
        {alert && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4"><Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></motion.div>}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="ALL">All Status</option>{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke dark:border-strokedark text-sm bg-white dark:bg-boxdark hover:bg-gray-50 transition-colors"><Download className="w-4 h-4" />PDF</button>
          {isHR && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" />Schedule Meeting
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark border-l-4 ${STATUS_BG[m.status]} shadow-sm p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-black dark:text-white">{m.title}</h3>
                      <StatusBadge status={m.status} />
                    </div>
                    {m.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{m.description}</p>}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{m.startTime ? format(new Date(m.startTime), 'MMM d, yyyy HH:mm') : '—'}</span>
                        {m.endTime && <span className="text-gray-400">→ {format(new Date(m.endTime), 'HH:mm')}</span>}
                      </div>
                      {m.location && <div className="flex items-center gap-1.5 text-sm text-gray-500"><MapPin className="w-4 h-4" /><span>{m.location}</span></div>}
                      {m.meetingLink && <a href={m.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-500 hover:underline"><Video className="w-4 h-4" />Join Online</a>}
                      {m.attendees && <div className="flex items-center gap-1.5 text-sm text-gray-500"><Users className="w-4 h-4" /><span>{m.attendees.length} attendees</span></div>}
                    </div>
                    {m.attendees && m.attendees.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.attendees.slice(0, 8).map(a => (
                          <span key={a.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300">{a.firstName} {a.lastName}</span>
                        ))}
                        {m.attendees.length > 8 && <span className="text-xs text-gray-400">+{m.attendees.length - 8} more</span>}
                      </div>
                    )}
                  </div>
                  {isHR && m.status !== 'CANCELLED' && m.status !== 'COMPLETED' && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setCancelId(m.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-red-500 transition-colors"><XCircle className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No meetings found.</div>}
        </div>
      )}

      {/* Meeting Form Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editMeeting ? 'Edit Meeting' : 'Schedule Meeting'} size="lg" footer={
        <><button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button><button onClick={handleSave} className="px-4 py-2 text-sm bg-primary hover:bg-opacity-90 text-white rounded-xl">{editMeeting ? 'Save' : 'Schedule'}</button></>
      }>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium mb-1">Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" /></div>
          {/* Date / Time / Duration row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={form.meetingDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <select
                value={`${form.startHour}:${form.startMinute}`}
                onChange={e => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  setForm(f => ({ ...f, startHour: h, startMinute: m }));
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {Array.from({ length: 30 }, (_, i) => {
                  const h = Math.floor(i / 2) + 7; // 7:00 AM – 9:30 PM
                  const m = i % 2 === 0 ? 0 : 30;
                  const ampm = h < 12 ? 'AM' : 'PM';
                  const h12 = h % 12 || 12;
                  return <option key={i} value={`${h}:${m}`}>{`${h12}:${m === 0 ? '00' : '30'} ${ampm}`}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration</label>
              <select
                value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Location</label><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Room / address" className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            <div><label className="block text-sm font-medium mb-1">Online Link</label><input value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Attendees</label>
            <div className="max-h-36 overflow-y-auto space-y-1 border border-stroke dark:border-strokedark rounded-xl p-2">
              {allUsers.map(u => (
                <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 cursor-pointer">
                  <input type="checkbox" checked={form.attendeeIds.includes(u.id)} onChange={() => toggleAttendee(u.id)} className="rounded border-stroke text-primary focus:ring-primary" />
                  <span className="text-sm">{u.firstName} {u.lastName}</span>
                  <span className="text-xs text-gray-400 ml-auto">{u.role}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={cancelId !== null} onClose={() => setCancelId(null)} onConfirm={() => cancelId && handleCancel(cancelId)} title="Cancel Meeting" message="Cancel this meeting? Attendees will be notified." confirmLabel="Yes, Cancel" variant="warning" />
    </>
  );
};

export default Meetings;
