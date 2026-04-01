import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import useStore from '../store/useStore';
import MessageItem from './MessageItem';

const MessageList = () => {
  const { messages, activeChannel, typingUsers } = useStore();
  const parentRef = useRef();

  const channelTyping = typingUsers.filter(u => u.channel_id === activeChannel?.id);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  useEffect(() => {
    if (messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length, activeChannel?.id]);

  if (!activeChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-background-deep">
        <div className="p-8 rounded-2xl bg-background-panel border border-slate-800/50 shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg transform rotate-12" />
          </div>
          <h2 className="text-xl font-bold text-slate-200">Welcome to LinuxHub</h2>
          <p className="text-sm leading-relaxed">Select a channel from the sidebar to join the conversation with other Linux enthusiasts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-background-deep">
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MessageItem message={messages[virtualRow.index]} />
            </div>
          ))}
        </div>
      </div>
      
      {channelTyping.length > 0 && (
        <div className="px-6 py-2 text-[11px] text-slate-400 font-medium bg-background-deep/80 absolute left-0 bottom-0 w-full backdrop-blur-sm italic border-t border-slate-800/30">
          <span className="text-indigo-400 font-bold">
            {channelTyping.map(u => u.username).join(', ')}
          </span>
          {channelTyping.length === 1 ? ' is ' : ' are '} typing...
        </div>
      )}
    </div>
  );
};

export default MessageList;
