import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Draft } from '../types';

interface DraftsScreenProps {
  onBack: () => void;
  drafts: Draft[];
  onDelete: (id: string) => void;
  onEdit: (draft: Draft) => void;
}

export default function DraftsScreen({ onBack, drafts, onDelete, onEdit }: DraftsScreenProps) {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    onDelete(id);
    setShowConfirm(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">草稿箱</h1>
        <div className="w-10"></div>
      </header>

      <main className="p-4 space-y-4">
        {drafts.length > 0 ? drafts.map((draft) => (
          <div key={draft.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4">
            <div className="size-20 rounded-xl overflow-hidden flex-shrink-0">
              <img src={draft.image} alt="Draft" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 truncate">{draft.title}</h3>
                <p className="text-slate-500 text-xs line-clamp-1 mt-1">{draft.content}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-400">{draft.time}</span>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowConfirm(draft.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => onEdit && onEdit(draft)}
                    className="text-primary hover:text-primary-dark transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p>草稿箱空空如也</p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">确定要删除吗？</h3>
                <p className="text-slate-500 text-sm">删除后草稿将无法找回，请谨慎操作。</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 h-12 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => handleDelete(showConfirm)}
                  className="flex-1 h-12 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  确定删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
