import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Sun, Moon, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropdownNotification from './DropdownNotification';
import { useAuth } from '../../context/AuthContext';
import useColorMode from '../../hooks/useColorMode';
import { usersApi, projectsApi, tasksApi } from '../../services/api';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const STATIC_PAGES = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Leave Requests', path: '/leave' },
  { label: 'Timesheet', path: '/timesheet' },
  { label: 'Projects', path: '/projects' },
  { label: 'Teams', path: '/teams' },
  { label: 'Meetings', path: '/meetings' },
  { label: 'Chat', path: '/chat' },
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Users', path: '/users' },
];

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [colorMode, setColorMode] = useColorMode();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string; path: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowResults(false); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const q = query.toLowerCase();
      const items: { label: string; path: string }[] = [];

      // Always search static pages first (instant, no API needed)
      STATIC_PAGES.filter(p => p.label.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(p => items.push({ label: `📄 ${p.label}`, path: p.path }));

      // Then try API searches (best effort — failures are silently ignored)
      try {
        const [ur, pr, tr] = await Promise.allSettled([
          usersApi.getAll(),
          projectsApi.getAll(),
          tasksApi.getAll(),
        ]);
        if (ur.status === 'fulfilled' && Array.isArray(ur.value.data))
          ur.value.data
            .filter((u: any) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach((u: any) => items.push({ label: `👤 ${u.firstName} ${u.lastName}`, path: '/users' }));
        if (pr.status === 'fulfilled' && Array.isArray(pr.value.data))
          pr.value.data
            .filter((p: any) => (p.name ?? '').toLowerCase().includes(q))
            .slice(0, 3)
            .forEach((p: any) => items.push({ label: `📁 ${p.name}`, path: '/projects' }));
        if (tr.status === 'fulfilled' && Array.isArray(tr.value.data))
          tr.value.data
            .filter((t: any) => (t.title ?? '').toLowerCase().includes(q))
            .slice(0, 3)
            .forEach((t: any) => items.push({ label: `✅ ${t.title}`, path: '/tasks' }));
      } catch { /* ignore API errors */ }

      setResults(items);
      setShowResults(true);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white dark:bg-boxdark drop-shadow-1 dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        {/* Left: hamburger */}
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-controls="sidebar" className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden">
            <Menu className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-md mx-4 hidden md:block">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-meta-4 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="Search users, projects, tasks..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-black dark:text-white placeholder:text-gray-400"
            />
            {searching && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />}
          </div>
          <AnimatePresence>
            {showResults && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-xl z-50 overflow-hidden">
                {results.length > 0 ? results.map((r, i) => (
                  <button key={i} onClick={() => { navigate(r.path); setQuery(''); setShowResults(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors text-black dark:text-white border-b border-stroke dark:border-strokedark last:border-0">
                    {r.label}
                  </button>
                )) : (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">No results for "{query}"</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Dark mode */}
          <button onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-meta-4 hover:bg-gray-200 dark:hover:bg-boxdark-2 transition-colors">
            {colorMode === 'dark' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-black" />}
          </button>

          {/* Notifications */}
          <DropdownNotification />

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
              title={`${user?.firstName} ${user?.lastName}`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initials}
              </div>
              <span className="hidden lg:block text-sm font-medium text-black dark:text-white max-w-[90px] truncate">
                {user?.firstName}
              </span>
              <ChevronDown className={`hidden lg:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-xl z-50 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-stroke dark:border-strokedark">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-stroke dark:border-strokedark py-1">
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-meta-4 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
