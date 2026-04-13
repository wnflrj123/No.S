'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { Musical } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MusicalCarousel from '@/components/musicals/MusicalCarousel';
import MusicalDetail from '@/components/musicals/MusicalDetail';
import MusicalForm from '@/components/musicals/MusicalForm';
import { FiMusic } from 'react-icons/fi';

export default function MusicalPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [musicals, setMusicals] = useState<Musical[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMusical, setSelectedMusical] = useState<Musical | null>(null);
  // 'none' | 'detail' | 'form'
  const [panelMode, setPanelMode] = useState<'none' | 'detail' | 'form'>('none');
  const [editingMusical, setEditingMusical] = useState<Musical | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'musicals'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Musical[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Musical, 'id' | 'createdAt' | 'updatedAt'>),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
      }));
      setMusicals(data);

      // 선택된 작품 데이터 최신 상태 유지
      setSelectedMusical((prev) => {
        if (!prev) return null;
        return data.find((m) => m.id === prev.id) ?? null;
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // 작품 카드 클릭 → 상세 패널
  const handleSelect = (musical: Musical) => {
    if (selectedMusical?.id === musical.id && panelMode === 'detail') {
      // 같은 카드 재클릭 시 닫기
      setSelectedMusical(null);
      setPanelMode('none');
    } else {
      setSelectedMusical(musical);
      setPanelMode('detail');
      setEditingMusical(null);
    }
  };

  // + 카드 클릭 → 등록 폼 패널
  const handleAddClick = () => {
    setSelectedMusical(null);
    setEditingMusical(null);
    setPanelMode('form');
  };

  const handleEdit = (musical: Musical) => {
    setEditingMusical(musical);
    setPanelMode('form');
  };

  const handleDelete = async (musicalId: string) => {
    try {
      await deleteDoc(doc(db, 'musicals', musicalId));
    } catch (err) {
      console.error('작품 삭제 실패:', err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleFormSuccess = () => {
    setPanelMode('none');
    setEditingMusical(null);
  };

  const handleFormCancel = () => {
    setPanelMode(selectedMusical ? 'detail' : 'none');
    setEditingMusical(null);
  };

  // 캐러셀이 미니로 전환되는 조건: 하단 패널이 열려있을 때
  const isLarge = panelMode === 'none';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Header />

      {/* 상단 헤더 영역 */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-primary/8 to-accent/5 blur-3xl" />
        <div className="relative max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-8">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/8 text-primary rounded-xl text-sm font-medium mb-3">
              <FiMusic size={14} />
              작품 정보
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              작품 정보
            </h1>
            <p className="text-sm mt-1.5" style={{ color: '#8b95a1' }}>
              씬과 넘버 정보를 확인하세요
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* 작품이 없고 admin도 아닌 경우 */}
        {musicals.length === 0 && !isAdmin ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-primary/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiMusic size={28} className="text-primary" />
            </div>
            <p className="text-[15px] font-bold text-foreground mb-1">등록된 작품정보가 없어요</p>
            <p className="text-sm" style={{ color: '#8b95a1' }}>
              새로운 작품이 등록되면 여기에 표시돼요
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 캐러셀 */}
            <div>
              <MusicalCarousel
                musicals={musicals}
                selectedId={panelMode === 'detail' ? (selectedMusical?.id ?? null) : null}
                variant={isLarge ? 'large' : 'mini'}
                onSelect={handleSelect}
                showAddCard={isAdmin}
                onAdd={handleAddClick}
              />
              {isLarge && musicals.length > 0 && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  작품을 탭하면 상세 정보를 볼 수 있어요
                </p>
              )}
            </div>

            {/* 하단 패널: 상세 또는 등록/수정 폼 */}
            {panelMode === 'detail' && selectedMusical && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-fade-in-up">
                <MusicalDetail
                  musical={selectedMusical}
                  isAdmin={isAdmin}
                  onEdit={() => handleEdit(selectedMusical)}
                  onDelete={() => setDeleteConfirmId(selectedMusical.id)}
                />
              </div>
            )}

            {panelMode === 'form' && (
              <div className="bg-white rounded-2xl border border-gray-100 animate-fade-in-up">
                <MusicalForm
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                  editingMusical={editingMusical}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-xl animate-slide-up sm:animate-fade-in-up">
            <h3 className="text-base font-bold text-foreground mb-2">작품 삭제</h3>
            <p className="text-sm text-gray-500 mb-5">
              이 작품을 삭제하면 모든 구성 정보가 사라져요. 계속할까요?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors text-sm"
              >
                삭제
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-secondary text-foreground font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
