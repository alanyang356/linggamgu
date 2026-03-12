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
import { getDrafts, saveDraft, deleteDraft, getUnreadNotificationsCount } from './lib/api';
import { Loader2 } from 'lucide-react';

function AppInner() {
  const { currentUser, supabaseUser, isLoading, refreshProfile } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedInspiration, setSelectedInspiration] = useState<Inspiration | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [unreadUsers, setUnreadUsers] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [squareRefreshKey, setSquareRefreshKey] = useState(0); // 发布后递增，触发广场刷新

  // Load drafts from Supabase
  useEffect(() => {
    if (supabaseUser) {
      getDrafts(supabaseUser.id).then(setDrafts).catch(console.error);
    }
  }, [supabaseUser]);

  // Poll unread notifications
  const pollNotifCount = React.useCallback(async () => {
    if (!supabaseUser) return;
    const count = await getUnreadNotificationsCount(supabaseUser.id);
    setUnreadNotifCount(count);
  }, [supabaseUser]);

  useEffect(() => {
    if (!supabaseUser) return;
    pollNotifCount();
    const interval = setInterval(pollNotifCount, 15000);
    return () => clearInterval(interval);
  }, [supabaseUser, pollNotifCount]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!supabaseUser) {
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

  const handleNavigate = (screen: Screen) => {
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
              setCurrentScreen('square');
              setEditingDraft(null);
            }}
            onPublishSuccess={() => {
              setSquareRefreshKey(k => k + 1); // 广场列表刷新
              refreshProfile(); // 播种数更新
            }}
            initialDraft={editingDraft}
            onSaveDraft={handleSaveDraft}
            currentUser={safeUser}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            onMessagesClick={() => setCurrentScreen('messages')}
            currentUserId={supabaseUser.id}
            onRead={() => setTimeout(pollNotifCount, 1000)}
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
            onBack={() => setCurrentScreen('following-list')}
            onInspirationClick={handleSelectInspiration}
            onChatClick={() => setCurrentScreen('chat')}
            isFollowing={followedUsers.has(selectedUser.id)}
            onFollowChange={(isFollowing) => {
              setFollowedUsers(prev => {
                const next = new Set(prev);
                if (isFollowing) next.add(selectedUser.id);
                else next.delete(selectedUser.id);
                return next;
              });
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
            onBack={() => setCurrentScreen('square')}
            onNavigate={handleNavigate}
            onUserClick={handleSelectUser}
            currentUser={safeUser}
            currentUserId={supabaseUser.id}
          />
        ) : null;
      default:
        return (
          <HomeScreen
            onPlant={() => setCurrentScreen('create')}
            onMatureClick={() => setCurrentScreen('mature-list')}
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
