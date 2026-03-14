import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Smile, Loader2 } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { getMessages, sendMessage, subscribeToMessages, markMessagesRead } from '../lib/api';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

interface ChatScreenProps {
  user: User;
  currentUser: User;
  onBack: () => void;
  onNewMessage?: (userId: string) => void;
}

const EMOJIS = ['😊', '😂', '🥰', '😍', '🤔', '😎', '😭', '👍', '🔥', '✨', '🌈', '🎨', '💡', '🌱', '☕️', '📷'];

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen({ user, currentUser, onBack, onNewMessage }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚到最底部
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // 初始化：加载历史消息
  useEffect(() => {
    if (!currentUser?.id || !user?.id) return;
    setIsLoading(true);
    Promise.all([
      getMessages(currentUser.id, user.id),
      markMessagesRead(currentUser.id, user.id),
    ]).then(([data]) => {
        setMessages(data);
        scrollToBottom();
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUser.id, user.id]);

  // 实时订阅新消息
  useEffect(() => {
    if (!currentUser?.id || !user?.id) return;

    const channel = subscribeToMessages(currentUser.id, user.id, (newMsg) => {
      // 只接收对方发来的消息（自己发的已经乐观更新了）
      if (newMsg.sender_id === user.id) {
        setMessages(prev => {
          // 防止重复
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
        onNewMessage?.(user.id);
      }
    });

    return () => {
      channel.then(c => c.unsubscribe()).catch(() => {});
    };
  }, [currentUser.id, user.id]);

  // 新消息时滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    if (!currentUser?.id || !user?.id) return;

    setInputText('');
    setShowEmojiPicker(false);
    setIsSending(true);

    // 乐观更新：立刻显示自己发的消息
    const optimistic: Message = {
      id: 'temp_' + Date.now(),
      sender_id: currentUser.id,
      recipient_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottom();

    try {
      const sent = await sendMessage(currentUser.id, user.id, text);
      // 用真实数据替换临时消息
      setMessages(prev => prev.map(m => m.id === optimistic.id ? sent : m));
    } catch {
      // 失败：移除临时消息，恢复输入框
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // 按日期分组消息
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((groups, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groups.push({ date, msgs: [msg] });
    }
    return groups;
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* 顶部 */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-full overflow-hidden bg-primary/10">
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">{user.name}</h1>
          </div>
        </div>
      </header>

      {/* 消息区 */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary/30" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
            </div>
            <p className="text-slate-400 text-sm">和 {user.name} 开始聊天吧</p>
          </div>
        ) : (
          <>
            {groupedMessages.map(group => (
              <div key={group.date}>
                {/* 日期分隔 */}
                <div className="text-center py-2 mb-2">
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{group.date}</span>
                </div>
                <AnimatePresence initial={false}>
                  {group.msgs.map(msg => {
                    const isMe = msg.sender_id === currentUser.id;
                    const isTemp = msg.id.startsWith('temp_');
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[78%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="size-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 self-end">
                            <img
                              src={isMe ? currentUser.avatar : user.avatar}
                              alt="avatar"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer" loading="lazy" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isMe
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-white text-slate-800 rounded-tl-none'
                            } ${isTemp ? 'opacity-70' : ''}`}>
                              {msg.content}
                            </div>
                            <span className={`text-[10px] text-slate-400 ${isMe ? 'text-right' : 'text-left'}`}>
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ))}
          </>
        )}
      </main>

      {/* 输入区 */}
      <footer className="bg-white border-t border-slate-100 p-4 pb-8 relative">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-0 right-0 bg-white border-t border-slate-100 p-4 grid grid-cols-8 gap-2 shadow-lg"
            >
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:bg-slate-50 p-1 rounded transition-colors">
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
              placeholder="发送消息..."
              className="w-full bg-slate-50 border border-slate-100 rounded-full px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${showEmojiPicker ? 'text-primary' : 'text-slate-300 hover:text-primary'}`}
            >
              <Smile size={18} />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="size-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </footer>
    </div>
  );
}
