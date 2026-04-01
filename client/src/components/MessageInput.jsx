import React, { useState, useRef } from 'react';
import { Paperclip, Send, X, FileText, Image as ImageIcon } from 'lucide-react';
import useStore from '../store/useStore';

const MessageInput = () => {
  const { activeChannel, socket, user, accessToken } = useStore();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', activeChannel.id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing:stop', activeChannel.id);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append('content', content);
    files.forEach(file => formData.append('attachments', file));

    try {
      const response = await fetch(`http://localhost:3001/api/messages/channel/${activeChannel.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (response.ok) {
        const newMessage = await response.json();
        // Socket broadcast usually happens server-side, but if we need manually:
        // socket.emit('message:send', newMessage);
        setContent('');
        setFiles([]);
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);
    handleTyping();
    
    // Auto-expand
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  if (!activeChannel) return null;

  return (
    <div className="px-6 py-4 bg-background-deep border-t border-slate-800/50">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-900 border border-slate-700/50 rounded-lg px-2 py-1.5 animate-message">
                {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-indigo-400" /> : <FileText className="w-4 h-4 text-indigo-400" />}
                <span className="text-xs text-slate-300 truncate max-w-[150px]">{file.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3 relative group">
          <div className="flex-1 bg-slate-900/80 border border-slate-700/50 rounded-2xl p-1.5 focus-within:border-indigo-500/50 transition-all shadow-inner group">
            <textarea
              ref={textareaRef}
              rows={1}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${activeChannel.name}...`}
              className="w-full bg-transparent border-none focus:ring-0 text-slate-200 text-sm py-2 px-3 resize-none scrollbar-hide min-h-[40px] max-h-[150px]"
            />
            
            <div className="flex items-center justify-between px-2 pt-1 pb-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-indigo-400 transition-all active:scale-95"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              <button
                type="submit"
                disabled={!content.trim() && files.length === 0}
                className="p-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
