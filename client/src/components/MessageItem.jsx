import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Download, FileText, ImageIcon, Edit2, Trash2 } from 'lucide-react';
import useStore from '../store/useStore';

const MessageItem = ({ message }) => {
  const { user } = useStore();
  const isOwn = message.user_id === user?.id;
  const isAdmin = user?.isAdmin === 1;

  const formatDate = (isoStr) => {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isImage = (mimeType) => mimeType.startsWith('image/');

  return (
    <div className="group px-6 py-4 hover:bg-slate-800/30 transition-all border-b border-white/[0.03] relative flex gap-4 animate-message">
      <div 
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-white uppercase shadow-lg shadow-black/20"
        style={{ backgroundColor: message.avatar_color || '#4F46E5' }}
      >
        {message.username[0]}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-slate-200 text-sm hover:underline cursor-pointer">
            {message.display_name || message.username}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {formatDate(message.created_at)}
          </span>
          {message.edited_at && <span className="text-[10px] text-slate-600 italic">(edited)</span>}
        </div>
        
        <div className="text-slate-300 text-[14px] leading-relaxed break-words markdown">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeSanitize]}
            components={{
              code({node, inline, className, children, ...props}) {
                return (
                  <code className={`${className} bg-slate-900 border border-slate-700/50 rounded px-1.5 py-0.5 text-indigo-300 font-mono text-[13px]`} {...props}>
                    {children}
                  </code>
                );
              },
              pre({children}) {
                return (
                  <pre className="bg-slate-900/80 border border-slate-700/30 rounded-lg p-3 my-2 overflow-x-auto shadow-inner">
                    {children}
                  </pre>
                )
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {message.attachments.map((file) => (
              <div key={file.id} className="max-w-sm rounded-xl overflow-hidden bg-slate-900/50 border border-slate-800 p-2 group-attachment hover:border-slate-700/50 transition-colors shadow-xl shadow-black/10">
                {isImage(file.mimeType) ? (
                  <div className="relative cursor-zoom-in">
                    <img 
                      src={`http://localhost:3001/api/files/${file.filename}`} 
                      alt={file.originalName}
                      className="max-h-60 rounded-lg object-contain w-full"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-2 min-w-[200px]">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-300 truncate">{file.originalName}</div>
                      <div className="text-[10px] text-slate-500">{(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <a 
                      href={`http://localhost:3001/api/files/${file.filename}`}
                      download={file.originalName}
                      className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-slate-900/80 border border-slate-700/50 rounded-lg p-1 shadow-xl backdrop-blur-sm transition-all scale-95 group-hover:scale-100">
        {(isOwn || isAdmin) && (
          <>
            <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-indigo-400 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
