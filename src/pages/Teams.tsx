import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Crown, UserPlus, UserMinus, Edit2, Trash2, Download, Search } from 'lucide-react';
import { teamsApi, usersApi, projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { Alert } from '../components/ui/Alert';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import type { Team, User, Project } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const defaultForm = { name: '', description: '', projectId: '' };
const memberName = (m: { firstName: string; lastName: string }) => `${m.firstName} ${m.lastName}`;

const Teams: React.FC = () => {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; msg: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [membersTeam, setMembersTeam] = useState<Team | null>(null);
  const [addMemberId, setAddMemberId] = useState('');
  const [leaderModalTeam, setLeaderModalTeam] = useState<Team | null>(null);
  const [newLeaderId, setNewLeaderId] = useState('');
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    setLoading(true);
    try {
      const [teamsRes, usersRes, projectsRes] = await Promise.all([teamsApi.getAll(), usersApi.getAll(), projectsApi.getAll()]);
      setTeams(teamsRes.data);
      setAllUsers(usersRes.data);
      setAllProjects(projectsRes.data);
    } catch { setAlert({ type: 'danger', msg: 'Failed to load teams.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = teams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditTeam(null); setForm(defaultForm); setFormOpen(true); };
  const openEdit = (t: Team) => { setEditTeam(t); setForm({ name: t.name, description: t.description || '', projectId: t.projectId ? String(t.projectId) : '' }); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.projectId) { setAlert({ type: 'danger', msg: 'Please select a project for this team.' }); return; }
    try {
      const payload = { name: form.name, description: form.description, projectId: Number(form.projectId), ...(editTeam ? { teamLeaderId: editTeam.teamLeaderId } : {}) };
      if (editTeam) { await teamsApi.update(editTeam.id, payload); setAlert({ type: 'success', msg: 'Team updated.' }); }
      else { await teamsApi.create(user!.id, payload); setAlert({ type: 'success', msg: 'Team created.' }); }
      setFormOpen(false); load();
    } catch { setAlert({ type: 'danger', msg: 'Failed to save team.' }); }
  };

  const handleDelete = async (id: number) => {
    try { await teamsApi.delete(id); setAlert({ type: 'success', msg: 'Team deleted.' }); load(); }
    catch { setAlert({ type: 'danger', msg: 'Failed to delete team.' }); }
  };

  const handleAddMember = async () => {
    if (!membersTeam || !addMemberId) return;
    try { await teamsApi.addMember(membersTeam.id, Number(addMemberId)); setAddMemberId(''); load(); }
    catch { setAlert({ type: 'danger', msg: 'Failed to add member.' }); }
  };

  const handleRemoveMember = async (teamId: number, userId: number) => {
    try { await teamsApi.removeMember(teamId, userId); load(); }
    catch { setAlert({ type: 'danger', msg: 'Failed to remove member.' }); }
  };

  const handleSetLeader = async () => {
    if (!leaderModalTeam || !newLeaderId) return;
    try { await teamsApi.assignLeader(leaderModalTeam.id, Number(newLeaderId)); setLeaderModalTeam(null); load(); setAlert({ type: 'success', msg: 'Team leader updated.' }); }
    catch { setAlert({ type: 'danger', msg: 'Failed to update leader.' }); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setTextColor(30, 64, 175); doc.text('HRPRO - Teams Report', 14, 20);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
    autoTable(doc, {
      startY: 33,
      head: [['Team', 'Department', 'Leader', 'Members']],
      body: filtered.map(t => [t.name, t.projectName || '—', t.teamLeaderName || '—', String(t.members?.length ?? 0)]),
      headStyles: { fillColor: [30, 64, 175] }, styles: { fontSize: 9 },
    });
    doc.save('HRPRO-Teams.pdf');
  };

  const getAvatarLetters = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
  const teamColor = (id: number) => COLORS[id % COLORS.length];

  const membersTeamData = membersTeam ? teams.find(t => t.id === membersTeam.id) ?? membersTeam : null;
  const memberIds = new Set(membersTeamData?.members?.map(m => m.userId) ?? []);
  const nonMembers = allUsers.filter(u => !memberIds.has(u.id));

  return (
    <>
      <Breadcrumb pageName="Teams" />
      <AnimatePresence>
        {alert && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4"><Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></motion.div>}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..." className="pl-9 pr-4 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke dark:border-strokedark text-sm bg-white dark:bg-boxdark hover:bg-gray-50 transition-colors"><Download className="w-4 h-4" />PDF</button>
          {isHR && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" />New Team
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((team, i) => (
              <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className={`h-2 ${teamColor(team.id)}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-black dark:text-white">{team.name}</h3>
                      {team.projectName && <p className="text-sm text-gray-400 mt-0.5">{team.projectName}</p>}
                    </div>
                    {isHR && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(team)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(team.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                  {team.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{team.description}</p>}

                  {/* Leader */}
                  {team.teamLeaderName && (
                    <div className="flex items-center gap-2 mt-3 text-sm">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{team.teamLeaderName}</span>
                      {isHR && <button onClick={() => { setLeaderModalTeam(team); setNewLeaderId(''); }} className="text-xs text-gray-400 hover:text-primary underline">Change</button>}
                    </div>
                  )}

                  {/* Members avatars */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-2">
                      {(team.members ?? []).slice(0, 5).map(m => (
                        <div key={m.userId} title={memberName(m)} className={`w-8 h-8 rounded-full ${teamColor(m.userId)} text-white text-xs flex items-center justify-center border-2 border-white dark:border-boxdark font-medium`}>
                          {getAvatarLetters(memberName(m))}
                        </div>
                      ))}
                      {(team.members?.length ?? 0) > 5 && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-meta-4 text-xs flex items-center justify-center border-2 border-white dark:border-boxdark font-medium text-gray-600">+{team.members!.length - 5}</div>}
                    </div>
                    <span className="text-xs text-gray-400"><Users className="w-3 h-3 inline mr-1" />{team.members?.length ?? 0} members</span>
                  </div>

                  {/* Actions */}
                  {isHR && (
                    <button onClick={() => setMembersTeam(team)} className="mt-4 w-full py-1.5 rounded-xl border border-stroke dark:border-strokedark text-sm hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <UserPlus className="w-4 h-4" />Manage Members
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No teams found.</div>}
        </div>
      )}

      {/* Team Form Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editTeam ? 'Edit Team' : 'New Team'} footer={
        <><button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button><button onClick={handleSave} className="px-4 py-2 text-sm bg-primary hover:bg-opacity-90 text-white rounded-xl">{editTeam ? 'Save' : 'Create'}</button></>
      }>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium mb-1">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Project <span className="text-red-500">*</span></label><select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Select a project...</option>{allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" /></div>
        </div>
      </Modal>

      {/* Members Modal */}
      <Modal isOpen={membersTeam !== null} onClose={() => setMembersTeam(null)} title={`Members — ${membersTeamData?.name}`} size="lg">
        <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
          {(membersTeamData?.members ?? []).map(m => (
            <div key={m.userId} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-meta-4">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full ${teamColor(m.userId)} text-white text-xs flex items-center justify-center font-medium`}>{getAvatarLetters(memberName(m))}</div>
                <span className="text-sm font-medium text-black dark:text-white">{memberName(m)}</span>
                {m.userId === membersTeamData?.teamLeaderId && <Crown className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <button onClick={() => handleRemoveMember(membersTeamData!.id, m.userId)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-boxdark text-gray-400 hover:text-red-500 transition-colors"><UserMinus className="w-4 h-4" /></button>
            </div>
          ))}
          {!membersTeamData?.members?.length && <p className="text-sm text-gray-400 text-center py-3">No members yet.</p>}
        </div>
        <div className="flex gap-2">
          <select value={addMemberId} onChange={e => setAddMemberId(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Add member...</option>{nonMembers.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}</select>
          <button onClick={handleAddMember} disabled={!addMemberId} className="px-4 py-2 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm disabled:opacity-50">Add</button>
        </div>
      </Modal>

      {/* Leader Modal */}
      <Modal isOpen={leaderModalTeam !== null} onClose={() => setLeaderModalTeam(null)} title="Set Team Leader" footer={
        <><button onClick={() => setLeaderModalTeam(null)} className="px-4 py-2 text-sm rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button><button onClick={handleSetLeader} className="px-4 py-2 text-sm bg-primary hover:bg-opacity-90 text-white rounded-xl">Save</button></>
      }>
        <select value={newLeaderId} onChange={e => setNewLeaderId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Select new leader...</option>
          {(leaderModalTeam?.members ?? []).map(m => <option key={m.userId} value={m.userId}>{memberName(m)}</option>)}
        </select>
      </Modal>

      <ConfirmModal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && handleDelete(deleteId)} title="Delete Team" message="Delete this team? Members will not be affected." confirmLabel="Delete" variant="danger" />
    </>
  );
};

export default Teams;
