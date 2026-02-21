import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Download, UserCheck, Shield } from 'lucide-react';
import { usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { Alert } from '../components/ui/Alert';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import type { User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ROLES = ['EMPLOYEE', 'MANAGER', 'HR'];
const DEPT_OPTIONS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
const ROLE_BADGE: Record<string, string> = { HR: 'bg-purple-100 text-purple-700', MANAGER: 'bg-blue-100 text-blue-700', EMPLOYEE: 'bg-gray-100 text-gray-600' };
const defaultForm = { firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE', position: '', department: '' };

const Users: React.FC = () => {
  const { user: me } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; msg: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = () => {
    setLoading(true);
    usersApi.getAll().then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchDept = filterDept === 'ALL' || u.department === filterDept;
    return matchSearch && matchRole && matchDept;
  });

  const openCreate = () => { setEditUser(null); setForm(defaultForm); setFormOpen(true); };
  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, position: u.position || '', department: u.department || '' });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email) { setAlert({ type: 'danger', msg: 'Name and email are required.' }); return; }
    try {
      const payload = { ...form, ...(form.password ? {} : { password: undefined }) };
      if (editUser) { await usersApi.update(editUser.id, payload); setAlert({ type: 'success', msg: 'User updated.' }); }
      else {
        if (!form.password) { setAlert({ type: 'danger', msg: 'Password is required for new users.' }); return; }
        await usersApi.create(payload); setAlert({ type: 'success', msg: 'User created.' });
      }
      setFormOpen(false); load();
    } catch { setAlert({ type: 'danger', msg: 'Failed to save user.' }); }
  };

  const handleDelete = async (id: number) => {
    try { await usersApi.delete(id); setAlert({ type: 'success', msg: 'User deleted.' }); load(); }
    catch { setAlert({ type: 'danger', msg: 'Failed to delete user.' }); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setTextColor(30, 64, 175); doc.text('HRPRO - Users Report', 14, 20);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
    autoTable(doc, {
      startY: 33,
      head: [['Name', 'Email', 'Role', 'Department', 'Position']],
      body: filtered.map(u => [`${u.firstName} ${u.lastName}`, u.email, u.role, u.department || '—', u.position || '—']),
      headStyles: { fillColor: [30, 64, 175] }, styles: { fontSize: 9 },
    });
    doc.save('HRPRO-Users.pdf');
  };

  const getInitials = (u: User) => `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
  const avatarColor = (id: number) => COLORS[id % COLORS.length];

  const allDepts = Array.from(new Set(users.map(u => u.department).filter(Boolean))) as string[];

  return (
    <>
      <Breadcrumb pageName="Users" />
      <AnimatePresence>
        {alert && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4"><Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></motion.div>}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {([['Total Users', users.length, 'bg-blue-50 dark:bg-meta-4', 'text-blue-600'], ['HR', users.filter(u => u.role === 'HR').length, 'bg-purple-50 dark:bg-meta-4', 'text-purple-600'], ['Managers', users.filter(u => u.role === 'MANAGER').length, 'bg-amber-50 dark:bg-meta-4', 'text-amber-600']] as const).map(([label, count, bg, color]) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl ${bg} border border-stroke dark:border-strokedark p-4`}>
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 pr-4 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="ALL">All Roles</option>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="ALL">All Depts</option>{allDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke dark:border-strokedark text-sm bg-white dark:bg-boxdark hover:bg-gray-50 transition-colors"><Download className="w-4 h-4" />PDF</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" />Add User
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-meta-4">
              <tr>{['User', 'Email', 'Role', 'Department', 'Position', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              <AnimatePresence>
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${avatarColor(u.id)} text-white text-sm font-medium flex items-center justify-center flex-shrink-0`}>{getInitials(u)}</div>
                        <div>
                          <p className="font-medium text-black dark:text-white">{u.firstName} {u.lastName}</p>
                          {u.id === me?.id && <span className="text-xs text-primary font-medium">(You)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.role === 'HR' && <Shield className="w-3 h-3" />}{u.role === 'MANAGER' && <UserCheck className="w-3 h-3" />}{u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.department || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{u.position || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        {u.id !== me?.id && <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editUser ? 'Edit User' : 'Add User'} size="lg" footer={
        <><button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button><button onClick={handleSave} className="px-4 py-2 text-sm bg-primary hover:bg-opacity-90 text-white rounded-xl">{editUser ? 'Save' : 'Create'}</button></>
      }>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">First Name</label><input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Last Name</label><input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium mb-1">Role</label><select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Department</label><select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Select</option>{DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Position</label><input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && handleDelete(deleteId)} title="Delete User" message="Delete this user? This cannot be undone." confirmLabel="Delete" variant="danger" />
    </>
  );
};

export default Users;
