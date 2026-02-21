import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const DropdownNotification: React.FC = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)} className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-meta-4 hover:bg-gray-200 dark:hover:bg-boxdark-2 transition-colors">
        <Bell className="w-5 h-5 text-black dark:text-white" />
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stroke dark:border-strokedark">
              <h4 className="font-semibold text-black dark:text-white text-sm">Notifications</h4>
              {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-stroke dark:divide-strokedark">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No notifications</p>
              ) : notifications.slice(0, 10).map(n => (
                <div key={n.id} onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors ${!n.isRead ? 'bg-blue-50 dark:bg-meta-4' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? 'font-medium text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.createdAt ? format(new Date(n.createdAt), 'MMM d, h:mm a') : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DropdownNotification;
