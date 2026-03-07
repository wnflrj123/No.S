'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FiUserPlus, FiTrash2, FiShield, FiSearch, FiStar, FiArrowRight, FiX, FiAlertTriangle } from 'react-icons/fi';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
}

type ModalType = 'none' | 'transfer';

export default function AdminPage() {
  const { user, loading: authLoading, isOwner } = useAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<AdminUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType>('none');
  const [transferTarget, setTransferTarget] = useState<AdminUser | null>(null);
  const [transferConfirmText, setTransferConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isOwner) {
        router.push('/reservations');
      }
    }
  }, [user, authLoading, isOwner, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'settings', 'admins'));
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          setAdmins(data.users || []);

          // Owner 정보
          const ownerUid = data.ownerUid;
          if (ownerUid && user) {
            const ownerUser = (data.users || []).find((u: AdminUser) => u.uid === ownerUid);
            if (ownerUser) {
              setOwnerInfo(ownerUser);
            } else {
              setOwnerInfo({ uid: user.uid, email: user.email || '', displayName: user.displayName || '' });
            }
          }
        }
      } catch (err) {
        console.error('데이터 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOwner) {
      fetchData();
    }
  }, [isOwner, user]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }

    setSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const q = query(
        collection(db, 'reservations'),
        where('userEmail', '==', searchEmail.trim())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('해당 이메일로 예약한 기록이 없어요. 먼저 로그인 후 예약을 한 번 해야 해요.');
      } else {
        const userData = snapshot.docs[0].data();
        setSearchResult({
          uid: userData.userId,
          email: userData.userEmail,
          displayName: userData.userName,
        });
      }
    } catch (err) {
      console.error('검색 실패:', err);
      setError('검색에 실패했어요.');
    } finally {
      setSearching(false);
    }
  };

  const saveAdmins = async (newAdmins: AdminUser[]) => {
    const adminDoc = await getDoc(doc(db, 'settings', 'admins'));
    const ownerUid = adminDoc.exists() ? adminDoc.data().ownerUid : user?.uid;

    await setDoc(doc(db, 'settings', 'admins'), {
      uids: newAdmins.map((a) => a.uid),
      users: newAdmins,
      ownerUid,
    });

    setAdmins(newAdmins);
  };

  const handleAddAdmin = async () => {
    if (!searchResult) return;

    if (admins.some((a) => a.uid === searchResult.uid)) {
      setError('이미 관리자예요.');
      return;
    }

    try {
      const newAdmins = [...admins, searchResult];
      await saveAdmins(newAdmins);

      setSearchResult(null);
      setSearchEmail('');
      setSuccess(`${searchResult.displayName}님을 관리자로 추가했어요.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('관리자 추가 실패:', err);
      setError('관리자 추가에 실패했어요.');
    }
  };

  const handleRemoveAdmin = async (adminToRemove: AdminUser) => {
    if (adminToRemove.uid === user?.uid) {
      setError('Owner는 삭제할 수 없어요.');
      return;
    }

    if (!confirm(`${adminToRemove.displayName}님을 관리자에서 삭제할까요?`)) return;

    try {
      const newAdmins = admins.filter((a) => a.uid !== adminToRemove.uid);
      await saveAdmins(newAdmins);

      setSuccess(`${adminToRemove.displayName}님을 관리자에서 삭제했어요.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('관리자 삭제 실패:', err);
      setError('관리자 삭제에 실패했어요.');
    }
  };

  const handleTransferOwner = async () => {
    if (!transferTarget || !user) return;

    setIsProcessing(true);
    try {
      // Ensure the transfer target is in the admins list
      let newAdmins = [...admins];
      if (!newAdmins.some((a) => a.uid === transferTarget.uid)) {
        newAdmins.push(transferTarget);
      }
      // Add current owner to admins if not already there
      if (!newAdmins.some((a) => a.uid === user.uid)) {
        newAdmins.push({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
        });
      }

      await setDoc(doc(db, 'settings', 'admins'), {
        uids: newAdmins.map((a) => a.uid),
        users: newAdmins,
        ownerUid: transferTarget.uid,
      });

      setSuccess(`${transferTarget.displayName}님에게 Owner를 양도했어요. 잠시 후 페이지를 이동합니다.`);
      setModalType('none');
      setTransferTarget(null);
      setTransferConfirmText('');

      setTimeout(() => {
        router.push('/reservations');
      }, 2000);
    } catch (err) {
      console.error('Owner 양도 실패:', err);
      setError('Owner 양도에 실패했어요.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openTransferModal = (admin: AdminUser) => {
    setTransferTarget(admin);
    setTransferConfirmText('');
    setModalType('transfer');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOwner) return null;

  const nonOwnerAdmins = admins.filter((a) => a.uid !== user?.uid);

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <Header />

      {/* Header area */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-primary/8 to-accent/5 blur-3xl" />
        <div className="relative max-w-2xl mx-auto w-full px-4 sm:px-6 pt-6 pb-8">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/8 text-primary rounded-xl text-sm font-medium mb-3">
              <FiShield size={14} />
              Owner 전용
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">관리자 설정</h1>
            <p className="text-sm mt-1.5" style={{ color: '#8b95a1' }}>
              관리자를 추가하거나 Owner를 양도할 수 있어요
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-5">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium animate-slide-down">
            {error}
            <button onClick={() => setError(null)} className="float-right"><FiX size={16} /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3.5 bg-green-50 text-green-600 rounded-xl text-sm font-medium animate-slide-down">
            {success}
          </div>
        )}

        {/* Owner Info */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 animate-fade-in-up">
          <h2 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
            <FiStar className="text-orange-500" size={16} />
            Owner
          </h2>
          <div className="flex items-center gap-3 p-3.5 bg-orange-50 rounded-xl">
            <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {(ownerInfo?.displayName || user?.displayName || '?')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{ownerInfo?.displayName || user?.displayName}</p>
              <p className="text-xs" style={{ color: '#8b95a1' }}>{ownerInfo?.email || user?.email}</p>
            </div>
            <span className="text-[11px] bg-orange-400 text-white px-2.5 py-1 rounded-lg font-medium">Owner</span>
          </div>
        </div>

        {/* Admin List */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4 animate-fade-in-up animation-delay-100">
          <h2 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
            <FiShield className="text-primary" size={16} />
            관리자
            <span className="text-primary text-sm font-medium">({nonOwnerAdmins.length}명)</span>
          </h2>

          {nonOwnerAdmins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-medium text-foreground">아직 추가된 관리자가 없어요</p>
              <p className="text-xs mt-1" style={{ color: '#8b95a1' }}>아래에서 검색해서 추가해보세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nonOwnerAdmins.map((admin, index) => (
                <div
                  key={admin.uid}
                  className="flex items-center gap-3 p-3.5 bg-secondary rounded-xl animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="w-9 h-9 bg-primary/15 rounded-full flex items-center justify-center text-primary text-sm font-bold">
                    {admin.displayName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{admin.displayName}</p>
                    <p className="text-xs" style={{ color: '#8b95a1' }}>{admin.email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openTransferModal(admin)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                      title="Owner 양도"
                    >
                      <FiArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveAdmin(admin)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="삭제"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Admin */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-fade-in-up animation-delay-200">
          <h2 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
            <FiUserPlus className="text-primary" size={16} />
            관리자 추가
          </h2>

          <div className="flex gap-2">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => { setSearchEmail(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="추가할 회원의 이메일"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium active:scale-[0.98]"
            >
              <FiSearch size={15} />
              검색
            </button>
          </div>

          {searching && (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {searchResult && (
            <div className="mt-3 p-3.5 bg-primary/5 rounded-xl flex items-center gap-3 animate-slide-down">
              <div className="w-9 h-9 bg-primary/15 rounded-full flex items-center justify-center text-primary text-sm font-bold">
                {searchResult.displayName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{searchResult.displayName}</p>
                <p className="text-xs" style={{ color: '#8b95a1' }}>{searchResult.email}</p>
              </div>
              <button
                onClick={handleAddAdmin}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors active:scale-[0.98]"
              >
                추가
              </button>
            </div>
          )}

          <p className="text-xs mt-3" style={{ color: '#b0b8c1' }}>
            회원이 한 번 이상 로그인하고 예약을 등록해야 검색할 수 있어요
          </p>
        </div>
      </main>

      <Footer />

      {/* Transfer Owner Modal */}
      {modalType === 'transfer' && transferTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-foreground">Owner 양도</h3>
              <button
                onClick={() => setModalType('none')}
                disabled={isProcessing}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FiX size={18} style={{ color: '#8b95a1' }} />
              </button>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertTriangle className="text-orange-500" size={16} />
                <p className="text-sm font-bold text-orange-700">이 작업은 되돌릴 수 없어요</p>
              </div>
              <p className="text-xs text-orange-600">
                Owner를 양도하면 나는 일반 관리자(Admin)가 되고,
                <strong> {transferTarget.displayName}</strong>님이 새로운 Owner가 돼요.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl mb-4">
              <div className="w-9 h-9 bg-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {transferTarget.displayName[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{transferTarget.displayName}</p>
                <p className="text-xs" style={{ color: '#8b95a1' }}>{transferTarget.email}</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8b95a1' }}>
                확인을 위해 &quot;양도&quot;를 입력해주세요
              </label>
              <input
                type="text"
                value={transferConfirmText}
                onChange={(e) => setTransferConfirmText(e.target.value)}
                placeholder="양도"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalType('none')}
                disabled={isProcessing}
                className="flex-1 py-3 bg-secondary text-foreground font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
              >
                취소
              </button>
              <button
                onClick={handleTransferOwner}
                disabled={isProcessing || transferConfirmText !== '양도'}
                className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isProcessing ? '양도 중...' : 'Owner 양도'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
