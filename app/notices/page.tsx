'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Notice, NoticeFormData } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiLink,
  FiCheck,
  FiArrowLeft,
} from 'react-icons/fi';

const PAGE_SIZE = 10;

export default function NoticesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    content: '',
    pinned: false,
  });
  const [saving, setSaving] = useState(false);

  // 상세 뷰용 (실시간 리스너)
  const [detailNotice, setDetailNotice] = useState<Notice | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const targetId = searchParams.get('id');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 상세 뷰: 실시간 리스너로 수정사항 즉시 반영
  useEffect(() => {
    if (!targetId || !user) {
      setDetailNotice(null);
      return;
    }

    setDetailLoading(true);
    const unsub = onSnapshot(
      doc(db, 'notices', targetId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDetailNotice({
            id: docSnap.id,
            title: data.title,
            content: data.content,
            pinned: data.pinned || false,
            createdBy: data.createdBy,
            createdByName: data.createdByName,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        } else {
          setDetailNotice(null);
        }
        setDetailLoading(false);
      },
      (error) => {
        console.error('공지사항 조회 실패:', error);
        setDetailLoading(false);
      }
    );

    return () => unsub();
  }, [targetId, user]);

  // 전체 목록 조회
  useEffect(() => {
    const q = query(
      collection(db, 'notices'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data: Notice[] = snapshot.docs.map((d) => {
          const docData = d.data();
          return {
            id: d.id,
            title: docData.title,
            content: docData.content,
            pinned: docData.pinned || false,
            createdBy: docData.createdBy,
            createdByName: docData.createdByName,
            createdAt: docData.createdAt?.toDate() || new Date(),
            updatedAt: docData.updatedAt?.toDate() || new Date(),
          };
        });
        data.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        setNotices(data);
        setLoading(false);
      },
      (error) => {
        console.error('공지사항 조회 실패:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const copyNoticeLink = async (noticeId: string) => {
    const url = `${window.location.origin}/notices?id=${noticeId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopiedId(noticeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', pinned: false });
    setEditingNotice(null);
    setShowForm(false);
  };

  const openEditForm = (notice: Notice) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      pinned: notice.pinned,
    });
    setEditingNotice(notice);
    setShowForm(true);
    // 스크롤을 상단으로
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.content.trim()) return;

    setSaving(true);
    try {
      if (editingNotice) {
        await updateDoc(doc(db, 'notices', editingNotice.id), {
          title: formData.title.trim(),
          content: formData.content.trim(),
          pinned: formData.pinned,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, 'notices'), {
          title: formData.title.trim(),
          content: formData.content.trim(),
          pinned: formData.pinned,
          createdBy: user.uid,
          createdByName: user.customName || user.displayName || '익명',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      resetForm();
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (notice: Notice) => {
    if (!confirm(`"${notice.title}" 공지를 삭제할까요?`)) return;
    try {
      await deleteDoc(doc(db, 'notices', notice.id));
      if (targetId === notice.id) {
        router.push('/notices');
      }
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
    }
  };

  // 수정 폼 공통 컴포넌트
  const renderForm = () => {
    if (!showForm || !isAdmin) return null;
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 animate-slide-down">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-foreground">
            {editingNotice ? '공지 수정' : '새 공지 작성'}
          </h2>
          <button
            onClick={resetForm}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FiX size={18} style={{ color: '#8b95a1' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="제목"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="내용을 입력하세요"
            required
            rows={6}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.pinned}
              onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm" style={{ color: '#4e5968' }}>상단 고정</span>
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-2.5 bg-secondary text-foreground font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? '저장 중...' : editingNotice ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // 페이지네이션
  const totalPages = Math.ceil(notices.length / PAGE_SIZE);
  const pagedNotices = notices.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  // ─── 상세 뷰 ───
  if (targetId) {
    const notice = detailNotice;

    return (
      <div className="min-h-screen flex flex-col bg-secondary">
        <Header />

        <div className="relative bg-white overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-primary/8 to-accent/5 blur-3xl" />
          <div className="relative max-w-2xl mx-auto w-full px-4 sm:px-6 pt-6 pb-8">
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/8 text-primary rounded-xl text-sm font-medium mb-3">
                <FiBell size={14} />
                공지사항
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                공지사항
              </h1>
            </div>
          </div>
        </div>

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-5">
          {/* 목록으로 돌아가기 */}
          <button
            onClick={() => router.push('/notices')}
            className="flex items-center gap-1.5 text-sm font-medium mb-4 px-3 py-2 rounded-xl hover:bg-white transition-colors"
            style={{ color: '#4e5968' }}
          >
            <FiArrowLeft size={16} />
            목록으로
          </button>

          {/* 수정 폼 */}
          {renderForm()}

          {detailLoading ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="shimmer-bg h-6 w-56 rounded-lg mb-4" />
              <div className="shimmer-bg h-4 w-full rounded-lg mb-2" />
              <div className="shimmer-bg h-4 w-full rounded-lg mb-2" />
              <div className="shimmer-bg h-4 w-2/3 rounded-lg" />
            </div>
          ) : !notice ? (
            <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiBell size={28} className="text-gray-400" />
              </div>
              <p className="text-[15px] font-bold text-foreground mb-1">
                공지를 찾을 수 없어요
              </p>
              <p className="text-sm" style={{ color: '#8b95a1' }}>
                삭제되었거나 존재하지 않는 공지예요
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-primary/20 ring-1 ring-primary/10 overflow-hidden animate-fade-in-up">
              {/* 공지 헤더 */}
              <div className="bg-primary/5 px-6 py-5 border-b border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  {notice.pinned && (
                    <span className="text-[11px] bg-primary text-white px-2 py-0.5 rounded-md font-medium">
                      📌 고정
                    </span>
                  )}
                  <span className="text-xs" style={{ color: '#8b95a1' }}>
                    {format(notice.createdAt, 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                    {notice.updatedAt.getTime() !== notice.createdAt.getTime() && ' (수정됨)'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {notice.title}
                </h2>
                <p className="text-sm mt-2" style={{ color: '#8b95a1' }}>
                  작성자: {notice.createdByName}
                </p>
              </div>

              {/* 공지 본문 */}
              <div className="px-6 py-6">
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: '#4e5968' }}
                >
                  {notice.content}
                </p>
              </div>

              {/* 하단 액션 */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => copyNoticeLink(notice.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    copiedId === notice.id
                      ? 'bg-green-50 text-green-600'
                      : 'bg-secondary text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {copiedId === notice.id ? (
                    <>
                      <FiCheck size={13} />
                      복사됨
                    </>
                  ) : (
                    <>
                      <FiLink size={13} />
                      링크 복사
                    </>
                  )}
                </button>

                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditForm(notice)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/8 rounded-xl transition-colors"
                      title="수정"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(notice)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="삭제"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    );
  }

  // ─── 목록 뷰 ───
  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <Header />

      {/* Header area */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-primary/8 to-accent/5 blur-3xl" />
        <div className="relative max-w-2xl mx-auto w-full px-4 sm:px-6 pt-6 pb-8">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/8 text-primary rounded-xl text-sm font-medium mb-3">
              <FiBell size={14} />
              공지사항
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              공지사항
            </h1>
            <p className="text-sm mt-1.5" style={{ color: '#8b95a1' }}>
              동호회 소식과 안내를 확인하세요
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-5">
        {/* Write button (admin only) */}
        {isAdmin && !showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="w-full mb-4 py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 active:scale-[0.98] animate-fade-in-up"
          >
            <FiPlus size={18} />
            공지 작성
          </button>
        )}

        {/* Form */}
        {renderForm()}

        {/* Notice List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 border border-gray-100"
              >
                <div className="shimmer-bg h-5 w-48 rounded-lg mb-3" />
                <div className="shimmer-bg h-4 w-full rounded-lg mb-2" />
                <div className="shimmer-bg h-4 w-2/3 rounded-lg" />
              </div>
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-primary/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiBell size={28} className="text-primary" />
            </div>
            <p className="text-[15px] font-bold text-foreground mb-1">
              아직 공지사항이 없어요
            </p>
            <p className="text-sm" style={{ color: '#8b95a1' }}>
              새로운 소식이 올라오면 여기에 표시돼요
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {pagedNotices.map((notice, index) => (
                <Link
                  key={notice.id}
                  href={`/notices?id=${notice.id}`}
                  className={`block bg-white rounded-2xl border transition-all animate-fade-in-up hover:shadow-md active:scale-[0.99] ${
                    notice.pinned
                      ? 'border-primary/20 ring-1 ring-primary/10'
                      : 'border-gray-100'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      {notice.pinned && (
                        <div className="shrink-0 mt-0.5 text-sm">📌</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {notice.pinned && (
                            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium shrink-0">
                              고정
                            </span>
                          )}
                          <h3 className="text-[15px] font-bold text-foreground truncate">
                            {notice.title}
                          </h3>
                        </div>
                        {/* 본문 미리보기 */}
                        <p
                          className="text-sm mb-2 line-clamp-2"
                          style={{ color: '#6b7684' }}
                        >
                          {notice.content}
                        </p>
                        <div
                          className="flex items-center gap-2 text-xs"
                          style={{ color: '#8b95a1' }}
                        >
                          <span>{notice.createdByName}</span>
                          <span>·</span>
                          <span>
                            {format(notice.createdAt, 'M월 d일', { locale: ko })}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 mt-2">
                        <FiChevronRight size={18} style={{ color: '#b0b8c1' }} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6 pt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft size={18} style={{ color: '#4e5968' }} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                        currentPage === i
                          ? 'bg-primary text-white'
                          : 'text-gray-500 hover:bg-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FiChevronRight size={18} style={{ color: '#4e5968' }} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
