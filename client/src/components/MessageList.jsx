import React, { useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import useStore from '../store/useStore';
import MessageItem from './MessageItem';

const MessageList = () => {
  const { messages, activeChannel, typingUsers } = useStore();
  const listRef = useRef();

  const channelTyping = typingUsers.filter(u => u.channel_id === activeChannel?.id);

  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
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

  const Row = ({ index, style }) => (
    <div style={style}>
      <MessageItem message={messages[index]} />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-background-deep">
      <div className="flex-1 w-full">
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              height={height}
              width={width}
              itemCount={messages.length}
              itemSize={80} // Estimated size
              className="scrollbar-hide"
            >
              {Row}
            </List>
          )}
        </AutoSizer>
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
