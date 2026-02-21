import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, LayoutDashboard, CheckSquare, Calendar, Clock,
  Users, FolderKanban, UsersRound, Video, MessageCircle,
  User, Settings, ChevronDown, LogOut, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
  roles?: string[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> }],
  },
  {
    title: 'My Work',
    items: [
      { label: 'Tasks', path: '/tasks', icon: <CheckSquare className="w-5 h-5" /> },
      { label: 'Leave', path: '/leave', icon: <Calendar className="w-5 h-5" /> },
      { label: 'Timesheet', path: '/timesheet', icon: <Clock className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Collaboration',
    items: [
      { label: 'Projects', path: '/projects', icon: <FolderKanban className="w-5 h-5" /> },
      { label: 'Teams', path: '/teams', icon: <UsersRound className="w-5 h-5" /> },
      { label: 'Meetings', path: '/meetings', icon: <Video className="w-5 h-5" /> },
      { label: 'Chat', path: '/chat', icon: <MessageCircle className="w-5 h-5" /> },
    ],
  },
  {
    title: 'HR Admin',
    roles: ['HR'],
    items: [
      { label: 'Users', path: '/users', icon: <Users className="w-5 h-5" />, roles: ['HR'] },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', path: '/profile', icon: <User className="w-5 h-5" /> },
      { label: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role ?? '';
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (!sidebarOpen || sidebar.current.contains(target as Node) || trigger.current.contains(target as Node)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  useEffect(() => {
    const keyHandler = ({ key }: KeyboardEvent) => {
      if (!sidebarOpen || key !== 'Escape') return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-boxdark duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-6 py-5.5 lg:py-6.5">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">HRPRO</span>
        </NavLink>
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden text-bodydark hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto flex-1 px-4 py-2 scrollbar-thin scrollbar-thumb-boxdark-2">
        {NAV_GROUPS.map(group => {
          if (group.roles && !group.roles.includes(role)) return null;
          const visibleItems = group.items.filter(item => !item.roles || item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-bodydark2 px-3 mb-1 mt-3">{group.title}</p>
              <nav>
                {visibleItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 mb-0.5 ${isActive
                        ? 'bg-graydark text-white'
                        : 'text-bodydark hover:bg-graydark hover:text-white'
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`transition-colors ${isActive ? 'text-white' : 'text-bodydark2 group-hover:text-white'}`}>{item.icon}</span>
                        <span>{item.label}</span>
                        {isActive && <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="px-4 py-4 border-t border-strokedark">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-graydark transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-bodydark2 truncate">{user?.role}</p>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg text-bodydark2 hover:text-white transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
