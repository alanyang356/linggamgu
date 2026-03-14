import React, { useState, useRef, useEffect } from 'react';
import { X, MousePointer2, Plus, MapPin, Eye, Send, Trash2, Check, Navigation, Search, Globe, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Draft, User, Inspiration } from '../types';
import { createInspiration, updateInspiration, compressImage } from '../lib/api';

interface CreateScreenProps {
  currentUser?: User;
  onClose: () => void;
  initialDraft?: Draft | null;
  editingInspiration?: Inspiration | null;
  onSaveDraft?: (draft: Draft) => void;
  onPublishSuccess?: () => void;
}

const GLOBAL_CITIES = [
  '北京', '上海', '广州', '深圳', '东京', '纽约', '伦敦', '巴黎', '柏林', '悉尼', '新加坡', '首尔'
];

export default function CreateScreen({ onClose, initialDraft, editingInspiration, onSaveDraft, currentUser, onPublishSuccess }: CreateScreenProps) {
  const isEditing = !!editingInspiration;
  const [text, setText] = useState(
    editingInspiration?.content || editingInspiration?.description || initialDraft?.content || ''
  );
  const [images, setImages] = useState<string[]>(
    editingInspiration?.image ? [editingInspiration.image] :
    initialDraft?.image ? [initialDraft.image] : []
  );
  const [tags, setTags] = useState(['#旅行', '#学习', '#工作', '#创作', '#美食', '#生活']);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    editingInspiration?.tags || initialDraft?.tags || ['#生活']
  );
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(initialDraft?.location || null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    editingInspiration ? (editingInspiration as any).visibility || 'public' : initialDraft?.visibility || 'public'
  );
  const [isPickingVisibility, setIsPickingVisibility] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // 发布成功后：等1.5秒动画完成，再触发回调跳转
  React.useEffect(() => {
    if (publishSuccess) {
      const timer = setTimeout(() => {
        onPublishSuccess?.();
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [publishSuccess]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = () => {
    if (initialDraft) {
      return text !== initialDraft.content || 
             images[0] !== initialDraft.image || 
             JSON.stringify(selectedTags) !== JSON.stringify(initialDraft.tags) ||
             selectedLocation !== initialDraft.location ||
             visibility !== initialDraft.visibility;
    }
    return text.trim() !== '' || images.length > 0;
  };

  const handleClose = () => {
    if (hasChanges()) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const handleSaveDraft = async () => {
    if (!text.trim() && images.length === 0) {
      onClose();
      return;
    }
    if (onSaveDraft) {
      setIsSavingDraft(true);
      const draft: Draft = {
        id: initialDraft?.id || Date.now().toString(),
        title: text.slice(0, 20) || '未命名的灵感',
        content: text,
        image: images[0] || '',
        tags: selectedTags,
        location: selectedLocation || undefined,
        visibility: visibility,
        time: new Date().toLocaleString()
      };
      try {
        await onSaveDraft(draft);
        setDraftSaved(true);
        setTimeout(() => {
          setDraftSaved(false);
          onClose(); // 保存成功后退出
        }, 800);
      } finally {
        setIsSavingDraft(false);
      }
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            // 上传前自动压缩，限制宽度1200px、质量75%
            const compressed = await compressImage(event.target.result as string);
            setImages((prev) => [...prev, compressed]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddTag = () => {
    const trimmed = newTagValue.trim();
    if (trimmed) {
      const formattedTag = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
      if (!tags.includes(formattedTag)) {
        setTags((prev) => [...prev, formattedTag]);
        setSelectedTags((prev) => [...prev, formattedTag]);
      }
      setNewTagValue('');
      setIsAddingTag(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const ALL_CITIES = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '重庆', '苏州', '天津',
    '南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁',
    '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水',
    '合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州', '池州', '宣城',
    '福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德',
    '南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶',
    '济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '临沂', '德州', '聊城', '滨州', '菏泽',
    '郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店',
    '长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底',
    '南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左',
    '海口', '三亚', '三沙', '儋州',
    '昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧',
    '贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁',
    '成都', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳',
    '西安', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛',
    '兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南',
    '西宁', '海东',
    '银川', '石嘴山', '吴忠', '固原', '中卫',
    '乌鲁木齐', '克拉玛依', '吐鲁番', '哈密',
    '东京', '纽约', '伦敦', '巴黎', '柏林', '悉尼', '新加坡', '首尔', '洛杉矶', '芝加哥', '多伦多', '温哥华'
  ];

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = ALL_CITIES.filter(city => 
        city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isPickingLocation && nearbyPlaces.length === 0 && !isLocating) {
      handleGetCurrentLocation();
    }
  }, [isPickingLocation]);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    setNearbyPlaces([]);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Use Nominatim (OpenStreetMap) for free reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'zh-CN,zh;q=0.9',
                }
              }
            );
            const data = await response.json();
            const addr = data.address;
            
            // 构建更详细的地点列表
            const city = addr.city || addr.town || addr.village || "";
            const district = addr.suburb || addr.city_district || addr.district || "";
            const road = addr.road || "";
            const houseNumber = addr.house_number || "";
            const neighbourhood = addr.neighbourhood || addr.suburb || "";
            
            const places: string[] = [];
            
            // 1. 最详细的建筑/设施名
            if (data.display_name && data.display_name.split(',')[0]) {
              const name = data.display_name.split(',')[0];
              if (name !== road && name !== city && name !== district) {
                places.push(`${district || city} · ${name}`);
              }
            }

            if (addr.amenity) places.push(`${district || city} · ${addr.amenity}`);
            if (addr.building) places.push(`${district || city} · ${addr.building}`);
            
            // 2. 街道/社区名
            if (neighbourhood && district) places.push(`${district} · ${neighbourhood}`);
            if (road) places.push(`${district || city} · ${road}${houseNumber ? houseNumber + '号' : ''}`);
            
            // 3. 区域名
            if (district && city) places.push(`${city} · ${district}`);
            
            // 4. 城市名 (兜底)
            if (places.length === 0) {
              places.push(city || "未知地点");
            }
            
            // 去重
            const uniquePlaces = Array.from(new Set(places));
            setNearbyPlaces(uniquePlaces);
            
            // 默认选中第一个最详细的
            if (!selectedLocation) {
              setSelectedLocation(uniquePlaces[0]);
            }
          } catch (error) {
            console.error("Reverse geocoding error:", error);
            const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setNearbyPlaces([fallback]);
            if (!selectedLocation) setSelectedLocation(fallback);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          // 模拟一些详细地点作为兜底，增强稳定性
          const mockPlaces = ["上海市 · 静安区嘉里中心", "上海市 · 南京西路", "上海市 · 静安寺"];
          setNearbyPlaces(mockPlaces);
          if (!selectedLocation) setSelectedLocation(mockPlaces[0]);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("您的浏览器不支持定位功能。");
      setIsLocating(false);
    }
  };

  const [recentLocations, setRecentLocations] = useState<string[]>(['杭州西湖', '成都太古里', '东京涩谷']);

  useEffect(() => {
    const saved = localStorage.getItem('recent_locations');
    if (saved) {
      setRecentLocations(JSON.parse(saved));
    }
  }, []);

  const addToRecent = (location: string) => {
    const updated = [location, ...recentLocations.filter(l => l !== location)].slice(0, 5);
    setRecentLocations(updated);
    localStorage.setItem('recent_locations', JSON.stringify(updated));
  };

  const handlePublish = async () => {
    if (!text.trim() && images.length === 0) {
      alert('请输入内容或上传图片');
      return;
    }

    setIsPublishing(true);
    try {
      if (selectedLocation) {
        addToRecent(selectedLocation);
      }
      const compressedImage = images[0] ? await compressImage(images[0]) : '';

      if (isEditing && editingInspiration) {
        // 编辑模式：更新已有灵感
        await updateInspiration(editingInspiration.id, {
          title: text.slice(0, 20) + (text.length > 20 ? '...' : ''),
          description: text,
          content: text,
          image: compressedImage || editingInspiration.image,
          tags: selectedTags,
          visibility,
        });
      } else {
        // 新增模式
        await createInspiration({
          title: text.slice(0, 20) + (text.length > 20 ? '...' : ''),
          description: text,
          image: compressedImage,
          tags: selectedTags,
          author: {
            id: currentUser?.id || '',
            name: currentUser?.name || '灵感播种人',
            avatar: currentUser?.avatar || '',
          },
          content: text,
          quote: '',
          visibility: visibility,
        });
      }
      setPublishSuccess(true);
    } catch (error: any) {
      console.error('Publish error:', error);
      const msg = error?.message || '未知错误';
      alert(`${isEditing ? '更新' : '发布'}失败：${msg}\n\n请检查：\n1. 网络连接是否正常\n2. 是否已登录\n3. 打开浏览器控制台查看详细错误`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light relative">
      {/* 发布成功全屏遮罩 */}
      {publishSuccess && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6">
            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-5xl animate-bounce">🌱</span>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">灵感已播种！</h2>
              <p className="text-slate-400 text-sm">正在跳转到灵感广场...</p>
            </div>
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="size-2 rounded-full bg-primary/40 animate-pulse" style={{animationDelay: `${i * 0.15}s`}} />
              ))}
            </div>
          </div>
        </div>
      )}
      <header className="flex items-center justify-between p-4 sticky top-0 bg-background-light/80 backdrop-blur-md z-10">
        <button onClick={handleClose} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
          <X size={24} />
        </button>
        <h1 className="text-lg font-bold">{initialDraft ? '编辑草稿' : '新灵感'}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveDraft}
            className="text-slate-400 font-bold px-2 py-1 hover:text-primary transition-colors"
          >
            草稿
          </button>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-primary text-white font-bold px-4 py-1.5 rounded-full text-sm shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isPublishing ? <Loader2 size={16} className="animate-spin" /> : null}
            {isEditing ? '保存修改' : '发布'}
          </button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8 pb-32">
        <section>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[180px] p-4 bg-transparent border-none focus:ring-0 text-xl font-medium placeholder:text-slate-400 resize-none"
            placeholder="今天有什么灵感？"
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">上传灵感视觉</h2>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button 
              onClick={handleAddPhotoClick}
              className="aspect-square rounded-2xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors group"
            >
              <MousePointer2 className="text-primary group-hover:scale-110 transition-transform" size={32} />
              <span className="text-xs font-semibold text-primary">添加照片</span>
            </button>
            
            <AnimatePresence>
              {images.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="aspect-square rounded-2xl bg-cover bg-center overflow-hidden shadow-sm relative group"
                  style={{ backgroundImage: `url(${img})` }}
                >
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 size-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">分类标签</h2>
            {!isAddingTag ? (
              <button 
                onClick={() => setIsAddingTag(true)}
                className="text-xs font-bold text-primary flex items-center gap-1"
              >
                <Plus size={14} /> 新标签
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="标签名"
                  className="text-xs border-b border-primary bg-transparent outline-none py-0.5 w-20"
                />
                <button onClick={handleAddTag} className="text-primary">
                  <Check size={14} />
                </button>
                <button onClick={() => setIsAddingTag(false)} className="text-slate-400">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedTags.includes(tag) 
                    ? 'bg-primary text-white border-primary shadow-sm' 
                    : 'bg-primary/5 text-primary border-primary/10'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <button 
            onClick={() => setIsPickingLocation(true)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-primary/10 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <MapPin className="text-primary" size={20} />
              <span className={`text-sm font-medium ${selectedLocation ? 'text-slate-900' : 'text-slate-500'}`}>
                {selectedLocation || '添加地点'}
              </span>
            </div>
            <span className="text-slate-400">›</span>
          </button>
          
          <button 
            onClick={() => setIsPickingVisibility(true)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-primary/10 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Eye className="text-primary" size={20} />
              <span className="text-sm font-medium">
                {visibility === 'public' ? '公开灵感' : '私密灵感'}
              </span>
            </div>
            <span className="text-slate-400">›</span>
          </button>
        </section>
      </main>

      {/* Location Picker Modal */}
      <AnimatePresence>
        {isPickingLocation && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-50 bg-background-light flex flex-col"
          >
            <header className="flex items-center justify-between p-4 border-b border-primary/10 bg-white">
              <button onClick={() => setIsPickingLocation(false)} className="size-10 flex items-center justify-center">
                <X size={24} />
              </button>
              <h2 className="text-lg font-bold">选择地点</h2>
              <div className="w-10"></div>
            </header>

            <div className="p-4 space-y-6 overflow-y-auto flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索城市或地点..."
                  className="w-full h-12 pl-12 pr-4 bg-white rounded-xl border border-primary/10 shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {searchQuery.trim() ? (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">搜索结果</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedLocation(searchQuery);
                        setIsPickingLocation(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 shadow-sm text-left"
                    >
                      <Plus size={18} className="text-primary" />
                      <div className="flex-1">
                        <span className="font-bold text-primary">使用自定义地点: </span>
                        <span className="font-medium text-slate-700">{searchQuery}</span>
                      </div>
                    </button>

                    {searchResults.length > 0 ? (
                      searchResults.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedLocation(city);
                            setIsPickingLocation(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-primary/5 shadow-sm text-left"
                        >
                          <MapPin size={18} className="text-primary/60" />
                          <span className="font-medium">{city}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">未找到相关城市，您可以直接使用上方输入的名称</div>
                    )}
                  </div>
                </section>
              ) : (
                <>
                  <section className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">附近地点</h3>
                    <button 
                      onClick={handleGetCurrentLocation}
                      disabled={isLocating}
                      className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-primary/5 shadow-sm active:scale-[0.98] transition-all"
                    >
                      <Navigation className={`text-primary ${isLocating ? 'animate-pulse' : ''}`} size={20} />
                      <span className="font-medium">{isLocating ? '正在精准定位...' : '刷新当前位置'}</span>
                    </button>
                    
                    <div className="space-y-2 mt-2">
                      {isLocating && nearbyPlaces.length === 0 && (
                        <div className="flex flex-col gap-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                          ))}
                        </div>
                      )}
                      {nearbyPlaces.map((place) => (
                        <button
                          key={place}
                          onClick={() => {
                            setSelectedLocation(place);
                            setIsPickingLocation(false);
                          }}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                            selectedLocation === place 
                              ? 'bg-primary/10 border-primary shadow-sm' 
                              : 'bg-white border-primary/5 shadow-sm'
                          }`}
                        >
                          <MapPin size={18} className={selectedLocation === place ? 'text-primary' : 'text-slate-300'} />
                          <div className="flex-1">
                            <span className={`font-medium text-sm ${selectedLocation === place ? 'text-primary' : 'text-slate-700'}`}>
                              {place}
                            </span>
                          </div>
                          {selectedLocation === place && <Check size={16} className="text-primary" />}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">热门城市</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {GLOBAL_CITIES.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedLocation(city);
                            addToRecent(city);
                            setIsPickingLocation(false);
                          }}
                          className="flex items-center justify-center gap-1.5 p-3 bg-slate-100 rounded-xl border border-transparent text-sm font-medium hover:bg-primary/5 transition-colors"
                        >
                          <Globe size={14} className="text-slate-400" />
                          {city}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">最近访问</h3>
                    <div className="space-y-2">
                      {recentLocations.map((place) => (
                        <button
                          key={place}
                          onClick={() => {
                            setSelectedLocation(place);
                            addToRecent(place);
                            setIsPickingLocation(false);
                          }}
                          className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-primary/5 shadow-sm text-left"
                        >
                          <MapPin size={18} className="text-slate-300" />
                          <span className="font-medium text-slate-700">{place}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Visibility Picker Modal */}
      <AnimatePresence>
        {isPickingVisibility && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setIsPickingVisibility(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white rounded-t-[32px] p-6 pb-12 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">权限设置</h2>
                <button onClick={() => setIsPickingVisibility(false)} className="size-10 flex items-center justify-center rounded-full bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setVisibility('public');
                    setIsPickingVisibility(false);
                  }}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                    visibility === 'public' 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-xl flex items-center justify-center ${visibility === 'public' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Globe size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">公开灵感</p>
                      <p className="text-xs text-slate-400">所有人可见，分享你的灵感火花</p>
                    </div>
                  </div>
                  {visibility === 'public' && <Check className="text-primary" size={20} />}
                </button>

                <button 
                  onClick={() => {
                    setVisibility('private');
                    setIsPickingVisibility(false);
                  }}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                    visibility === 'private' 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-xl flex items-center justify-center ${visibility === 'private' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Eye className="text-primary" size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">私密灵感</p>
                      <p className="text-xs text-slate-400">仅自己可见，珍藏你的私人瞬间</p>
                    </div>
                  </div>
                  {visibility === 'private' && <Check className="text-primary" size={20} />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Confirmation Modal */}
      <AnimatePresence>
        {showCloseConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">保存修改吗？</h3>
                <p className="text-slate-500 text-sm">您刚才进行了修改，是否需要保存到草稿箱？</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSaveDraft}
                  className="w-full h-12 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                  保存并退出
                </button>
                <button 
                  onClick={onClose}
                  className="w-full h-12 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  不保存直接退出
                </button>
                <button 
                  onClick={() => setShowCloseConfirm(false)}
                  className="w-full h-12 bg-transparent text-slate-400 font-medium rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  继续编辑
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
