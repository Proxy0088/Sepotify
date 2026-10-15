import React, { useState } from 'react';
import { X, Music2 } from 'lucide-react';
import { Playlist } from '../types/music';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="bg-[#282828] text-white w-full max-w-md rounded-[8px] p-6 shadow-2xl relative border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 text-[#b3b3b3] hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-[6px] bg-[#333333] flex items-center justify-center text-[#1ed760]">
            <Music2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">ساخت لیست پخش جدید</h3>
            <p className="text-xs text-[#b3b3b3]">پلی‌لیست شخصی خود را سفارشی‌سازی کنید</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#b3b3b3] mb-1.5">
              نام لیست پخش *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: آهنگ‌های شبانه، موزیک‌های سفر"
              className="w-full bg-[#3e3e3e] focus:bg-[#4a4a4a] text-white text-sm rounded-[4px] px-3 py-2 outline-none border border-transparent focus:border-[#1ed760] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#b3b3b3] mb-1.5">
              توضیحات (اختیاری)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح کوتاهی درباره حال‌وهوای این لیست بنویسید..."
              className="w-full bg-[#3e3e3e] focus:bg-[#4a4a4a] text-white text-sm rounded-[4px] px-3 py-2 outline-none border border-transparent focus:border-[#1ed760] transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#b3b3b3] hover:text-white transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 rounded-full bg-[#1ed760] text-black text-xs font-bold hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md"
            >
              ایجاد لیست
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
