import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, Calendar, Users, Trash2, Edit2, Eye, Filter, Download } from 'lucide-react';
import { projectsApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { StatusBadge, Alert } from '../components/ui/Alert';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import type { Project, ProjectStatus } from '../types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUSES: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

const defaultForm = { name: '', description: '', department: '', startDate: '', deadline: '', status: 'PLANNING' as ProjectStatus };

const Projects: React.FC = () => {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; msg: string } | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = () => {
    setLoading(true);
    projectsApi.getAll().then(r => { setProjects(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = projects.filter(p => {
    const matchStatus = filter === 'ALL' || p.status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.department?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openCreate = () => { setEditProject(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (p: Project) => { setEditProject(p); setForm({ name: p.name, description: p.description, department: p.department, startDate: p.startDate, deadline: p.deadline, status: p.status }); setModalOpen(true); };

  const handleSave = async () => {
    try {
      if (editProject) {
        await projectsApi.update(editProject.id, form);
        setAlert({ type: 'success', msg: 'Project updated successfully.' });
      } else {
        await projectsApi.create(user!.id, form);
        setAlert({ type: 'success', msg: 'Project created successfully.' });
      }
      setModalOpen(false);
      load();
    } catch {
      setAlert({ type: 'danger', msg: 'Failed to save project.' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await projectsApi.delete(id);
      setAlert({ type: 'success', msg: 'Project deleted.' });
      load();
    } catch {
      setAlert({ type: 'danger', msg: 'Failed to delete project.' });
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(30, 64, 175);
    doc.text('HRPRO - Projects Report', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [['Name', 'Department', 'Status', 'Start Date', 'Deadline', 'Tasks']],
      body: filtered.map(p => [p.name, p.department, p.status, p.startDate, p.deadline, `${p.completedTasks}/${p.totalTasks}`]),
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 9 },
    });
    doc.save('HRPRO-Projects.pdf');
  };

  return (
    <>
      <Breadcrumb pageName="Projects" />
      <AnimatePresence>
        {alert && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4"><Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></motion.div>}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="px-4 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke dark:border-strokedark text-sm bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"><Download className="w-4 h-4" />PDF</button>
          {isHR && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm font-medium shadow-sm transition-all">
              <Plus className="w-4 h-4" />New Project
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No projects found.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p, i) => {
            const progress = p.totalTasks ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
            const isOverdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'COMPLETED';
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-black dark:text-white truncate">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{p.department}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.startDate ? format(new Date(p.startDate), 'MMM d') : '—'}</span>
                  <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}><Calendar className="w-3 h-3" />{p.deadline ? format(new Date(p.deadline), 'MMM d, yyyy') : '—'}{isOverdue && ' ⚠'}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progress</span><span>{p.completedTasks}/{p.totalTasks} tasks</span></div>
                  <div className="w-full bg-gray-100 dark:bg-meta-4 rounded-full h-1.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400">By {p.createdByName}</span>
                  <div className="flex items-center gap-1">
                    {isHR && (
                      <>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProject ? 'Edit Project' : 'New Project'} size="lg" footer={
        <>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary hover:bg-opacity-90 text-white rounded-xl transition-colors">{editProject ? 'Save Changes' : 'Create Project'}</button>
        </>
      }>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Project Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Redesign" className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Project description..." className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Department</label><input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Engineering" className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark focus:outline-none focus:ring-2 focus:ring-primary text-sm">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Deadline</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && handleDelete(deleteId)} title="Delete Project" message="Are you sure you want to delete this project? This action cannot be undone." confirmLabel="Delete" variant="danger" />
    </>
  );
};

export default Projects;
