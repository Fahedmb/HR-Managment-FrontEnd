import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Users, Search } from 'lucide-react';
import { chatApi, usersApi } from '../services/api';
import { useChatSocket } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import type { ChatMessage, User } from '../types';
import { format } from 'date-fns';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const { sendMessage: wsSend, setOnMessage } = useChatSocket();

  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    usersApi.getAll().then(r => setContacts(r.data.filter(u => u.id !== user!.id))).catch(() => {});
  }, []);

  useEffect(() => {
    setOnMessage((msg: ChatMessage) => {
      if ((msg.senderId === selectedUser?.id && msg.receiverId === user!.id) ||
          (msg.senderId === user!.id && msg.receiverId === selectedUser?.id)) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    });
  }, [selectedUser]);

  const loadMessages = async (contact: User) => {
    setSelectedUser(contact); setLoadingMsgs(true);
    try {
      const r = await chatApi.getConversation(user!.id, contact.id);
      setMessages(r.data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
    finally { setLoadingMsgs(false); }
  };

  const handleSend = async () => {
    if (!text.trim() || !selectedUser) return;
    const msg = { senderId: user!.id, receiverId: selectedUser.id, content: text.trim() };
    setText('');
    try {
      wsSend(msg);
      const r = await chatApi.sendMessage({ senderId: user!.id, receiverId: selectedUser.id, content: msg.content });
      setMessages(prev => [...prev, r.data]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {}
  };

  const filteredContacts = contacts.filter(c => !search || `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()));
  const getInitials = (u: User) => `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  const COLORS = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-amber-500','bg-red-500','bg-pink-500'];
  const avatarColor = (id: number) => COLORS[id % COLORS.length];

  return (
    <div className="flex h-[calc(100vh-160px)] rounded-2xl overflow-hidden border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-sm">
      {/* Contacts Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-stroke dark:border-strokedark flex flex-col">
        <div className="p-4 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="font-semibold text-black dark:text-white">Messages</span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-meta-4 text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map(c => (
            <button key={c.id} onClick={() => loadMessages(c)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors text-left ${selectedUser?.id === c.id ? 'bg-blue-50 dark:bg-meta-4' : ''}`}>
              <div className={`w-10 h-10 rounded-full ${avatarColor(c.id)} text-white font-medium flex items-center justify-center flex-shrink-0`}>{getInitials(c)}</div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-black dark:text-white truncate">{c.firstName} {c.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{c.position || c.role}</p>
              </div>
            </button>
          ))}
          {filteredContacts.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No contacts</p>}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
              <div className={`w-9 h-9 rounded-full ${avatarColor(selectedUser.id)} text-white text-sm font-medium flex items-center justify-center`}>{getInitials(selectedUser)}</div>
              <div>
                <p className="font-semibold text-sm text-black dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-xs text-gray-400">{selectedUser.department || selectedUser.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {loadingMsgs ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg, i) => {
                    const isMine = msg.senderId === user!.id;
                    return (
                      <motion.div key={msg.id ?? i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 dark:bg-meta-4 text-black dark:text-white rounded-bl-sm'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>{msg.sentAt ? format(new Date(msg.sentAt), 'h:mm a') : ''}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              {messages.length === 0 && !loadingMsgs && <p className="text-center text-sm text-gray-400 py-8">No messages yet. Say hello!</p>}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-stroke dark:border-strokedark">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-meta-4 rounded-xl px-4 py-2">
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Type a message..." className="flex-1 bg-transparent text-sm focus:outline-none text-black dark:text-white placeholder:text-gray-400" />
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!text.trim()} className="p-2 rounded-xl bg-primary hover:bg-opacity-90 text-white disabled:opacity-50 transition-colors">
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Users className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-lg font-medium">Select a contact</p>
            <p className="text-sm">Choose someone to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
