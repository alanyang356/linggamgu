import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import InspirationCard from '../components/InspirationCard';
import { Inspiration } from '../types';
import { getUserCollections } from '../lib/api';

interface CollectionsScreenProps {
  onBack: () => void;
  onInspirationClick: (inspiration: Inspiration) => void;
  currentUserId: string;
}

export default function CollectionsScreen({ onBack, onInspirationClick, currentUserId }: CollectionsScreenProps) {
  const [collections, setCollections] = useState<Inspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserCollections(currentUserId)
      .then(setCollections)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">我的收藏</h1>
        <div className="size-10" />
      </header>

      <main className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary/30" size={32} />
          </div>
        ) : collections.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {collections.map((item) => (
              <InspirationCard key={item.id} inspiration={item} onClick={() => onInspirationClick(item)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p>还没有收藏任何灵感</p>
            <p className="text-sm">去广场看看吧</p>
          </div>
        )}
      </main>
    </div>
  );
}
