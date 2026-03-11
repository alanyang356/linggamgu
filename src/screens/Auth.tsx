import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sprout, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn, signUp } from '../lib/api';

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccessMsg('');
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    if (mode === 'signup' && !name) {
      setError('请填写昵称');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        onSuccess();
      } else {
        await signUp(email, password, name);
        setSuccessMsg('注册成功！请检查邮箱确认链接，然后登录。');
        setMode('login');
      }
    } catch (err: any) {
      const msg = err.message || '操作失败';
      if (msg.includes('Invalid login credentials')) {
        setError('邮箱或密码错误');
      } else if (msg.includes('User already registered')) {
        setError('该邮箱已注册，请直接登录');
      } else if (msg.includes('Email not confirmed')) {
        setError('请先确认邮箱后再登录');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-200 mb-4">
            <Sprout size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">灵感菇</h1>
          <p className="text-sm text-gray-500 mt-1">种下灵感，收获创意</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 p-6 border border-gray-50">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="昵称"
                  className="w-full h-12 pl-11 pr-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none text-sm transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱"
                className="w-full h-12 pl-11 pr-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none text-sm transition-all"
              />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="密码（至少6位）"
                className="w-full h-12 pl-11 pr-11 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none text-sm transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="text-sm text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2">
                {successMsg}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                mode === 'login' ? '进入灵感世界' : '开始种植灵感'
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          使用即表示同意用户协议和隐私政策
        </p>
      </motion.div>
    </div>
  );
}
