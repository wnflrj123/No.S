'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
  query,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { Production, Musical, User } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductionCard from '@/components/productions/ProductionCard';
import ProductionForm from '@/components/productions/ProductionForm';
import { FiFilm, FiPlus } from 'react-icons/fi';

export default function ProductionsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [productions, setProductions] = useState<Production[]>([]);
  const [musicals, setMusicals] = useState<Musical[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [panelMode, setPanelMode] = useState<'none' | 'detail' | 'form'>('none');
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 작품 목록 (한 번만 로드)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDocs(query(collection(db, 'musicals'), orderBy('createdAt', 'asc')));
      setMusicals(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Musical, 'id' | 'createdAt' | 'updatedAt'>),
          createdAt: d.data().createdAt?.toDate(),
          updatedAt: d.data().updatedAt?.toDate(),
        }))
      );
    };
    load();
  }, [user]);

  // 사용자 목록 (한 번만 로드)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(
        snap.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as Omit<User, 'uid'>),
        }))
      );
    };
    load();
  }, [user]);

  // 프로덕션 실시간 구독
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'productions'), orderBy('startDate', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Production[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Production, 'id' | 'createdAt' | 'updatedAt'>),
        createdAt: d.data().createdAt?.toDate(),
        updatedAt: d.data().updatedAt?.toDate(),
      }));
      setProductions(data);

      setSelectedProduction((prev) => {
        if (!prev) return null;
        return data.find((p) => p.id === prev.id) ?? null;
      });

      setLoading(false);
    });
    return () => unsub();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (production: Production) => {
    if (selectedProduction?.id === production.id && panelMode === 'detail') {
      setSelectedProduction(null);
      setPanelMode('none');
    } else {
      setSelectedProduction(production);
      setPanelMode('detail');
      setEditingProduction(null);
    }
  };

  const handleAddClick = () => {
    setSelectedProduction(null);
    setEditingProduction(null);
    setPanelMode('form');
  };

  const handleEdit = (production: Production) => {
    setEditingProduction(production);
    setPanelMode('form');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'productions', id));
      if (selectedProduction?.id === id) {
        setSelectedProduction(null);
        setPanelMode('none');
      }
    } catch (e) {
      console.error('삭제 실패:', e);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleFormSuccess = () => {
    setPanelMode('none');
    setEditingProduction(null);
  };

  const handleFormCancel = () => {
    setPanelMode(selectedProduction ? 'detail' : 'none');
    setEditingProduction(null);
  };

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

      {/* 상단 헤더 */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-primary/8 to-accent/5 blur-3xl" />
        <div className="relative max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-8">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/8 text-primary rounded-xl text-sm font-medium mb-3">
              <FiFilm size={14} />
              프로덕션
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              프로덕션
            </h1>
            <p className="text-sm mt-1.5" style={{ color: '#8b95a1' }}>
              캐스팅 보드와 공연 일정을 확인하세요
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* 등록 버튼 */}
        {isAdmin && panelMode !== 'form' && (
          <button
            onClick={handleAddClick}
            className="w-full mb-5 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[15px] animate-fade-in-up"
          >
            <FiPlus size={18} />
            프로덕션 등록하기
          </button>
        )}

        {/* 폼 패널 (목록 위) */}
        {panelMode === 'form' && (
          <div className="bg-white rounded-2xl border border-gray-100 mb-6 animate-fade-in-up">
            <ProductionForm
              musicals={musicals}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              editingProduction={editingProduction}
            />
          </div>
        )}

        {/* 프로덕션 목록 */}
        {productions.length === 0 && panelMode !== 'form' ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-primary/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiFilm size={28} className="text-primary" />
            </div>
            <p className="text-[15px] font-bold text-foreground mb-1">등록된 프로덕션이 없어요</p>
            <p className="text-sm" style={{ color: '#8b95a1' }}>
              {isAdmin ? '오른쪽 상단 등록 버튼을 눌러 추가해보세요' : '새로운 프로덕션이 등록되면 여기에 표시돼요'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {productions.map((prod) => (
              <ProductionCard
                key={prod.id}
                production={prod}
                musical={musicals.find((m) => m.id === prod.musicalId)}
                users={users}
                selected={selectedProduction?.id === prod.id && panelMode === 'detail'}
                isAdmin={isAdmin}
                onClick={() => handleSelect(prod)}
                onEdit={() => handleEdit(prod)}
                onDelete={() => setDeleteConfirmId(prod.id)}
              />
            ))}
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
            <h3 className="text-base font-bold text-foreground mb-2">프로덕션 삭제</h3>
            <p className="text-sm text-gray-500 mb-5">
              이 프로덕션을 삭제하면 캐스팅과 공연 일정이 모두 사라져요. 계속할까요?
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
