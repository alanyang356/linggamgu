import React, { useEffect, useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { User } from '../types';
import { getFollowingList } from '../lib/api';

interface FollowingListProps {
  onBack: () => void;
  onUserClick: (user: User) => void;
  followedUserIds: Set<string>;
  currentUserId: string;
}

export default function FollowingList({ onBack, onUserClick, followedUserIds, currentUserId }: FollowingListProps) {
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getFollowingList(currentUserId)
      .then(setFollowedUsers)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  return (
    <div className="min-h-screen bg-background-light pb-24">
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md px-4 py-4 flex items-center gap-4">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">我的关注</h1>
      </header>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary/30" size={32} />
          </div>
        ) : followedUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p>还没有关注任何人</p>
            <p className="text-sm mt-1">去广场发现有趣的灵感种植者吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {followedUsers.map(user => (
              <button
                key={user.id}
                onClick={() => onUserClick(user)}
                className="w-full flex items-center gap-4 bg-white p-4 rounded-2xl border border-primary/5 shadow-sm hover:bg-primary/5 transition-colors"
              >
                <div className="size-12 rounded-full overflow-hidden bg-primary/20">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold">{user.name}</div>
                  {user.bio && <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{user.bio}</div>}
                </div>
                <div className="text-xs text-slate-400">{user.stats.planted} 播种</div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
