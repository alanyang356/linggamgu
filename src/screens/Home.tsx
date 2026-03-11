import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Loader2 } from 'lucide-react';
import { getStats } from '../lib/api';

interface HomeScreenProps {
  onPlant: () => void;
  onMatureClick: () => void;
}

const MushroomIcon = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-[80%] h-[60%] bg-[#d3b58d] rounded-t-full relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-1 bg-white/40 rounded-full"></div>
        </div>
      </div>
      <div className="w-[40%] h-[30%] bg-[#e8dcc4] rounded-b-lg -mt-1"></div>
    </div>
  </div>
);

export default function HomeScreen({ onPlant, onMatureClick }: HomeScreenProps) {
  const [stats, setStats] = useState({ grown: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(data => setStats({ grown: data.mature, total: data.total }))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background-light flex flex-col px-6 pt-6 pb-32 overflow-hidden">
      <header className="flex items-center gap-2 mb-8">
        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center p-1">
          <MushroomIcon className="size-full" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">灵感菇</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-between py-4">
        <div className="text-center space-y-2 px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
            你好，灵感播种人！
          </h2>
          <p className="text-slate-500 text-lg">今天你的灵感将在哪里绽放？</p>
        </div>

        <div className="relative mt-8 mb-12">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <div className="w-64 h-56 bg-gradient-to-b from-[#e8dcc4] to-[#d3b58d] rounded-t-[110px] rounded-b-[60px] relative shadow-2xl shadow-primary/5">
              <div className="absolute top-[15%] left-[18%] size-14 bg-white/20 rounded-full blur-xl"></div>
              <div className="absolute top-[35%] right-[15%] size-20 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-[25%] left-[45%] size-10 bg-white/15 rounded-full blur-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-6xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">✦</span>
                  <span className="absolute right-8 top-6 text-white text-3xl opacity-90">✦</span>
                  <span className="absolute right-12 bottom-8 text-white text-2xl opacity-80">✦</span>
                </div>
              </div>
            </div>
            <div className="w-32 h-24 bg-[#f0e6d2] rounded-b-[50px] absolute -bottom-10 left-1/2 -translate-x-1/2 -z-10 shadow-inner"></div>
          </motion.div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 bg-primary/5 rounded-full blur-3xl -z-20"></div>
        </div>

        <div className="w-full flex flex-col items-center gap-8 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlant}
            className="w-full max-w-[220px] bg-[#d3b58d] text-slate-900 h-14 rounded-full font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
          >
            <div className="size-8 bg-slate-900 rounded-full flex items-center justify-center text-white">
              <Plus size={18} strokeWidth={3} />
            </div>
            播种灵感
          </motion.button>

          <div className="grid grid-cols-2 gap-4 w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onMatureClick}
              className="bg-white p-5 rounded-[2rem] border border-primary/5 shadow-sm flex flex-col items-center justify-center min-h-[100px] cursor-pointer hover:border-primary/20 transition-colors"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-primary/30" />
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-primary"
                >
                  {stats.grown}
                </motion.div>
              )}
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">已成熟</div>
            </motion.button>
            <div className="bg-white p-5 rounded-[2rem] border border-primary/5 shadow-sm flex flex-col items-center justify-center min-h-[100px]">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">已播种</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
