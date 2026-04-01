import React from 'react';
import { Hash, Settings, LogOut, Shield, Circle, User } from 'lucide-react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { user, channels, activeChannel, setActiveChannel, onlineUsers, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // API logout call could be added here
    logout();
    navigate('/login');
  };

  const groupedChannels = channels.reduce((acc, channel) => {
    const type = channel.type || 'text';
    if (!acc[type]) acc[type] = [];
    acc[type].push(channel);
    return acc;
  }, {});

  return (
    <aside className="w-60 bg-background-panel flex flex-col h-full border-r border-slate-800/50">
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
        <h1 className="font-bold text-lg text-indigo-400 flex items-center gap-2">
          <Circle className="fill-indigo-400 w-3 h-3" />
          LinuxHub
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {Object.entries(groupedChannels).map(([type, items]) => (
          <div key={type}>
            <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {type}
            </h3>
            <div className="space-y-0.5">
              {items.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors group ${
                    activeChannel?.id === channel.id
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Hash className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                  <span className="flex-1 text-left truncate font-medium">{channel.name}</span>
                  {channel.is_unread === 1 && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-slate-800/50">
          <h3 className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            Online — {onlineUsers.length}
          </h3>
          <div className="space-y-2 px-2">
            {onlineUsers.map((u) => (
              <div key={u.user_id} className="flex items-center gap-2 text-sm text-slate-400">
                <div className="relative">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm"
                    style={{ backgroundColor: u.avatarColor || '#4F46E5' }}
                  >
                    {u.username[0]}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background-panel rounded-full" />
                </div>
                <span className="truncate">{u.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-900/50 flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold text-white uppercase shadow-lg"
          style={{ backgroundColor: user?.avatarColor || '#4F46E5' }}
        >
          {user?.username?.[0] || 'U'}
        </div>
        <div className="flex-1 truncate">
          <div className="text-sm font-semibold flex items-center gap-1">
            {user?.displayName || user?.username}
            {user?.isAdmin === 1 && <Shield className="w-3 h-3 text-indigo-400" />}
          </div>
          <div className="text-[10px] text-slate-500 truncate lowercase">
            {user?.isAdmin === 1 ? 'Admin' : 'Member'}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => navigate('/settings')}
            className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
