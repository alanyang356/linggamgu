import React, { useState, useEffect } from 'react';
import { Settings, Bookmark, FileText, ChevronRight, Lock, Loader2 } from 'lucide-react';
import { Screen, Inspiration, User } from '../types';
import { getMyInspirations, getFollowingList } from '../lib/api';

interface ProfileScreenProps {
  user: User;
  onNavigate: (screen: Screen) => void;
  onSelectInspiration: (inspiration: Inspiration) => void;
  currentUserId: string;
}

const PROFILE_GRADIENTS = [
  { from: '#e8d5f5', to: '#c9b0e8', text: '#4a2d7a' },
  { from: '#d0e8f5', to: '#a8ccec', text: '#1a3d6a' },
  { from: '#fde8d0', to: '#f5c898', text: '#7a3d10' },
  { from: '#d5f0e0', to: '#a8dfc0', text: '#1a5a38' },
  { from: '#f5d5e8', to: '#eaabcc', text: '#6a1a48' },
  { from: '#e8e8d5', to: '#d0ceaa', text: '#4a4820' },
];
function profileGradient(id: string) {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PROFILE_GRADIENTS[hash % PROFILE_GRADIENTS.length];
}
function profileKeyPhrase(text: string): string {
  if (!text) return '';
  const sentences = text.split(/[。！？!?，,]/).map(s => s.trim()).filter(s => s.length > 1);
  if (sentences.length > 1) {
    const ideal = sentences.find(s => s.length >= 6 && s.length <= 14);
    if (ideal) return ideal;
    return sentences.reduce((a, b) => a.length <= b.length ? a : b).slice(0, 14);
  }
  return text.length <= 14 ? text : text.slice(0, 12) + '...';
}

export default function ProfileScreen({ user, onNavigate, onSelectInspiration, currentUserId }: ProfileScreenProps) {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(user.stats.following);

  useEffect(() => {
    getMyInspirations(currentUserId)
      .then(setInspirations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
    // 从数据库实时拉取真实关注数
    getFollowingList(currentUserId)
      .then(list => setFollowingCount(list.length))
      .catch(() => {});
  }, [currentUserId]);

  const plantedCount = inspirations.length;
  const harvestedCount = inspirations.reduce((sum, i) => sum + (i.stats.collections || 0), 0);

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md px-4 py-4 flex items-center justify-between">
        <div className="w-10"></div>
        <h1 className="text-lg font-bold">我的</h1>
        <button
          onClick={() => onNavigate('settings')}
          className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
        >
          <Settings size={24} />
        </button>
      </header>

      <main className="space-y-6">
        <section className="px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full bg-primary/20 overflow-hidden border-2 border-primary/30">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold tracking-tight">你好，{user.name}！</h2>
              {user.bio && <p className="text-slate-400 text-sm mt-1">{user.bio}</p>}
            </div>
          </div>
        </section>

        <section className="px-4">
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate('my-inspirations')}
              className="flex-1 bg-white p-4 rounded-2xl border border-primary/10 flex flex-col items-center justify-center shadow-sm min-h-[80px] hover:bg-primary/5 transition-colors"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin text-primary/30" /> : (
                <span className="text-2xl font-bold text-slate-900">{plantedCount}</span>
              )}
              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">播种</span>
            </button>
            <button
              onClick={() => onNavigate('collections')}
              className="flex-1 bg-white p-4 rounded-2xl border border-primary/10 flex flex-col items-center justify-center shadow-sm min-h-[80px] hover:bg-primary/5 transition-colors"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin text-primary/30" /> : (
                <span className="text-2xl font-bold text-slate-900">{harvestedCount}</span>
              )}
              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">收获</span>
            </button>
            <button
              onClick={() => onNavigate('following-list')}
              className="flex-1 bg-white p-4 rounded-2xl border border-primary/10 flex flex-col items-center justify-center shadow-sm min-h-[80px] hover:bg-primary/5 transition-colors"
            >
              <span className="text-2xl font-bold text-slate-900">{followingCount}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">关注</span>
            </button>
          </div>
        </section>

        <section className="px-4 space-y-2">
          <button
            onClick={() => onNavigate('collections')}
            className="w-full flex items-center justify-between bg-white px-4 py-4 rounded-2xl border border-primary/5 hover:bg-primary/5 transition-colors group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="size-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bookmark size={20} />
              </div>
              <span className="font-medium">我的收藏</span>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" size={20} />
          </button>
          <button
            onClick={() => onNavigate('drafts')}
            className="w-full flex items-center justify-between bg-white px-4 py-4 rounded-2xl border border-primary/5 hover:bg-primary/5 transition-colors group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="size-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText size={20} />
              </div>
              <span className="font-medium">草稿箱</span>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" size={20} />
          </button>
        </section>

        <section className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold px-1">我的灵感</h3>
            <button onClick={() => onNavigate('my-inspirations')} className="text-xs text-primary font-medium hover:underline">
              查看全部
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-primary/30" size={24} />
            </div>
          ) : inspirations.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm">还没有播种过灵感哦</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {inspirations.slice(0, 4).map((item) => {
                const isPrivate = item.visibility === 'private';
                return (
                  <div key={item.id} className="group cursor-pointer" onClick={() => onSelectInspiration(item)}>
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden relative mb-2 shadow-md bg-slate-100">
                      {isPrivate ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 gap-2">
                          <Lock size={28} className="text-slate-400" />
                          <span className="text-xs text-slate-400">私密灵感</span>
                        </div>
                      ) : item.image ? (
                        <>
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </>
                      ) : (
                        // 纯文字灵感：渐变底色 + 关键词
                        (() => {
                          const g = profileGradient(item.id);
                          const phrase = profileKeyPhrase(item.description || item.title || '');
                          return (
                            <div className="w-full h-full flex flex-col items-center justify-center px-3 py-4"
                              style={{ background: `linear-gradient(145deg, ${g.from} 0%, ${g.to} 100%)` }}>
                              <span className="text-3xl font-serif opacity-25 leading-none mb-1 select-none" style={{ color: g.text }}>"</span>
                              <p className="text-center font-bold leading-snug"
                                style={{ color: g.text, fontSize: phrase.length <= 8 ? '14px' : phrase.length <= 12 ? '12px' : '11px' }}>
                                {phrase}
                              </p>
                            </div>
                          );
                        })()
                      )}
                    </div>
                    <p className="font-semibold text-sm line-clamp-1 px-1 text-slate-400">
                      {isPrivate ? '私密灵感' : item.title}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
