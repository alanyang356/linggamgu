import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Lock } from 'lucide-react';
import { Inspiration } from '../types';
import { getMyInspirations } from '../lib/api';

interface MyInspirationsProps {
  onBack: () => void;
  onInspirationClick: (inspiration: Inspiration) => void;
  currentUserId: string;
}

export default function MyInspirations({ onBack, onInspirationClick, currentUserId }: MyInspirationsProps) {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    if (!currentUserId) return;
    setIsLoading(true);
    getMyInspirations(currentUserId)
      .then(setInspirations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  const filtered = activeTab === 'all'
    ? inspirations
    : inspirations.filter(i => i.visibility === activeTab);

  return (
    <div className="min-h-screen bg-background-light pb-24">
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md px-4 py-4 flex items-center gap-4 border-b border-primary/10">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold flex-1">我播种的灵感</h1>
        <span className="text-sm text-slate-400">{filtered.length} 篇</span>
      </header>

      {/* Tab 切换 */}
      <div className="flex gap-2 px-4 py-3">
        {(['all', 'public', 'private'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`h-8 px-4 rounded-full text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
            {tab === 'all' ? '全部' : tab === 'public' ? '公开' : '私密'}
          </button>
        ))}
      </div>

      <main className="px-4 py-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-slate-400">加载中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-slate-400 text-sm">
              {activeTab === 'private' ? '还没有私密灵感' : activeTab === 'public' ? '还没有公开灵感' : '还没有播种过灵感哦'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((item) => {
              const isPrivate = item.visibility === 'private';
              return (
                <div key={item.id} className="group cursor-pointer" onClick={() => onInspirationClick(item)}>
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden relative mb-2 shadow-md bg-slate-100">
                    {isPrivate ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 gap-2">
                        <Lock size={28} className="text-slate-400" />
                        <span className="text-xs text-slate-400">私密灵感</span>
                      </div>
                    ) : item.image ? (
                      <img src={item.image} alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <span className="text-4xl">🌱</span>
                      </div>
                    )}
                    {!isPrivate && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />}
                  </div>
                  <p className="font-semibold text-sm line-clamp-1 px-1 text-slate-400">
                    {isPrivate ? '私密灵感' : item.title}
                  </p>
                  {!isPrivate && (
                    <div className="flex items-center gap-2 px-1 mt-1">
                      <span className="text-[10px] text-slate-400">💧{item.stats.likes} · 🌾{item.stats.collections}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
