'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FiX, FiDownload, FiShare } from 'react-icons/fi';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'nos-install-dismissed';
const DISMISS_DAYS = 7;

export default function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  // 외부 관객용 invite 경로에서는 PWA 설치 안내를 띄우지 않는다
  const isInviteRoute = pathname?.startsWith('/invite/') ?? false;

  useEffect(() => {
    if (isInviteRoute) return;

    // 이미 설치된 경우 표시하지 않음
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // 모바일에서만 표시
    const isMobile = /Android|iPhone|iPad|iPod/.test(navigator.userAgent) || window.innerWidth <= 768;
    if (!isMobile) return;

    // 최근 닫은 경우 표시하지 않음
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // Android/Chrome: beforeinstallprompt 이벤트
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);

    // iOS Safari 감지
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- iOS Safari 감지는 client mount 이후에만 가능
      setShowIOSGuide(true);
      setTimeout(() => setVisible(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, [isInviteRoute]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  if (isInviteRoute) return null;
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            {showIOSGuide ? (
              <FiShare size={20} className="text-primary" />
            ) : (
              <FiDownload size={20} className="text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              No.S 앱으로 설치하기
            </p>
            {showIOSGuide ? (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                하단의 <span className="inline-flex items-center"><FiShare size={12} className="mx-0.5" /></span> 공유 버튼을 누른 후<br />
                <strong>&quot;홈 화면에 추가&quot;</strong>를 선택하세요
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                홈화면에 추가하면 앱처럼 빠르게 이용할 수 있어요
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1"
          >
            <FiX size={18} />
          </button>
        </div>
        {!showIOSGuide && (
          <button
            onClick={handleInstall}
            className="w-full mt-3 bg-primary text-white text-sm font-medium py-2.5 rounded-xl hover:bg-primary-dark transition-colors"
          >
            설치하기
          </button>
        )}
      </div>
    </div>
  );
}
