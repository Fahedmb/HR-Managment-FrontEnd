import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { Alert } from '../components/ui/Alert';
import { ConfirmModal } from '../components/ui/Modal';

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

interface TimesheetSchedule {
  id?: number;
  userId: number;
  chosenDays: DayOfWeek[];
  startTime: string;
  totalHoursPerWeek: number;
  hoursPerDay: number;
  status?: string;
  createdAt?: string;
}

const ALL_DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending Approval', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
  APPROVED: { label: 'Approved', color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle className="w-4 h-4" /> },
  REJECTED: { label: 'Rejected', color: 'text-red-600 bg-red-50 border-red-200', icon: <AlertCircle className="w-4 h-4" /> },
  PENDING_DELETION: { label: 'Pending Deletion', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: <RefreshCw className="w-4 h-4" /> },
};

const Timesheet: React.FC = () => {
  const { user, token } = useAuth();

  const [schedule, setSchedule] = useState<TimesheetSchedule | null>(null);
  const [chosenDays, setChosenDays] = useState<DayOfWeek[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger' | 'warning'; msg: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const TOTAL_HOURS = 40;
  const hoursPerDay = chosenDays.length > 0 ? Math.round((TOTAL_HOURS / chosenDays.length) * 10) / 10 : 0;

  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:9090/api/timesheet-schedules/user/${user.id}`, { headers });
      if (res.data) {
        setSchedule(res.data);
        setChosenDays(res.data.chosenDays || []);
        setStartTime(res.data.startTime || '09:00');
      } else {
        setSchedule(null);
      }
    } catch {
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const isPending = schedule?.status === 'PENDING' || schedule?.status === 'PENDING_DELETION';

  const toggleDay = (day: DayOfWeek) => {
    if (isPending) return;
    setChosenDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (chosenDays.length === 0) { setAlert({ type: 'warning', msg: 'Please select at least one working day.' }); return; }

    setSaving(true);
    setAlert(null);
    try {
      const payload: TimesheetSchedule = {
        userId: user.id,
        chosenDays,
        startTime,
        totalHoursPerWeek: TOTAL_HOURS,
        hoursPerDay,
      };

      if (schedule?.id) {
        await axios.put(`http://localhost:9090/api/timesheet-schedules/${schedule.id}`, payload, { headers });
        setAlert({ type: 'success', msg: 'Schedule update request submitted. Awaiting HR approval.' });
      } else {
        await axios.post('http://localhost:9090/api/timesheet-schedules', payload, { headers });
        setAlert({ type: 'success', msg: 'Schedule submitted for HR approval.' });
      }
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save schedule.';
      setAlert({ type: 'danger', msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule?.id) return;
    try {
      await axios.delete(`http://localhost:9090/api/timesheet-schedules/${schedule.id}`, { headers });
      setAlert({ type: 'success', msg: 'Schedule deletion requested.' });
      load();
    } catch {
      setAlert({ type: 'danger', msg: 'Failed to request deletion.' });
    }
    setConfirmDelete(false);
  };

  const statusCfg = schedule?.status ? STATUS_CONFIG[schedule.status] : null;

  return (
    <>
      <Breadcrumb pageName="Timesheet" />

      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5">
            <Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Current Status Card */}
          {schedule && statusCfg && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${statusCfg.color}`}>
              {statusCfg.icon}
              <div>
                <p className="text-sm font-semibold">{statusCfg.label}</p>
                <p className="text-xs opacity-70">
                  {schedule.chosenDays?.join(', ')} · Start: {schedule.startTime} · {schedule.hoursPerDay}h/day · {schedule.totalHoursPerWeek}h/week
                </p>
              </div>
            </motion.div>
          )}

          {/* Schedule Form */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  {schedule ? 'Update Work Schedule' : 'Set Up Work Schedule'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Standard 40 hours/week. Choose your working days and start time.
                </p>
              </div>
              {schedule && !isPending && (
                <button onClick={() => setConfirmDelete(true)}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Day Selector */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-3">
                  Working Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map(day => {
                    const active = chosenDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        disabled={isPending}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          active
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white dark:bg-meta-4 text-gray-600 dark:text-gray-300 border-stroke dark:border-strokedark hover:border-primary hover:text-primary'
                        } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {DAY_SHORT[day]}
                      </button>
                    );
                  })}
                </div>
                {chosenDays.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {chosenDays.length} day{chosenDays.length !== 1 ? 's' : ''} selected · <span className="text-primary font-medium">{hoursPerDay}h/day</span> · 40h/week
                  </p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  disabled={isPending}
                  className={`w-full max-w-xs px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {startTime && chosenDays.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Work hours: {startTime} → {(() => {
                      const [h, m] = startTime.split(':').map(Number);
                      const endH = h + Math.floor(hoursPerDay);
                      const endM = m + Math.round((hoursPerDay % 1) * 60);
                      const totalM = endH * 60 + endM;
                      return `${String(Math.floor(totalM / 60)).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;
                    })()}
                  </p>
                )}
              </div>

              {/* Submit */}
              {!isPending && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={saving || chosenDays.length === 0}
                  className="w-full py-3 bg-primary hover:bg-opacity-90 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : schedule ? 'Request Schedule Update' : 'Submit Schedule'}
                </motion.button>
              )}

              {isPending && (
                <div className="text-center py-2 text-sm text-gray-400">
                  Your request is awaiting HR approval. Changes are locked until a decision is made.
                </div>
              )}
            </form>
          </motion.div>

          {/* Info Card */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-stroke dark:border-strokedark p-5 bg-gray-50 dark:bg-meta-4">
            <h3 className="text-sm font-semibold text-black dark:text-white mb-2">How it works</h3>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li>• Select your working days and preferred start time</li>
              <li>• Your schedule is submitted to HR for approval</li>
              <li>• Hours are auto-distributed (40h ÷ number of selected days)</li>
              <li>• Once approved, your schedule is active and tracked</li>
              <li>• You can request changes at any time — HR will review them</li>
            </ul>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Request Schedule Deletion"
        message="This will submit a request to HR to delete your work schedule. Are you sure?"
        confirmLabel="Request Deletion"
        variant="danger"
      />
    </>
  );
};

export default Timesheet;
