import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle, UserPlus, Check, Loader2 } from 'lucide-react';
import { User, Inspiration } from '../types';
import { followUser, createNotification, getUserInspirations, getProfile, isFollowing as checkIsFollowing } from '../lib/api';

interface UserProfileProps {
  user: User;
  onBack: () => void;
  onInspirationClick: (inspiration: Inspiration) => void;
  onChatClick?: (user?: any) => void;
  onFollowChange?: (isFollowing: boolean, targetId?: string) => void;
  isFollowing?: boolean;
  currentUserId: string;
}

export default function UserProfile({ user, onBack, onInspirationClick, onChatClick, onFollowChange, isFollowing: initialFollowing = false, currentUserId }: UserProfileProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [userInspirations, setUserInspirations] = useState<Inspiration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realUser, setRealUser] = useState<User>(user); // 从数据库拉取真实profile

  useEffect(() => {
    setIsLoading(true);
    // 并行拉取：真实profile数据 + 该用户的公开灵感
    Promise.all([
      user.id ? getProfile(user.id) : Promise.resolve(null),
      user.id ? getUserInspirations(user.id) : Promise.resolve([]),
    ]).then(([profile, inspirations]) => {
      if (profile) {
        setRealUser(profile);
        // 用真实UUID重新校验关注状态
        if (profile.id && currentUserId) {
          checkIsFollowing(currentUserId, profile.id)
            .then(result => {
              setIsFollowing(result);
              // 通知App用真实UUID同步followedUsers
              onFollowChange?.(result, profile.id);
            })
            .catch(() => {});
        }
      }
      setUserInspirations(inspirations);
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user.id]);

  const handleFollow = async () => {
    const targetId = realUser.id || user.id; // 优先用从数据库拉取的真实ID
    if (!targetId) return;
    const newFollowingState = !isFollowing;
    try {
      await followUser(currentUserId, targetId);
      if (newFollowingState) {
        await createNotification({
          recipientId: targetId,
          type: 'follow',
          actorId: currentUserId,
          actorName: '',
          actorAvatar: '',
          content: '开始关注你了',
        });
      }
    } catch (error) {
      console.error('Failed to follow:', error);
    }
    setIsFollowing(newFollowingState);
    onFollowChange?.(newFollowingState, realUser.id || user.id);
  };

  return (
    <div className="min-h-screen bg-background-light pb-24">
      <header className="sticky top-0 z-10 bg-background-light/80 backdrop-blur-md px-4 py-4 flex items-center justify-between">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">{realUser.name} 的主页</h1>
        <div className="w-10" />
      </header>

      <main className="space-y-6">
        <section className="px-4 pt-6 flex flex-col items-center gap-4 text-center">
          <div className="size-24 rounded-full bg-primary/20 overflow-hidden border-2 border-primary/30">
            <img src={realUser.avatar} alt={realUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{realUser.name}</h2>
            {realUser.bio && <p className="text-slate-400 text-sm mt-1">{realUser.bio}</p>}
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="font-bold text-lg">{userInspirations.length}</div>
              <div className="text-xs text-slate-400">播种</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{realUser.stats.harvested}</div>
              <div className="text-xs text-slate-400">收获</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{realUser.stats.following}</div>
              <div className="text-xs text-slate-400">关注</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
                isFollowing
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-primary text-white shadow-md shadow-primary/20'
              }`}
            >
              {isFollowing ? <Check size={16} /> : <UserPlus size={16} />}
              {isFollowing ? '已关注' : '关注'}
            </button>
{/* 私信功能暂时关闭，待后续版本上线 */}
          </div>
        </section>

        <section className="px-4">
          <h3 className="font-bold text-lg mb-4">TA 的灵感</h3>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary/30" size={24} />
            </div>
          ) : userInspirations.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">还没有发布灵感</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {userInspirations.map((item) => (
                <div key={item.id} className="group cursor-pointer" onClick={() => onInspirationClick(item)}>
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden relative mb-2 shadow-md">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>
                  <p className="font-semibold text-sm line-clamp-1 px-1">{item.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
