'use client';

/**
 * 인증 상태 관리 Context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    isOwner,
    signInWithGoogle,
    signOut,
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
