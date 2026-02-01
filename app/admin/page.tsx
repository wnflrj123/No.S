'use client';

/**
 * 운영진 관리 페이지
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FiUserPlus, FiTrash2, FiShield, FiSearch } from 'react-icons/fi';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
}

export default function AdminPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<AdminUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 로그인 및 운영진 체크
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/reservations');
      }
    }
  }, [user, authLoading, isAdmin, router]);

  // 운영진 목록 불러오기
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'settings', 'admins'));
        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          setAdmins(adminData.users || []);
        }
      } catch (err) {
        console.error('운영진 목록 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchAdmins();
    }
  }, [isAdmin]);

  // 사용자 검색
  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }

    setSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      // reservations에서 해당 이메일로 등록된 사용자 찾기
      const q = query(
        collection(db, 'reservations'),
        where('userEmail', '==', searchEmail.trim())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('해당 이메일로 예약한 기록이 없습니다. 먼저 한 번 이상 로그인하고 예약을 해야 합니다.');
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
      setError('검색에 실패했습니다.');
    } finally {
      setSearching(false);
    }
  };

  // 운영진 추가
  const handleAddAdmin = async () => {
    if (!searchResult) return;

    // 이미 운영진인지 확인
    if (admins.some((a) => a.uid === searchResult.uid)) {
      setError('이미 운영진입니다.');
      return;
    }

    try {
      const newAdmins = [...admins, searchResult];
      await setDoc(doc(db, 'settings', 'admins'), {
        uids: newAdmins.map((a) => a.uid),
        users: newAdmins,
      });

      setAdmins(newAdmins);
      setSearchResult(null);
      setSearchEmail('');
      setSuccess(`${searchResult.displayName}님을 운영진으로 추가했습니다.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('운영진 추가 실패:', err);
      setError('운영진 추가에 실패했습니다.');
    }
  };

  // 운영진 삭제
  const handleRemoveAdmin = async (adminToRemove: AdminUser) => {
    if (adminToRemove.uid === user?.uid) {
      setError('자기 자신은 삭제할 수 없습니다.');
      return;
    }

    if (!confirm(`${adminToRemove.displayName}님을 운영진에서 삭제하시겠습니까?`)) return;

    try {
      const newAdmins = admins.filter((a) => a.uid !== adminToRemove.uid);
      await setDoc(doc(db, 'settings', 'admins'), {
        uids: newAdmins.map((a) => a.uid),
        users: newAdmins,
      });

      setAdmins(newAdmins);
      setSuccess(`${adminToRemove.displayName}님을 운영진에서 삭제했습니다.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('운영진 삭제 실패:', err);
      setError('운영진 삭제에 실패했습니다.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-primary text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <FiShield className="text-primary" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">운영진 관리</h1>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* 운영진 추가 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiUserPlus className="text-primary" />
            운영진 추가
          </h2>

          <div className="flex gap-2">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="추가할 회원의 이메일 입력"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FiSearch size={18} />
              검색
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResult && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{searchResult.displayName}</p>
                <p className="text-sm text-gray-500">{searchResult.email}</p>
              </div>
              <button
                onClick={handleAddAdmin}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                운영진 추가
              </button>
            </div>
          )}
        </div>

        {/* 운영진 목록 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            현재 운영진 ({admins.length}명)
          </h2>

          {admins.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              등록된 운영진이 없습니다.
              <br />
              <span className="text-sm">처음 운영진을 추가하려면 Firebase Console에서 직접 설정해주세요.</span>
            </p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.uid}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {admin.displayName}
                      {admin.uid === user?.uid && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          나
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                  </div>
                  {admin.uid !== user?.uid && (
                    <button
                      onClick={() => handleRemoveAdmin(admin)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 초기 설정 안내 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">첫 운영진 설정 방법</h3>
          <p className="text-sm text-yellow-700">
            처음에는 Firebase Console에서 직접 설정해야 합니다:
          </p>
          <ol className="text-sm text-yellow-700 mt-2 list-decimal list-inside space-y-1">
            <li>Firebase Console → Firestore Database</li>
            <li>settings 컬렉션 → admins 문서 생성</li>
            <li>uids 필드 (배열): 운영진 UID 추가</li>
            <li>users 필드 (배열): {'{uid, email, displayName}'} 객체 추가</li>
          </ol>
        </div>
      </main>

      <Footer />
    </div>
  );
}
