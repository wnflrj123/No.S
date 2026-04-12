'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiCheck, FiX, FiMenu, FiX as FiClose, FiCalendar } from 'react-icons/fi';

export default function Header() {
  const { user, isOwner, effectiveName, signOut, updateCustomName } = useAuth();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
        setEditingName(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const startEditName = () => {
    setNameInput(user?.customName || '');
    setEditingName(true);
    setSaveMessage(null);
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await updateCustomName(nameInput);
      setEditingName(false);
      setSaveMessage('이름이 변경되었어요');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (e) {
      console.error('이름 변경 실패:', e);
      setSaveMessage('변경에 실패했어요');
    } finally {
      setSaving(false);
    }
  };

  const navLinks = [
    ...(user ? [
      { href: '/notices', label: '공지사항' },
      { href: '/musicals', label: '작품 정보' },
      { href: '/productions', label: '프로덕션' },
    ] : []),
    ...(isOwner ? [{ href: '/admin', label: '관리' }] : []),
  ];

  return (
    <>
      <header className={`bg-white/80 backdrop-blur-md sticky top-0 z-50 ${showMobileMenu ? '' : 'border-b border-gray-200/60'}`}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5" onClick={() => setShowMobileMenu(false)}>
              <Image
                src="/logo.svg"
                alt="No.S 로고"
                width={32}
                height={32}
              />
              <span className="text-lg font-bold text-foreground tracking-tight">No.S</span>
            </Link>

            {/* 데스크탑 네비게이션 */}
            <nav className="hidden md:flex items-center gap-2">
              {user && (
                <Link
                  href="/reservations"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors"
                >
                  예약 현황
                </Link>
              )}
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {label}
                </Link>
              ))}

              {user ? (
                <div className="relative ml-2" ref={profileRef}>
                  <button
                    onClick={() => { setShowProfile(!showProfile); setEditingName(false); }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt={effectiveName}
                        className="w-7 h-7 rounded-full ring-2 ring-gray-100"
                      />
                    )}
                    <span className="text-sm text-gray-600 hidden sm:inline">
                      {effectiveName}
                    </span>
                  </button>

                  {showProfile && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-lg p-4 animate-slide-down z-50">
                      {/* Profile info */}
                      <div className="flex items-center gap-3 mb-3">
                        {user.photoURL && (
                          <img
                            src={user.photoURL}
                            alt={effectiveName}
                            className="w-11 h-11 rounded-full"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{effectiveName}</p>
                          <p className="text-xs truncate" style={{ color: '#8b95a1' }}>{user.email}</p>
                        </div>
                      </div>

                      {/* Name edit */}
                      <div className="border-t border-gray-100 pt-3 mb-3">
                        <p className="text-xs font-medium mb-2" style={{ color: '#8b95a1' }}>표시 이름</p>
                        {editingName ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={nameInput}
                              onChange={(e) => setNameInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                              placeholder={user.displayName || '이름 입력'}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                              autoFocus
                              maxLength={20}
                            />
                            <button
                              onClick={handleSaveName}
                              disabled={saving}
                              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/8 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => setEditingName(false)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={startEditName}
                            className="w-full flex items-center justify-between px-3 py-2 bg-secondary rounded-xl text-sm hover:bg-gray-200 transition-colors"
                          >
                            <span style={{ color: '#4e5968' }}>
                              {user.customName || (
                                <span style={{ color: '#b0b8c1' }}>이름을 설정해보세요</span>
                              )}
                            </span>
                            <FiEdit2 size={13} style={{ color: '#8b95a1' }} />
                          </button>
                        )}
                        {saveMessage && (
                          <p className="text-xs text-primary mt-1.5 font-medium">{saveMessage}</p>
                        )}
                        {!editingName && (
                          <p className="text-[11px] mt-1.5" style={{ color: '#b0b8c1' }}>
                            비우면 Google 이름({user.displayName})이 사용돼요
                          </p>
                        )}
                      </div>

                      {/* Sign out */}
                      <button
                        onClick={handleSignOut}
                        className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2 text-sm font-medium bg-foreground text-white rounded-full hover:bg-gray-800 transition-colors"
                >
                  로그인
                </Link>
              )}
            </nav>

            {/* 모바일 우측 영역 */}
            <div className="relative flex md:hidden items-center gap-2" ref={profileRef}>
              {user && (
                <>
                  <button
                    onClick={() => { setShowProfile(!showProfile); setEditingName(false); setShowMobileMenu(false); }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt={effectiveName}
                        className="w-7 h-7 rounded-full ring-2 ring-gray-100"
                      />
                    )}
                  </button>

                  {showProfile && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-lg p-4 animate-slide-down z-50">
                      <div className="flex items-center gap-3 mb-3">
                        {user.photoURL && (
                          <img
                            src={user.photoURL}
                            alt={effectiveName}
                            className="w-11 h-11 rounded-full"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{effectiveName}</p>
                          <p className="text-xs truncate" style={{ color: '#8b95a1' }}>{user.email}</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3 mb-3">
                        <p className="text-xs font-medium mb-2" style={{ color: '#8b95a1' }}>표시 이름</p>
                        {editingName ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={nameInput}
                              onChange={(e) => setNameInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                              placeholder={user.displayName || '이름 입력'}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                              autoFocus
                              maxLength={20}
                            />
                            <button
                              onClick={handleSaveName}
                              disabled={saving}
                              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/8 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => setEditingName(false)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={startEditName}
                            className="w-full flex items-center justify-between px-3 py-2 bg-secondary rounded-xl text-sm hover:bg-gray-200 transition-colors"
                          >
                            <span style={{ color: '#4e5968' }}>
                              {user.customName || (
                                <span style={{ color: '#b0b8c1' }}>이름을 설정해보세요</span>
                              )}
                            </span>
                            <FiEdit2 size={13} style={{ color: '#8b95a1' }} />
                          </button>
                        )}
                        {saveMessage && (
                          <p className="text-xs text-primary mt-1.5 font-medium">{saveMessage}</p>
                        )}
                        {!editingName && (
                          <p className="text-[11px] mt-1.5" style={{ color: '#b0b8c1' }}>
                            비우면 Google 이름({user.displayName})이 사용돼요
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handleSignOut}
                        className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* 예약 현황 달력 버튼 */}
              {user && (
                <Link
                  href="/reservations"
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                  aria-label="예약 현황"
                >
                  <FiCalendar size={20} />
                </Link>
              )}

              {/* 햄버거 버튼 */}
              <button
                onClick={() => { setShowMobileMenu(!showMobileMenu); setShowProfile(false); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                aria-label="메뉴"
              >
                {showMobileMenu ? <FiClose size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 오버레이 */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        >
          {/* 배경 블러 */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          {/* 메뉴 패널 */}
          <div
            className="absolute top-16 left-0 right-0 bg-white/80 backdrop-blur-md animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowMobileMenu(false)}
                  className="px-4 py-3 text-base font-medium text-gray-700 hover:text-foreground rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {label}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="mt-2 px-4 py-3 text-base font-medium bg-foreground text-white rounded-xl text-center hover:bg-gray-800 transition-colors"
                >
                  로그인
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
