import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { Menu, Hash, Users, Bell } from 'lucide-react';
import { API_BASE } from '../config';
import { Navigate } from 'react-router-dom';

const Chat = () => {
  const { user, accessToken, setChannels, setActiveChannel, activeChannel, setMessages } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/channels`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setChannels(data);
          if (data.length > 0 && !activeChannel) {
            setActiveChannel(data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch channels:', err);
      }
    };

    fetchChannels();
  }, [accessToken]);

  useEffect(() => {
    if (!activeChannel) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/messages/channel/${activeChannel.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          
          // Mark as read
          fetch(`${API_BASE}/api/channels/${activeChannel.id}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();
  }, [activeChannel?.id, accessToken]);

  return (
    <div className="flex h-screen bg-background-deep overflow-hidden">
      {/* Sidebar - collapses on mobile */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-20 h-full transition-transform duration-300 ease-in-out`}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10 glass">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-white/[0.03] bg-background-deep/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-md text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            {activeChannel ? (
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-slate-500" />
                <h2 className="font-bold text-slate-100">{activeChannel.name}</h2>
                {activeChannel.description && (
                  <>
                    <div className="w-px h-4 bg-slate-800 mx-1" />
                    <p className="text-xs text-slate-500 truncate max-w-md hidden md:block">
                      {activeChannel.description}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <h2 className="font-bold text-slate-400">LinuxHub</h2>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-300 transition-colors hidden sm:block">
              <Bell className="w-5 h-5" />
            </button>
            <button className="text-slate-500 hover:text-slate-300 transition-colors">
              <Users className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <MessageList />

        {/* Input */}
        <MessageInput />
      </main>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-10"
        />
      )}
    </div>
  );
};

export default Chat;
