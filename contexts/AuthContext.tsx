'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const effectiveName = useMemo(() => {
    if (!user) return '익명';
    return user.customName || user.displayName || '익명';
  }, [user]);

  const checkRoles = async (uid: string): Promise<{ admin: boolean; owner: boolean }> => {
    try {
      const adminDoc = await getDoc(doc(db, 'settings', 'admins'));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        const adminList = data.uids || [];
        const ownerUid = data.ownerUid || '';
        return {
          admin: adminList.includes(uid) || ownerUid === uid,
          owner: ownerUid === uid,
        };
      }
      return { admin: false, owner: false };
    } catch (error) {
      console.error('권한 확인 실패:', error);
      return { admin: false, owner: false };
    }
  };

  const handleFirebaseUser = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // Firestore에서 customName 읽기
      let customName: string | null = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          customName = userDoc.data().customName || null;
        }
      } catch (e) {
        console.error('사용자 정보 조회 실패:', e);
      }

      setUser({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        customName,
      });

      // users 컬렉션에 사용자 정보 저장/업데이트
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          lastLoginAt: Timestamp.now(),
        }, { merge: true });
      } catch (e) {
        console.error('사용자 정보 저장 실패:', e);
      }

      const roles = await checkRoles(firebaseUser.uid);
      setIsAdmin(roles.admin);
      setIsOwner(roles.owner);
    } else {
      setUser(null);
      setIsAdmin(false);
      setIsOwner(false);
    }
  };

  useEffect(() => {
    // signInWithRedirect 후 돌아왔을 때 결과를 처리하는 Promise
    const redirectPromise = getRedirectResult(auth).catch((error) => {
      console.error('리다이렉트 로그인 처리 실패:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // 리다이렉트 결과가 처리될 때까지 대기 (첫 호출 시 null이 올 수 있음)
      await redirectPromise;

      await handleFirebaseUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  };

  const updateCustomName = async (name: string) => {
    if (!user) throw new Error('로그인이 필요해요');

    const trimmed = name.trim();
    const newCustomName = trimmed || null;
    const newDisplayName = newCustomName || user.displayName || '익명';

    // 1. users 컬렉션 업데이트
    await updateDoc(doc(db, 'users', user.uid), {
      customName: newCustomName,
    });

    // 2. 기존 예약의 userName 일괄 업데이트
    try {
      const q = query(
        collection(db, 'reservations'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => {
          batch.update(d.ref, { userName: newDisplayName });
        });
        await batch.commit();
      }
    } catch (e) {
      console.error('예약 이름 업데이트 실패:', e);
    }

    setUser((prev) => prev ? { ...prev, customName: newCustomName } : null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    isOwner,
    effectiveName,
    signInWithGoogle,
    signOut,
    updateCustomName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
