import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Sun, Moon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DropdownNotification from './DropdownNotification';
import { useAuth } from '../../context/AuthContext';
import useColorMode from '../../hooks/useColorMode';
import { usersApi, projectsApi, tasksApi } from '../../services/api';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [colorMode, setColorMode] = useColorMode();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string; path: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowResults(false); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const [ur, pr, tr] = await Promise.allSettled([
          usersApi.getAll(),
          projectsApi.getAll(),
          tasksApi.getAll(),
        ]);
        const items: { label: string; path: string }[] = [];
        const q = query.toLowerCase();
        if (ur.status === 'fulfilled') ur.value.data.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)).slice(0, 3).forEach(u => items.push({ label: `User: ${u.firstName} ${u.lastName}`, path: '/users' }));
        if (pr.status === 'fulfilled') pr.value.data.filter(p => p.name.toLowerCase().includes(q)).slice(0, 3).forEach(p => items.push({ label: `Project: ${p.name}`, path: '/projects' }));
        if (tr.status === 'fulfilled') tr.value.data.filter(t => t.title.toLowerCase().includes(q)).slice(0, 3).forEach(t => items.push({ label: `Task: ${t.title}`, path: '/tasks' }));
        setResults(items);
        setShowResults(true);
      } catch {}
      finally { setSearching(false); }
    }, 400);
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
            {showResults && results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-xl z-50 overflow-hidden">
                {results.map((r, i) => (
                  <button key={i} onClick={() => { navigate(r.path); setQuery(''); setShowResults(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors text-black dark:text-white border-b border-stroke dark:border-strokedark last:border-0">
                    {r.label}
                  </button>
                ))}
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

          {/* User avatar */}
          <Link to="/profile" className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold hover:shadow-md transition-shadow" title={`${user?.firstName} ${user?.lastName}`}>
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
