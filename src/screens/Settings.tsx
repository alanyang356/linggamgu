import React, { useState } from 'react';
import { ArrowLeft, Camera, ChevronRight, LogOut, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { updateProfile, signOut, compressImage } from '../lib/api';

interface SettingsScreenProps {
  user: User;
  onBack: () => void;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
  currentUserId: string;
}

export default function SettingsScreen({ user, onBack, onSave, currentUserId }: SettingsScreenProps) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      // 头像压缩到 400px，质量 80%
      const compressed = await compressImage(reader.result as string, 400, 0.8);
      setAvatar(compressed);
      setIsUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile(currentUserId, { name: name.trim(), avatar, bio });
      await onSave({ name: name.trim(), avatar, bio });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onBack();
      }, 1200);
    } catch (err) {
      console.error('Save failed:', err);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">个人信息设置</h1>
        <button
          onClick={handleSave}
          disabled={isSaving || saved}
          className={`h-9 px-4 rounded-full font-bold text-sm flex items-center gap-1.5 transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white active:scale-95 disabled:opacity-60'
          }`}
        >
          {isSaving
            ? <><Loader2 size={14} className="animate-spin" />保存中</>
            : saved
              ? <><Check size={14} />已保存</>
              : '保存'
          }
        </button>
      </header>

      <main className="p-4 space-y-6">
        {/* 头像区域 */}
        <section className="flex flex-col items-center py-8 bg-white rounded-3xl shadow-sm border border-slate-100">
          <div className="relative">
            <div className="size-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100">
              {isUploadingAvatar ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
              )}
            </div>
            <button
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm active:scale-95 transition-transform"
            >
              <Camera size={14} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
          <p className="mt-4 text-slate-400 text-xs">点击更换头像</p>
        </section>

        {/* 信息编辑 */}
        <section className="space-y-2">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-4 border-b border-slate-50 flex items-center justify-between">
              <span className="text-slate-500 text-sm flex-shrink-0 mr-4">用户名</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-right font-medium outline-none text-slate-900 flex-1 bg-transparent"
                placeholder="输入用户名"
              />
            </div>
            <div className="px-4 py-4 border-b border-slate-50 flex items-center justify-between">
              <span className="text-slate-500 text-sm flex-shrink-0 mr-4">账号 ID</span>
              <span className="text-slate-300 font-mono text-xs truncate max-w-[180px]">{currentUserId}</span>
            </div>
            <div className="px-4 py-4 flex flex-col gap-2">
              <span className="text-slate-500 text-sm">个人简介</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="介绍一下你自己..."
                className="w-full h-24 bg-slate-50 rounded-xl p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </section>

        {/* 其他设置 */}
        <section className="space-y-2">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <button className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <span className="text-slate-900 font-medium">账号与安全</span>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
            <button className="w-full px-4 py-4 flex items-center justify-between border-t border-slate-50 hover:bg-slate-50 transition-colors">
              <span className="text-slate-900 font-medium">隐私设置</span>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>
        </section>

        <button
          onClick={handleSignOut}
          className="w-full h-14 bg-white text-red-500 font-bold rounded-2xl border border-red-50 flex items-center justify-center gap-2 shadow-sm hover:bg-red-50 transition-colors active:scale-95"
        >
          <LogOut size={20} />
          退出登录
        </button>
      </main>

      {/* 保存成功 toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-bold shadow-xl flex items-center gap-2"
          >
            <Check size={16} className="text-green-400" />
            个人信息已保存
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
