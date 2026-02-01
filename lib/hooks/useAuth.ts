/**
 * 인증 관련 커스텀 훅
 */

import { useAuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};
