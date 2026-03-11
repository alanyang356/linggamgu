import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Image, Smile } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  senderId: string;
  text?: string;
  image?: string;
  time: string;
}

interface ChatScreenProps {
  user: User;
  currentUser: User;
  onBack: () => void;
  onNewMessage?: (userId: string) => void;
}

const EMOJIS = ['😊', '😂', '🥰', '😍', '🤔', '😎', '😭', '👍', '🔥', '✨', '🌈', '🎨', '💡', '🌱', '☕️', '📷'];

export default function ChatScreen({ user, currentUser, onBack, onNewMessage }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: user.id,
      text: '你好！看到你分享的灵感了，非常棒！',
      time: '14:20'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text?: string, image?: string) => {
    if (!text?.trim() && !image) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text,
      image,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setShowEmojiPicker(false);

    // Simulate reply if it's a text message and first interaction
    if (text && messages.length === 1) {
      setTimeout(() => {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          senderId: user.id,
          text: '谢谢你的关注！我们可以多交流。',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, reply]);
        if (onNewMessage) onNewMessage(user.id);
      }, 1500);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSend(undefined, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = '';
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
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
            <p className="text-[10px] text-green-500 font-medium">在线</p>
          </div>
        </div>
      </header>

      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <div className="text-center py-4">
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">今天 14:20</span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="size-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200">
                    <img 
                      src={isMe ? currentUser.avatar : user.avatar} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" loading="lazy" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className={`rounded-2xl text-sm shadow-sm overflow-hidden ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none'
                    }`}>
                      {msg.image && (
                        <div className="max-w-xs">
                          <img 
                            src={msg.image} 
                            alt="Sent content" 
                            className="w-full h-auto block" 
                            referrerPolicy="no-referrer" loading="lazy" />
                        </div>
                      )}
                      {msg.text && (
                        <div className="px-4 py-2">
                          {msg.text}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] text-slate-400 ${isMe ? 'text-right' : 'text-left'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>

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
                <button 
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:bg-slate-50 p-1 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={handleImageClick}
            className="p-2 text-slate-400 hover:text-primary transition-colors"
          >
            <Image size={20} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
              placeholder="发送消息..."
              className="w-full bg-slate-50 border border-slate-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${showEmojiPicker ? 'text-primary' : 'text-slate-300 hover:text-primary'}`}
            >
              <Smile size={18} />
            </button>
          </div>
          <button 
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim()}
            className="size-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
