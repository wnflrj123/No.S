import type { InviteRole, InviteRound } from '@/lib/invites/types';

/** 회차 → 배우 카드를 표시할 때 사용하는 평탄화된 캐스팅 entry */
export interface ResolvedCasting {
  roleName: string;
  description: string;
  actorName: string;
  photoFile?: string;
  photoCrop?: { x: number; y: number; width: number; height: number };
}

/** 회차 1개 분량의 캐스팅 정보 (회차 모달에서 사용) */
export interface RoundCasting {
  roundNo: number;
  teamName: string;
  startAtMs: number;
  castings: ResolvedCasting[];
}

/** 배역 1개에 대한 모든 출연 배우 (배역별 캐스팅 섹션에서 사용) */
export interface ResolvedRoleCast {
  /** 안정적인 그룹 키 (id가 없으면 name 사용) */
  key: string;
  role: {
    name: string;
    description: string;
  };
  actors: Array<{
    actorName: string;
    photoFile?: string;
    photoCrop?: { x: number; y: number; width: number; height: number };
  }>;
}

/**
 * 새 형식(roleId 참조)과 레거시 형식(role 필드 직접) 모두를 안전하게 해석.
 * 회차 모달처럼 '회차 → 캐스트' 흐름이 필요할 때 사용.
 */
export function resolveCasting(round: InviteRound, roles: InviteRole[]): ResolvedCasting[] {
  return round.casting.map(c => {
    if (c.roleId) {
      const role = roles.find(r => r.id === c.roleId);
      return {
        roleName: role?.name ?? '',
        description: role?.description ?? '',
        actorName: c.actorName ?? '',
        photoFile: c.photoFile,
        photoCrop: c.photoCrop,
      };
    }
    return {
      roleName: c.role ?? '',
      description: c.description ?? '',
      actorName: c.actorName ?? '',
      photoFile: c.photoFile,
      photoCrop: c.photoCrop,
    };
  });
}

/**
 * 모든 회차의 캐스팅을 '배역별'로 그룹핑.
 * - 같은 배역 ↔ 다른 회차의 같은 배우는 1개 카드로 dedupe (actorName 기준)
 * - 다른 회차에 같은 배역 ↔ 다른 배우면 별개 카드
 * - 배역 표시 순서: roles 마스터 순 → 그 외 잔여 순(첫 등장 순)
 */
export function groupCastByRole(rounds: InviteRound[], roles: InviteRole[]): ResolvedRoleCast[] {
  const byKey = new Map<string, ResolvedRoleCast>();
  const firstSeenOrder: string[] = [];

  for (const round of rounds) {
    const resolved = resolveCasting(round, roles);
    for (const c of resolved) {
      if (!c.roleName) continue;
      const key = c.roleName; // 배역명을 그룹 키로 사용 (레거시·새 형식 동일)
      let entry = byKey.get(key);
      if (!entry) {
        entry = {
          key,
          role: { name: c.roleName, description: c.description },
          actors: [],
        };
        byKey.set(key, entry);
        firstSeenOrder.push(key);
      } else if (!entry.role.description && c.description) {
        // 일부 회차에는 description이 있을 수 있음 — 첫 발견 값으로 채움
        entry.role.description = c.description;
      }

      const actorName = c.actorName?.trim() ?? '';
      if (!actorName) continue;
      const existed = entry.actors.find(a => a.actorName === actorName);
      if (!existed) {
        entry.actors.push({
          actorName,
          photoFile: c.photoFile,
          photoCrop: c.photoCrop,
        });
      } else if (!existed.photoFile && c.photoFile) {
        // 사진이 늦게 들어온 회차 데이터로 채워줌
        existed.photoFile = c.photoFile;
        existed.photoCrop = c.photoCrop;
      }
    }
  }

  // roles 마스터 순서 우선, 그 다음은 첫 등장 순으로 합치되 중복 제거
  const orderedKeys: string[] = [];
  const pushed = new Set<string>();
  for (const r of roles) {
    if (byKey.has(r.name)) {
      orderedKeys.push(r.name);
      pushed.add(r.name);
    }
  }
  for (const k of firstSeenOrder) {
    if (!pushed.has(k)) orderedKeys.push(k);
  }

  return orderedKeys
    .map(k => byKey.get(k)!)
    .filter(rc => rc.actors.length > 0);
}
