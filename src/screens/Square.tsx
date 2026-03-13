import React, { useEffect, useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import InspirationCard from '../components/InspirationCard';
import { Inspiration, User } from '../types';
import { getInspirations } from '../lib/api';

interface SquareScreenProps {
  onSelect: (inspiration: Inspiration) => void;
  onUserClick?: (user: any) => void;
  currentUser?: User;
  onMyInspirationsClick?: () => void;
  likeUpdates?: Record<string, { count: number; isLiked: boolean }>;
}

const PAGE_SIZE = 12;

export default function SquareScreen({ onSelect, onUserClick, currentUser, onMyInspirationsClick, likeUpdates }: SquareScreenProps) {
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const handleLikeChange = (inspirationId: string, newLikeCount: number, _isLiked?: boolean) => {
    setInspirations(prev => prev.map(item =>
      item.id === inspirationId
        ? { ...item, stats: { ...item.stats, likes: newLikeCount } }
        : item
    ));
  };
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const categories = ['全部', '#旅行', '#学习', '#工作', '#创作', '#美食', '#生活'];

  const loadInspirations = useCallback(async (tab: 'public' | 'private', pageNum: number, reset = false) => {
    if (pageNum === 0) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const data = await getInspirations(tab, pageNum, PAGE_SIZE);
      setInspirations(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    setInspirations([]);
    setHasMore(true);
    loadInspirations(activeTab, 0, true);
  }, [activeTab]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadInspirations(activeTab, nextPage);
  };

  const filteredInspirations = inspirations.filter(item => {
    const matchesCategory = selectedCategory === '全部' || item.tags.includes(selectedCategory);
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 bg-background-light/80 backdrop-blur-md px-4 py-4 flex items-center justify-center border-b border-primary/10">
        <div className="flex items-center gap-6">
          <button onClick={() => setActiveTab('public')} className={`text-lg font-bold transition-colors ${activeTab === 'public' ? 'text-slate-900' : 'text-slate-400'}`}>公开灵感</button>
          <button onClick={() => setActiveTab('private')} className={`text-lg font-bold transition-colors ${activeTab === 'private' ? 'text-slate-900' : 'text-slate-400'}`}>私密灵感</button>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
          <input type="text" placeholder="搜索灵感瞬间..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl border border-primary/10 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
        </div>
      </div>

      <div className="flex gap-3 px-4 pb-4 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`h-10 shrink-0 px-6 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 p-4">
        {activeTab === 'private' ? (
          // 私密标签页：引导用户去「我的已播种」，不展示内容
          <div className="flex flex-col items-center justify-center py-20 gap-6 px-6 text-center">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-4xl">🔒</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">私密灵感仅你可见</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                你的私密灵感只展示在个人主页的「已播种」中，不会出现在公开广场
              </p>
            </div>
            <button
              onClick={onMyInspirationsClick}
              className="h-12 px-8 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              查看我的已播种灵感
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm">正在加载灵感...</p>
          </div>
        ) : filteredInspirations.length > 0 ? (
          <>
            {filteredInspirations.map((item) => (
              <InspirationCard
                key={item.id}
                inspiration={likeUpdates?.[item.id]
                  ? { ...item, stats: { ...item.stats, likes: likeUpdates[item.id].count } }
                  : item}
                onClick={() => onSelect(item)}
                onUserClick={onUserClick}
                currentUser={currentUser}
                onLikeChange={handleLikeChange}
              />
            ))}
            {!searchQuery && selectedCategory === '全部' && hasMore && (
              <button onClick={handleLoadMore} disabled={isLoadingMore}
                className="w-full py-4 text-sm text-primary font-medium flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50">
                {isLoadingMore ? <><Loader2 size={16} className="animate-spin" /> 加载中...</> : '加载更多'}
              </button>
            )}
            {!hasMore && inspirations.length > PAGE_SIZE && (
              <p className="text-center text-xs text-slate-300 py-2">已经到底了 🍄</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <p className="text-sm">{searchQuery || selectedCategory !== '全部' ? '没有找到符合条件的灵感' : '暂无灵感，快去发布第一个吧！'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
