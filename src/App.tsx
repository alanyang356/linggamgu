import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Navigation from './components/Navigation';
import HomeScreen from './screens/Home';
import SquareScreen from './screens/Square';
import CreateScreen from './screens/Create';
import ProfileScreen from './screens/Profile';
import DetailScreen from './screens/Detail';
import NotificationsScreen from './screens/Notifications';
import SettingsScreen from './screens/Settings';
import CollectionsScreen from './screens/Collections';
import DraftsScreen from './screens/Drafts';
import MyInspirations from './screens/MyInspirations';
import FollowingList from './screens/FollowingList';
import UserProfile from './screens/UserProfile';
import ChatScreen from './screens/Chat';
import MessagesScreen from './screens/Messages';
import MatureList from './screens/MatureList';
import AuthScreen from './screens/Auth';
import { Screen, Inspiration, User, Draft } from './types';
import { getDrafts, saveDraft, deleteDraft, getUnreadNotificationsCount, getInspiration, getFollowingList } from './lib/api';
import { Loader2 } from 'lucide-react';

// 游客预览组件：未登录用户通过分享链接直达灵感详情
function GuestInspirationView({ inspirationId }: { inspirationId: string }) {
  const [inspiration, setInspiration] = React.useState<Inspiration | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getInspiration(inspirationId)
      .then(setInspiration)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inspirationId]);

  const handleGoLogin = () => {
    // 清除URL参数，跳转到登录页
    window.history.replaceState({}, '', window.location.pathname);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!inspiration) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light gap-4 px-6">
        <p className="text-slate-400 text-center">灵感不存在或已被删除</p>
        <button onClick={handleGoLogin}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold">
          进入灵感菇
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 z-20 px-4 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md">
        <div className="text-lg font-bold text-primary">灵感菇</div>
        <button onClick={handleGoLogin}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-full">
          登录 / 注册
        </button>
      </header>

      <div className="pt-20 px-4 space-y-6">
        {/* 封面图 */}
        <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-xl">
          <img src={inspiration.image} alt={inspiration.title}
            className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        </div>

        {/* 标题和数字 */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">{inspiration.title}</h1>
          <div className="flex items-center gap-2 text-primary">
            <span className="text-sm font-bold">💧 {inspiration.stats.likes} 次浇水</span>
          </div>
        </div>

        {/* 作者 */}
        <div className="flex items-center gap-3 py-3 border-t border-b border-slate-100">
          <img src={inspiration.author.avatar} alt={inspiration.author.name}
            className="size-10 rounded-full bg-slate-100" referrerPolicy="no-referrer" />
          <div>
            <p className="font-bold text-slate-900">{inspiration.author.name}</p>
            <p className="text-xs text-slate-400">灵感播种人</p>
          </div>
        </div>

        {/* 标签 */}
        <div className="flex flex-wrap gap-2">
          {inspiration.tags.map(tag => (
            <span key={tag} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {/* 内容 */}
        {inspiration.description && (
          <p className="text-slate-600 leading-relaxed text-base">{inspiration.description}</p>
        )}
      </div>

      {/* 底部引导注册 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100">
        <button onClick={handleGoLogin}
          className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 text-base">
          加入灵感菇，参与互动 🌱
        </button>
      </div>
    </div>
  );
}

function AppInner() {
  const { currentUser, supabaseUser, isLoading, refreshProfile } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedInspiration, setSelectedInspiration] = useState<Inspiration | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [prevScreen, setPrevScreen] = useState<Screen>('square'); // 记录进入UserProfile前的来源页
  const [unreadUsers, setUnreadUsers] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [editingInspiration, setEditingInspiration] = useState<Inspiration | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [squareRefreshKey, setSquareRefreshKey] = useState(0); // 发布后递增，触发广场刷新

  const handleDeleteInspiration = (_inspirationId: string) => {
    setCurrentScreen('my-inspirations'); // 删除后跳回我的灵感列表
    setSquareRefreshKey(k => k + 1); // 同时刷新广场
  };

  // 启动时加载已关注用户列表
  useEffect(() => {
    if (supabaseUser) {
      getFollowingList(supabaseUser.id)
        .then(users => setFollowedUsers(new Set(users.map(u => u.id))))
        .catch(() => {});
    }
  }, [supabaseUser]);

  // 启动时检测URL中的inspiration参数，支持分享链接直达
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inspirationId = params.get('inspiration');
    if (inspirationId && supabaseUser) {
      getInspiration(inspirationId).then(insp => {
        if (insp) {
          setSelectedInspiration(insp);
          setCurrentScreen('detail');
          // 清除URL参数，保持URL干净
          window.history.replaceState({}, '', window.location.pathname);
        }
      }).catch(() => {});
    }
  }, [supabaseUser]);

  // Load drafts from Supabase
  useEffect(() => {
    if (supabaseUser) {
      getDrafts(supabaseUser.id).then(setDrafts).catch(console.error);
    }
  }, [supabaseUser]);

  // Poll unread notifications
  useEffect(() => {
    if (!supabaseUser) return;
    const poll = async () => {
      const count = await getUnreadNotificationsCount(supabaseUser.id);
      setUnreadNotifCount(count);
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [supabaseUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!supabaseUser) {
    // 检查是否是分享链接直达：有inspiration参数则先展示游客预览
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('inspiration');
    if (sharedId) {
      return <GuestInspirationView inspirationId={sharedId} />;
    }
    return <AuthScreen onSuccess={() => {}} />;
  }

  // currentUser 可能还在加载中，用一个空壳 fallback 让 app 继续渲染
  const safeUser = currentUser ?? {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '灵感播种人',
    avatar: supabaseUser.user_metadata?.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
    stats: { planted: 0, harvested: 0, following: 0 },
  };

  // 跳转到广场并自动刷新
  const goToSquare = () => {
    setSquareRefreshKey(k => k + 1);
    setCurrentScreen('square');
  };

  const handleNavigate = (screen: Screen) => {
    if (screen === 'square') {
      setSquareRefreshKey(k => k + 1);
    }
    setCurrentScreen(screen);
    setSelectedInspiration(null);
    setSelectedUser(null);
  };

  const handleSelectInspiration = (inspiration: Inspiration) => {
    setSelectedInspiration(inspiration);
    setCurrentScreen('detail');
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPrevScreen(currentScreen); // 记录来源页
    setCurrentScreen('user-profile');
  };

  const handleSaveDraft = async (draft: Draft) => {
    try {
      const saved = await saveDraft(supabaseUser.id, draft);
      setDrafts(prev => {
        const idx = prev.findIndex(d => d.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      setEditingDraft(null);
      setCurrentScreen('drafts');
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      await deleteDraft(id, supabaseUser.id);
      setDrafts(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onPlant={() => setCurrentScreen('create')}
            onMatureClick={() => setCurrentScreen('mature-list')}
            onSquareClick={goToSquare}
          />
        );
      case 'mature-list':
        return (
          <MatureList
            onBack={() => setCurrentScreen('home')}
            onSelect={handleSelectInspiration}
            onUserClick={handleSelectUser}
            currentUser={safeUser}
          />
        );
      case 'square':
        return (
          <SquareScreen
            key={squareRefreshKey}
            onSelect={handleSelectInspiration}
            onUserClick={handleSelectUser}
            currentUser={safeUser}
            onMyInspirationsClick={() => setCurrentScreen('my-inspirations')}
          />
        );
      case 'create':
        return (
          <CreateScreen
            onClose={() => {
              setCurrentScreen(editingInspiration ? 'detail' : 'square');
              setEditingDraft(null);
              setEditingInspiration(null);
            }}
            onPublishSuccess={() => {
              setSquareRefreshKey(k => k + 1);
              refreshProfile();
              if (editingInspiration) goToSquare();
              setEditingInspiration(null);
            }}
            initialDraft={editingDraft}
            editingInspiration={editingInspiration}
            onSaveDraft={handleSaveDraft}
            currentUser={safeUser}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            onMessagesClick={() => setCurrentScreen('messages')}
            currentUserId={supabaseUser.id}
            onRead={() => setUnreadNotifCount(0)}
            onInspirationClick={(id) => {
              getInspiration(id).then(insp => {
                if (insp) {
                  setSelectedInspiration(insp);
                  setCurrentScreen('detail');
                }
              }).catch(() => {});
            }}
          />
        );
      case 'messages':
        return (
          <MessagesScreen
            onChatClick={(user) => {
              setSelectedUser(user);
              setCurrentScreen('chat');
              setUnreadUsers(prev => {
                const next = new Set(prev);
                next.delete(user.id);
                return next;
              });
            }}
            onNotificationsClick={() => setCurrentScreen('notifications')}
            unreadUsers={unreadUsers}
            currentUserId={supabaseUser.id}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            user={safeUser}
            onNavigate={handleNavigate}
            onSelectInspiration={handleSelectInspiration}
            currentUserId={supabaseUser.id}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            user={safeUser}
            onBack={() => setCurrentScreen('profile')}
            onSave={async (updates) => {
              await refreshProfile();
            }}
            currentUserId={supabaseUser.id}
          />
        );
      case 'collections':
        return (
          <CollectionsScreen
            onBack={() => setCurrentScreen('profile')}
            onInspirationClick={handleSelectInspiration}
            currentUserId={supabaseUser.id}
          />
        );
      case 'drafts':
        return (
          <DraftsScreen
            onBack={() => setCurrentScreen('profile')}
            drafts={drafts}
            onDelete={handleDeleteDraft}
            onEdit={(draft) => {
              setEditingDraft(draft);
              setCurrentScreen('create');
            }}
          />
        );
      case 'my-inspirations':
        return (
          <MyInspirations
            onBack={() => setCurrentScreen('profile')}
            onInspirationClick={handleSelectInspiration}
            currentUserId={supabaseUser.id}
          />
        );
      case 'following-list':
        return (
          <FollowingList
            onBack={() => setCurrentScreen('profile')}
            onUserClick={handleSelectUser}
            followedUserIds={followedUsers}
            currentUserId={supabaseUser.id}
          />
        );
      case 'user-profile':
        return selectedUser ? (
          <UserProfile
            user={selectedUser}
            onBack={() => setCurrentScreen(prevScreen)}
            onInspirationClick={handleSelectInspiration}
            onChatClick={(chatUser?: any) => {
              if (chatUser) setSelectedUser(chatUser);
              setCurrentScreen('chat');
            }}
            isFollowing={followedUsers.has(selectedUser.id)}
            onFollowChange={(isNowFollowing, targetId) => {
              // 优先用回调传回来的真实UUID，fallback到selectedUser.id
              const realTargetId = targetId || selectedUser.id;
              setFollowedUsers(prev => {
                const next = new Set(prev);
                if (isNowFollowing) next.add(realTargetId);
                else next.delete(realTargetId);
                return next;
              });
              refreshProfile(); // 刷新自己的关注数字
            }}
            currentUserId={supabaseUser.id}
          />
        ) : null;
      case 'chat':
        return selectedUser ? (
          <ChatScreen
            user={selectedUser}
            currentUser={safeUser}
            onBack={() => setCurrentScreen('messages')}
            onNewMessage={(userId) => {
              if (currentScreen !== 'chat') {
                setUnreadUsers(prev => new Set(prev).add(userId));
              }
            }}
          />
        ) : null;
      case 'detail':
        return selectedInspiration ? (
          <DetailScreen
            inspiration={selectedInspiration}
            onBack={goToSquare}
            onNavigate={handleNavigate}
            onUserClick={handleSelectUser}
            onEdit={(insp) => {
              setEditingInspiration(insp);
              setCurrentScreen('create');
            }}
            currentUser={safeUser}
            currentUserId={supabaseUser.id}
            onDelete={handleDeleteInspiration}
          />
        ) : null;
      default:
        return (
          <HomeScreen
            onPlant={() => setCurrentScreen('create')}
            onMatureClick={() => setCurrentScreen('mature-list')}
            onSquareClick={goToSquare}
          />
        );
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background-light relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen + (selectedInspiration?.id || '')}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {currentScreen !== 'chat' && (
        <Navigation
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          unreadMessagesCount={unreadUsers.size}
          unreadNotifCount={unreadNotifCount}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
