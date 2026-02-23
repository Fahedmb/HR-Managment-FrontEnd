import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Download, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { tasksApi, projectsApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { StatusBadge, Alert } from '../components/ui/Alert';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import type { Task, TaskStatus, TaskPriority, Project, User } from '../types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PRIORITY_COLORS: Record<TaskPriority, string> = { LOW: 'bg-gray-100 text-gray-600', MEDIUM: 'bg-blue-100 text-blue-600', HIGH: 'bg-amber-100 text-amber-700', CRITICAL: 'bg-red-100 text-red-700' };

const defaultForm = { title: '', description: '', projectId: '', assignedToId: '', status: 'TODO' as TaskStatus, priority: 'MEDIUM' as TaskPriority, deadline: '', estimatedHours: '' };

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';
  const canManage = isHR || isManager;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; msg: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');

  const load = () => {
    setLoading(true);
    const endpoint = isHR ? tasksApi.getAll() : tasksApi.getByAssignee(user!.id);
    endpoint.then(r => { setTasks(r.data); setLoading(false); }).catch(() => setLoading(false));
    if (canManage) {
      projectsApi.getAll().then(r => setProjects(r.data)).catch(() => {});
      usersApi.getAll().then(r => setUsers(r.data)).catch(() => {});
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = tasks.filter(t => {
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const openCreate = () => { setEditTask(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (t: Task) => {
    setEditTask(t);
    setForm({ title: t.title, description: t.description, projectId: String(t.projectId || ''), assignedToId: String(t.assignedToId || ''), status: t.status, priority: t.priority, deadline: t.deadline || '', estimatedHours: String(t.estimatedHours || '') });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, projectId: Number(form.projectId) || undefined, assignedToId: Number(form.assignedToId) || undefined, estimatedHours: Number(form.estimatedHours) || undefined, createdById: user!.id };
      if (editTask) { await tasksApi.update(editTask.id, payload); setAlert({ type: 'success', msg: 'Task updated.' }); }
      else { await tasksApi.create(payload); setAlert({ type: 'success', msg: 'Task created.' }); }
      setModalOpen(false); load();
    } catch { setAlert({ type: 'danger', msg: 'Failed to save task.' }); }
  };

  const handleStatusChange = async (id: number, status: TaskStatus) => {
    try { await tasksApi.updateStatus(id, status, user!.id); setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t)); }
    catch { setAlert({ type: 'danger', msg: 'Failed to update status.' }); }
  };

  const handleDelete = async (id: number) => {
    try { await tasksApi.delete(id); setAlert({ type: 'success', msg: 'Task deleted.' }); load(); }
    catch { setAlert({ type: 'danger', msg: 'Failed to delete task.' }); }
  };

  const handleAddComment = async () => {
    if (!commentTask || !commentText.trim()) return;
    try { await tasksApi.addComment(commentTask.id, user!.id, commentText); setCommentText(''); load(); setAlert({ type: 'success', msg: 'Comment added.' }); }
    catch { setAlert({ type: 'danger', msg: 'Failed to add comment.' }); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setTextColor(30, 64, 175); doc.text('HRPRO - Tasks Report', 14, 20);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
    autoTable(doc, {
      startY: 33,
      head: [['Title', 'Status', 'Priority', 'Assigned To', 'Deadline', 'Project']],
      body: filtered.map(t => [t.title, t.status, t.priority, t.assignedToName || 'Unassigned', t.deadline || '—', t.projectName || '—']),
      headStyles: { fillColor: [30, 64, 175] }, styles: { fontSize: 8 },
    });
    doc.save('HRPRO-Tasks.pdf');
  };

  const isOverdue = (t: Task) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'DONE';

  return (
    <>
      <Breadcrumb pageName="Tasks" />
      <AnimatePresence>
        {alert && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4"><Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></motion.div>}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="px-4 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="ALL">All Status</option>{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="ALL">All Priority</option>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke dark:border-strokedark text-sm bg-white dark:bg-boxdark hover:bg-gray-50 transition-colors"><Download className="w-4 h-4" />PDF</button>
          {canManage && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" />New Task
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-meta-4">
              <tr>{['Title','Project','Assignee','Priority','Status','Deadline','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              <AnimatePresence>
                {filtered.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isOverdue(t) && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        <span className="font-medium text-black dark:text-white">{t.title}</span>
                      </div>
                      {t.description && <p className="text-xs text-gray-400 truncate max-w-xs">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.projectName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.assignedToName || 'Unassigned'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span></td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select value={t.status} onChange={e => handleStatusChange(t.id, e.target.value as TaskStatus)} className="text-xs border border-stroke dark:border-strokedark rounded-lg px-2 py-1 bg-white dark:bg-boxdark focus:outline-none focus:ring-1 focus:ring-primary">
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      ) : <StatusBadge status={t.status} />}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${isOverdue(t) ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                        {t.deadline ? format(new Date(t.deadline), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setCommentTask(t); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-blue-500 transition-colors" title="Comments"><MessageSquare className="w-4 h-4" /></button>
                        {canManage && <>
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No tasks found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? 'Edit Task' : 'New Task'} size="lg" footer={
        <><button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button><button onClick={handleSave} className="px-4 py-2 text-sm bg-primary hover:bg-opacity-90 text-white rounded-xl">{editTask ? 'Save' : 'Create'}</button></>
      }>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium mb-1">Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Project</label><select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Assign To</label><select value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Priority</label><select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Est. Hours</label><input type="number" value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Deadline</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
        </div>
      </Modal>

      {/* Comments Modal */}
      <Modal isOpen={commentTask !== null} onClose={() => { setCommentTask(null); setCommentText(''); }} title={`Comments — ${commentTask?.title}`} size="lg">
        <div className="space-y-3 max-h-64 overflow-y-auto mb-3 pr-1">
          {commentTask?.comments?.length ? commentTask.comments.map(c => (
            <div key={c.id} className="rounded-xl bg-gray-50 dark:bg-meta-4 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-black dark:text-white">{c.authorName}</span>
                <span className="text-xs text-gray-400">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{c.content}</p>
            </div>
          )) : <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>}
        </div>
        <div className="flex gap-2">
          <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()} placeholder="Add a comment..." className="flex-1 px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleAddComment} className="px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm">Send</button>
        </div>
      </Modal>

      <ConfirmModal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && handleDelete(deleteId)} title="Delete Task" message="Delete this task permanently?" confirmLabel="Delete" variant="danger" />
    </>
  );
};

export default Tasks;
