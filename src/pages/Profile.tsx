import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Save, Lock, User as UserIcon, Briefcase, Mail, Shield } from 'lucide-react';
import { usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { Alert } from '../components/ui/Alert';

const DEPT_OPTIONS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState<'profile' | 'security'>('profile');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', position: '', department: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwStrength, setPwStrength] = useState(0);

  useEffect(() => {
    if (user) setProfileForm({ firstName: user.firstName, lastName: user.lastName, position: user.position || '', department: user.department || '' });
  }, [user]);

  const calcStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  const handleSaveProfile = async () => {
    if (!profileForm.firstName || !profileForm.lastName) { setAlert({ type: 'danger', msg: 'Name fields are required.' }); return; }
    setSaving(true);
    try {
      const r = await usersApi.update(user!.id, profileForm);
      updateUser(r.data);
      setAlert({ type: 'success', msg: 'Profile updated successfully.' });
    } catch { setAlert({ type: 'danger', msg: 'Failed to update profile.' }); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) { setAlert({ type: 'danger', msg: 'All password fields are required.' }); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setAlert({ type: 'danger', msg: 'Passwords do not match.' }); return; }
    if (pwStrength < 2) { setAlert({ type: 'danger', msg: 'Password is too weak.' }); return; }
    setSaving(true);
    try {
      await usersApi.resetPassword(user!.id, passwordForm.newPassword);
      setAlert({ type: 'success', msg: 'Password changed successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwStrength(0);
    } catch { setAlert({ type: 'danger', msg: 'Failed to change password.' }); }
    finally { setSaving(false); }
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??';
  const ROLE_BADGE: Record<string, string> = { HR: 'bg-purple-100 text-purple-700', MANAGER: 'bg-blue-100 text-blue-700', EMPLOYEE: 'bg-gray-100 text-gray-600' };

  return (
    <>
      <Breadcrumb pageName="Profile" />
      <AnimatePresence>
        {alert && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4"><Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></motion.div>}
      </AnimatePresence>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
          <div className="px-6 pb-6">
            <div className="relative -mt-12 mb-4 flex items-end justify-between">
              <div className="w-20 h-20 rounded-2xl bg-blue-500 text-white text-2xl font-bold flex items-center justify-center border-4 border-white dark:border-boxdark shadow-lg">{initials}</div>
              <button className="p-2 rounded-xl border border-stroke dark:border-strokedark text-gray-500 hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"><Camera className="w-4 h-4" /></button>
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{user?.position || 'No position set'}</p>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[user?.role ?? 'EMPLOYEE']}`}><Shield className="w-3 h-3" />{user?.role}</span>
              {user?.department && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{user.department}</span>}
            </div>
            <div className="mt-4 pt-4 border-t border-stroke dark:border-strokedark space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500"><Mail className="w-4 h-4 flex-shrink-0" /><span className="truncate">{user?.email}</span></div>
              {user?.position && <div className="flex items-center gap-2 text-sm text-gray-500"><Briefcase className="w-4 h-4 flex-shrink-0" /><span>{user.position}</span></div>}
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm">
          <div className="flex border-b border-stroke dark:border-strokedark">
            {(['profile', 'security'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors capitalize border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}>
                {t === 'profile' ? <UserIcon className="w-4 h-4" /> : <Lock className="w-4 h-4" />}{t === 'profile' ? 'Personal Info' : 'Security'}
              </button>
            ))}
          </div>
          <div className="p-6">
            <AnimatePresence mode="wait">
              {tab === 'profile' ? (
                <motion.div key="profile" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1.5">First Name</label><input value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
                    <div><label className="block text-sm font-medium mb-1.5">Last Name</label><input value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1.5">Email</label><input value={user?.email || ''} disabled className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4 text-gray-400 text-sm cursor-not-allowed" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1.5">Position</label><input value={profileForm.position} onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
                    <div><label className="block text-sm font-medium mb-1.5">Department</label><select value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="">Select...</option>{DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm font-medium disabled:opacity-70"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</motion.button>
                </motion.div>
              ) : (
                <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4 max-w-md">
                  <div><label className="block text-sm font-medium mb-1.5">Current Password</label><input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" /></div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">New Password</label>
                    <input type="password" value={passwordForm.newPassword} onChange={e => { setPasswordForm(f => ({ ...f, newPassword: e.target.value })); setPwStrength(calcStrength(e.target.value)); }} className="w-full px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    {passwordForm.newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">{[0,1,2,3].map(i => (<motion.div key={i} className={`h-1.5 flex-1 rounded-full ${i < pwStrength ? STRENGTH_COLORS[pwStrength] : 'bg-gray-200 dark:bg-meta-4'}`} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3, delay: i * 0.05 }} />))}</div>
                        <p className="text-xs text-gray-500">{STRENGTH_LABELS[pwStrength]}</p>
                      </div>
                    )}
                  </div>
                  <div><label className="block text-sm font-medium mb-1.5">Confirm Password</label><input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} className={`w-full px-4 py-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary text-sm ${passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? 'border-red-400' : 'border-stroke dark:border-strokedark'}`} /></div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleChangePassword} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm font-medium disabled:opacity-70"><Lock className="w-4 h-4" />{saving ? 'Saving...' : 'Change Password'}</motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Profile;
