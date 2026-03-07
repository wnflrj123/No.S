import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verify the request has a valid Firebase ID token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check if caller is Owner
    const adminsDoc = await adminDb.collection('settings').doc('admins').get();
    if (!adminsDoc.exists || adminsDoc.data()?.ownerUid !== decodedToken.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // List all Firebase Auth users
    let nextPageToken: string | undefined;
    let synced = 0;

    do {
      const listResult = await adminAuth.listUsers(1000, nextPageToken);

      const batch = adminDb.batch();
      for (const user of listResult.users) {
        const userRef = adminDb.collection('users').doc(user.uid);
        batch.set(userRef, {
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
        }, { merge: true });
      }
      await batch.commit();

      synced += listResult.users.length;
      nextPageToken = listResult.pageToken;
    } while (nextPageToken);

    return NextResponse.json({ success: true, synced });
  } catch (error) {
    console.error('Sync users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
