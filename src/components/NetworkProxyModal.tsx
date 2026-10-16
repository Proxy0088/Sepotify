import React, { useState, useEffect } from 'react';
import { Shield, Wifi, CheckCircle2, AlertTriangle, RefreshCw, Server, ArrowLeft, Terminal, HelpCircle, X } from 'lucide-react';

interface NetworkProxyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProxyUpdated?: () => void;
}

export const NetworkProxyModal: React.FC<NetworkProxyModalProps> = ({
  isOpen,
  onClose,
  onProxyUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{
    configuredProxy: string | null;
    activeProxy: string | null;
    detectedProxy: string | null;
    availableProxies: Array<{ name: string; port: number; isOpen: boolean; url: string }>;
    tips: string[];
  } | null>(null);

  const [customProxyInput, setCustomProxyInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/network/status');
      const data = await res.json();
      setNetworkInfo(data);
      if (data.activeProxy) {
        setCustomProxyInput(data.activeProxy);
      }
    } catch {
      setStatusMessage('خطا در دریافت وضعیت سرور محلی.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleApplyProxy = async (proxyUrl: string) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/network/set-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message);
        await fetchStatus();
        if (onProxyUpdated) onProxyUpdated();
      } else {
        setStatusMessage(data.error || 'خطا در ثبت پروکسی');
      }
    } catch {
      setStatusMessage('عدم برقراری ارتباط با سرور برنامه.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto liquid-glass-elevated border border-white/20 rounded-[28px] p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1ed760]/30 to-blue-500/20 border border-[#1ed760]/40 flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5 text-[#1ed760]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">راهنمای فیلترشکن و تنظیم پروکسی محلی</h2>
              <p className="text-xs text-white/60">چرا یوتیوب در سیستم شخصی بالا نمی‌آید و چگونه حل می‌شود؟</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Why this happens banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-5 text-xs text-amber-200/90 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>علت تفاوت پیش‌نمایش کلود با سیستم شخصی شما:</span>
          </div>
          <p className="leading-relaxed">
            پیش‌نمایشی که در مرورگر می‌بینید روی سرورهای ابری خارج از کشور اجرا می‌شود و فیلتر نیست. اما وقتی پروژه را روی کامپیوتر خود بردید، سرور <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">Node.js</code> مستقیماً در ترمینال شما اجرا می‌شود. در ویندوز، نرم‌افزارهای V2Ray فقط پروکسی مرورگر را ست می‌کنند و ترمینال را به صورت پیش‌فرض پروکسی نمی‌کنند!
          </p>
        </div>

        {/* Solutions */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
            <span>۳ روش آسان برای حل قطعی:</span>
          </h3>

          {/* Solution 1: TUN Mode */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors border border-[#1ed760]/30 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#1ed760]">روش ۱ (سریع‌ترین و بهترین — ۱ کلیک): فعال‌سازی حالت TUN</span>
              <span className="text-[10px] bg-[#1ed760]/20 text-[#1ed760] px-2 py-0.5 rounded-full font-bold">پیشنهادی</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              در نرم‌افزار <strong>v2rayN</strong> در پایین صفحه دکمه <strong>Enable Tun Mode (حالت TUN)</strong> را تیک بزنید (یا در <strong>Nekoray</strong> روی دکمه <strong>TUN Mode</strong> کلیک کنید). با این کار کل سیستم‌عامل از جمله ترمینال شما از فیلترشکن رد شده و یوتیوب فوراً در سیستم شما هم باز می‌شود.
            </p>
          </div>

          {/* Solution 2: Local Proxy Routing in Node.js */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white">روش ۲: اتصال خودکار سرور برنامه به پورت V2Ray سیستم شما</span>
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] text-[#1ed760] hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>بررسی مجدد پورت‌ها</span>
              </button>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              اگر نمی‌خواهید TUN Mode را روشن کنید، سرور می‌تواند درخواست‌های یوتیوب را از پورت محلی V2Ray شما رد کند:
            </p>

            {/* Detected Ports */}
            {networkInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {networkInfo.availableProxies.map((p) => (
                  <div
                    key={p.port}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                      p.isOpen
                        ? 'bg-[#1ed760]/10 border-[#1ed760]/40 text-white'
                        : 'bg-black/30 border-white/5 text-white/50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${p.isOpen ? 'bg-[#1ed760] animate-pulse' : 'bg-white/20'}`} />
                        <span>{p.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-white/60">127.0.0.1:{p.port}</span>
                    </div>

                    <button
                      onClick={() => handleApplyProxy(p.url)}
                      disabled={loading}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        networkInfo.activeProxy === p.url
                          ? 'bg-[#1ed760] text-black'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {networkInfo.activeProxy === p.url ? 'متصل' : 'اتصال به این پورت'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Manual Proxy Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customProxyInput}
                onChange={(e) => setCustomProxyInput(e.target.value)}
                placeholder="مثال: http://127.0.0.1:10809"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-left direction-ltr focus:outline-none focus:border-[#1ed760]"
              />
              <button
                onClick={() => handleApplyProxy(customProxyInput)}
                disabled={loading || !customProxyInput}
                className="px-4 py-2 bg-[#1ed760] hover:bg-[#1ed760]/90 text-black font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
              >
                ثبت پروکسی
              </button>
              {networkInfo?.activeProxy && (
                <button
                  onClick={() => handleApplyProxy('none')}
                  disabled={loading}
                  className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-xl border border-red-500/30 transition-all shrink-0"
                >
                  حذف پروکسی
                </button>
              )}
            </div>
          </div>

          {/* Solution 3: Terminal Command */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>روش ۳: اجرای ترمینال با تنظیم پروکسی در پاورشل</span>
            </span>
            <p className="text-xs text-white/70">
              اگر در PowerShell دستور زیر را قبل از اجرای سرور بزنید، ترمینال نیز از فیلترشکن عبور می‌کند:
            </p>
            <div className="bg-black/60 border border-white/10 p-2.5 rounded-xl font-mono text-[11px] text-[#1ed760] direction-ltr text-left select-all overflow-x-auto">
              $env:HTTP_PROXY="http://127.0.0.1:10809"; $env:HTTPS_PROXY="http://127.0.0.1:10809"; npm run dev
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="p-3 mb-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs text-center font-medium">
            {statusMessage}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="text-[11px] text-white/50 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#1ed760]" />
            <span>پروکسی فعال سرور: </span>
            <strong className="text-white font-mono">{networkInfo?.activeProxy || 'اتصال مستقیم (بدون پروکسی)'}</strong>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
