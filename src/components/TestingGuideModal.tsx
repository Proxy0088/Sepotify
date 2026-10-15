import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Play,
  DownloadCloud,
  Sparkles,
  WifiOff,
  Database,
  Smartphone,
  Info,
  Check,
} from 'lucide-react';
import { getDownloadedTracks } from '../services/storage';

interface TestingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestInstantPlay: () => void;
  onTestLikesBatch: () => void;
  onTestDownloadTopTracks: () => void;
  onToggleOffline: () => void;
  isOfflineMode: boolean;
  onToggleMobileFrame: () => void;
  isMobileFrame: boolean;
}

export const TestingGuideModal: React.FC<TestingGuideModalProps> = ({
  isOpen,
  onClose,
  onTestInstantPlay,
  onTestLikesBatch,
  onTestDownloadTopTracks,
  onToggleOffline,
  isOfflineMode,
  onToggleMobileFrame,
  isMobileFrame,
}) => {
  const [offlineStats, setOfflineStats] = useState<{ count: number; titles: string[] }>({
    count: 0,
    titles: [],
  });
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getDownloadedTracks().then((tracks) => {
        setOfflineStats({
          count: tracks.length,
          titles: tracks.map((t) => t.title),
        });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerAction = (msg: string, action: () => void) => {
    action();
    setTestResult(msg);
    setTimeout(() => {
      setTestResult(null);
      getDownloadedTracks().then((tracks) => {
        setOfflineStats({
          count: tracks.length,
          titles: tracks.map((t) => t.title),
        });
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="bg-[#181818] text-white w-full max-w-2xl max-h-[90vh] rounded-[8px] p-6 shadow-2xl relative border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">راهنمای جامع برنامه‌ریزی و تست سیستم</h3>
              <p className="text-xs text-[#b3b3b3]">
                آموزش نحوه تست بخش‌های مختلف پلیر و بررسی عملکرد آن در محیط سیستم
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#b3b3b3] hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Result Toast */}
        {testResult && (
          <div className="my-2 p-2.5 bg-[#1ed760]/20 border border-[#1ed760] rounded-[6px] text-xs font-semibold text-[#1ed760] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 text-sm text-[#c5c5c5]">
          {/* Step 1 */}
          <section className="bg-[#1f1f1f] p-4 rounded-[6px] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1ed760] uppercase tracking-wider">
                گام اول: تست پخش فوری (Zero-Latency Instant Play)
              </span>
              <button
                onClick={() => triggerAction('دستور پخش فوری آهنگ ارسال شد', onTestInstantPlay)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1ed760] text-black text-xs font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                اجرای تست پخش
              </button>
            </div>
            <p className="text-xs text-[#b3b3b3] leading-relaxed">
              با کلیک بر روی هر کارت یا جستجو در تب «جستجو»، رویداد کلیک بلافاصله سورس صوتی را بارگذاری کرده و در پلیر پایینی یا تمام‌صفحه به جریان می‌اندازد. در صورت بروز هرگونه قطعی شبکه، موتور صوتی Web Audio Synth به عنوان پشتیبان فعال می‌شود تا هیچ‌گاه پخش متوقف نشود.
            </p>
          </section>

          {/* Step 2 */}
          <section className="bg-[#1f1f1f] p-4 rounded-[6px] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1ed760] uppercase tracking-wider">
                گام دوم: تست دانلود و دسترسی آفلاین (IndexedDB Storage)
              </span>
              <button
                onClick={() => triggerAction('دانلود و کش ۲ ترک در IndexedDB انجام شد', onTestDownloadTopTracks)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                تست دانلود به دیتابیس
              </button>
            </div>
            <p className="text-xs text-[#b3b3b3] leading-relaxed mb-3">
              بر خلاف LocalStorage که تنها ۵ مگابایت فضا دارد، این نرم‌افزار قطعات صوتی را به عنوان فایل Blob در پایگاه‌داده قدرتمند IndexedDB ذخیره می‌کند.
            </p>
            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-[4px] text-xs">
              <span className="flex items-center gap-2 text-white">
                <Database className="w-4 h-4 text-[#1ed760]" />
                وضعیت کنونی IndexedDB:
              </span>
              <span className="font-mono text-[#1ed760] font-bold">
                {offlineStats.count} آهنگ ذخیره‌شده آفلاین
              </span>
            </div>
          </section>

          {/* Step 3 */}
          <section className="bg-[#1f1f1f] p-4 rounded-[6px] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1ed760] uppercase tracking-wider">
                گام سوم: تست قطع شبکه و شبیه‌ساز آفلاین
              </span>
              <button
                onClick={() => triggerAction(`حالت آفلاین به ${!isOfflineMode ? 'فعال' : 'غیرفعال'} تغییر یافت`, onToggleOffline)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isOfflineMode
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#292929] text-white hover:bg-[#333333]'
                }`}
              >
                <WifiOff className="w-3.5 h-3.5" />
                {isOfflineMode ? 'قطع اتصال فعال است' : 'شبیه‌سازی قطع اینترنت'}
              </button>
            </div>
            <p className="text-xs text-[#b3b3b3] leading-relaxed">
              با فعال کردن این گزینه، برنامه رفتار قطع اینترنت را شبیه‌سازی می‌کند. در این حالت می‌توانید به تب «آفلاین» بروید و آهنگ‌های دانلودشده را بدون اینترنت گوش دهید.
            </p>
          </section>

          {/* Step 4 */}
          <section className="bg-[#1f1f1f] p-4 rounded-[6px] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1ed760] uppercase tracking-wider">
                گام چهارم: تست الگوریتم پیشنهاد هوشمند (Recommendation Engine)
              </span>
              <button
                onClick={() => triggerAction('لایک‌های تستی برای ژانر پاپ و سنتی اعمال شد', onTestLikesBatch)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1ed760] text-black text-xs font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                <Sparkles className="w-3.5 h-3.5" />
                اعمال سلیقه آزمایشی
              </button>
            </div>
            <p className="text-xs text-[#b3b3b3] leading-relaxed">
              سیستم به صورت خودکار با هر لایک (۳ امتیاز) و هر بار پخش (۱.۵ امتیاز) ماتریس علایق شما را بازطراحی کرده و در تب «پیشنهادی» و رادیوی آهنگ‌ها، متناسب‌ترین قطعات را در صدر قرار می‌دهد.
            </p>
          </section>

          {/* Step 5 */}
          <section className="bg-[#1f1f1f] p-4 rounded-[6px] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1ed760] uppercase tracking-wider">
                گام پنجم: تست ارگونومی موبایل (Mobile Frame)
              </span>
              <button
                onClick={() => triggerAction(`قاب موبایل ${!isMobileFrame ? 'فعال' : 'تمام‌صفحه'} شد`, onToggleMobileFrame)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                <Smartphone className="w-3.5 h-3.5" />
                {isMobileFrame ? 'خروج از قاب موبایل' : 'مشاهده در قاب گوشی'}
              </button>
            </div>
            <p className="text-xs text-[#b3b3b3] leading-relaxed">
              طراحی برای دسترسی یک‌دسته شست (Bottom Tab Bar) بهینه‌سازی شده و بر روی انواع گوشی‌ها و PWA به صورت Native اجرا می‌شود.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#1ed760] text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            متوجه شدم، بازگشت به نرم‌افزار
          </button>
        </div>
      </div>
    </div>
  );
};
