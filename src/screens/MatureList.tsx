import React, { useEffect, useState } from 'react';
import { ChevronLeft, Loader2, Trophy } from 'lucide-react';
import InspirationCard from '../components/InspirationCard';
import { Inspiration, User } from '../types';
import { getMatureInspirations } from '../lib/api';

interface MatureListProps {
  onBack: () => void;
  onSelect: (inspiration: Inspiration) => void;
  onUserClick?: (user: any) => void;
  currentUser?: User;
}

export default function MatureList({ onBack, onSelect, onUserClick, currentUser }: MatureListProps) {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMatureInspirations()
      .then(setInspirations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="pb-24 min-h-screen bg-background-light">
      <header className="sticky top-0 z-20 bg-background-light/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-primary/10">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-slate-400 hover:text-primary transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2 mr-8">
          <Trophy className="text-amber-500" size={20} />
          <h1 className="text-lg font-bold">已成熟灵感</h1>
        </div>
      </header>

      <div className="p-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Trophy className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="text-amber-900 font-bold text-sm">灵感成熟殿堂</h3>
            <p className="text-amber-700 text-xs mt-1">这里汇集了被浇灌超过50次的优质灵感，它们已经茁壮成长，散发着智慧的光芒。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm">正在寻找成熟的灵感...</p>
            </div>
          ) : inspirations.length > 0 ? (
            inspirations.map((item) => (
              <InspirationCard 
                key={item.id} 
                inspiration={item} 
                onClick={() => onSelect(item)} 
                onUserClick={onUserClick}
                currentUser={currentUser}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 text-center">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <Trophy size={32} />
              </div>
              <p className="text-sm">暂时还没有灵感达到成熟状态<br/>快去给喜欢的灵感浇浇水吧！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
