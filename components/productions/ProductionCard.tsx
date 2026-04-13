'use client';

import { useState } from 'react';
import { Production, Musical, User, STAFF_ROLE_LABELS, StaffRole } from '@/types';
import { FiCalendar, FiMapPin, FiChevronDown, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface ProductionCardProps {
  production: Production;
  musical: Musical | undefined;
  users: User[];
  selected: boolean;
  isAdmin: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(dateStr: string) {
  return dateStr.replace(/-/g, '/');
}

function formatDateTime(dt: string) {
  if (!dt) return '일정 미정';
  const [date, time] = dt.split('T');
  const [y, m, d] = date.split('-');
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일${time ? ` ${time}` : ''}`;
}

function getUserName(users: User[], uid: string) {
  const u = users.find((u) => u.uid === uid);
  return u?.customName || u?.displayName || uid;
}

function getPerformancePeriod(performances: Production['performances']): string | null {
  if (performances.length === 0) return null;
  const dates = performances.map((p) => p.dateTime.split('T')[0]).filter(Boolean).sort();
  if (dates.length === 0) return '일정 미정';
  const first = formatDate(dates[0]);
  const last = formatDate(dates[dates.length - 1]);
  return first === last ? first : `${first} ~ ${last}`;
}

export default function ProductionCard({
  production,
  musical,
  users,
  selected,
  isAdmin,
  onClick,
  onEdit,
  onDelete,
}: ProductionCardProps) {
  const period = getPerformancePeriod(production.performances);
  const [activeTab, setActiveTab] = useState<'info' | 'performances'>('info');
  const [openPerformanceId, setOpenPerformanceId] = useState<string | null>(null);

  const sortedPerformances = [...production.performances].sort((a, b) =>
    a.dateTime.localeCompare(b.dateTime)
  );

  const staffByRole = production.staffs.reduce<Record<string, string[]>>((acc, s) => {
    const label = STAFF_ROLE_LABELS[s.role as StaffRole] ?? s.role;
    if (!acc[label]) acc[label] = [];
    acc[label].push(getUserName(users, s.userId));
    return acc;
  }, {});

  // 전체 회차에서 캐릭터별 배우 집계 (중복 제거)
  const castByCharacter = (musical?.characters ?? []).map((char) => {
    const actorIds = Array.from(
      new Set(
        production.performances
          .flatMap((p) => p.castings)
          .filter((c) => c.characterId === char.id)
          .map((c) => c.userId)
      )
    );
    return { char, actorNames: actorIds.map((uid) => getUserName(users, uid)) };
  });

  return (
    <div
      className={`w-full rounded-2xl border transition-all duration-200 overflow-hidden ${
        selected
          ? 'border-primary bg-white shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
      }`}
    >
      {/* 카드 헤더 */}
      <div className="flex items-start p-4 gap-2">
        {/* 클릭 영역 */}
        <button onClick={onClick} className="flex-1 text-left min-w-0">
          {/* 프로덕션 이름 */}
          <h3 className={`text-base font-bold truncate ${selected ? 'text-primary' : 'text-foreground'}`}>
            {production.name}
          </h3>

          {/* 하단 메타 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
            {period && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: '#4e5968' }}>
                <FiCalendar size={13} className="text-primary shrink-0" />
                {period}
              </span>
            )}
            {production.locations.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: '#4e5968' }}>
                <FiMapPin size={13} className="shrink-0" style={{ color: '#8b95a1' }} />
                {production.locations.join(' · ')}
              </span>
            )}
          </div>

          {/* 설명 */}
          {production.description && (
            <div className="mt-2.5 p-3 bg-secondary rounded-xl">
              <p className="text-sm line-clamp-2" style={{ color: '#4e5968' }}>{production.description}</p>
            </div>
          )}
        </button>

        {/* 어드민 버튼 */}
        {isAdmin && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/8 rounded-lg transition-colors"
              title="수정"
            >
              <FiEdit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="삭제"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 확장 영역 */}
      {selected && (
        <div className="border-t border-gray-100 animate-slide-down">
          {/* 탭 */}
          <div className="flex border-b border-gray-100 px-4">
            {(['info', 'performances'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'info' ? '제작 정보' : `공연 회차 (${sortedPerformances.length})`}
              </button>
            ))}
          </div>

          <div className="px-4 pt-5 pb-6">
            {/* 제작 정보 탭 */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* 작품 */}
                {musical && (
                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: '#4e5968' }}>작품</h3>
                    <p className="text-sm font-medium text-foreground">{musical.name}</p>
                  </div>
                )}

                {/* 준비기간 */}
                <div>
                  <h3 className="text-sm font-medium mb-3" style={{ color: '#4e5968' }}>준비기간</h3>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(production.startDate)} ~ {formatDate(production.endDate)}
                  </p>
                </div>

                {/* 캐스팅 목록 */}
                {castByCharacter.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: '#4e5968' }}>캐스팅 목록</h3>
                    <div className="space-y-2.5">
                      {castByCharacter.map(({ char, actorNames }) => (
                        <div key={char.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-medium">{char.name}</span>
                          {actorNames.length > 0 ? (
                            <span className="font-semibold text-foreground">{actorNames.join(', ')}</span>
                          ) : (
                            <span className="text-gray-300 text-xs">미정</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 스태프 */}
                {production.staffs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: '#4e5968' }}>스태프</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(staffByRole).map(([role, names]) => (
                        <div key={role} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-xl">
                          <span className="text-xs text-gray-400">{role}</span>
                          <span className="text-xs font-semibold text-foreground">{names.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 공연 회차 탭 */}
            {activeTab === 'performances' && (
              <div>
                {sortedPerformances.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">등록된 공연 일정이 없어요</p>
                ) : (
                  <div className="space-y-2">
                    {sortedPerformances.map((perf, idx) => {
                      const isOpen = openPerformanceId === perf.id;
                      const allChars = musical?.characters ?? [];

                      return (
                        <div key={perf.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setOpenPerformanceId(isOpen ? null : perf.id)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-bold text-primary bg-primary/8 w-6 h-6 rounded-lg flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div className="text-left">
                                <span className="text-sm font-semibold text-foreground">
                                  {formatDateTime(perf.dateTime)}
                                </span>
                                {perf.location && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                    <FiMapPin size={10} />
                                    {perf.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {perf.castings.length}/{allChars.length} 캐스팅
                              </span>
                              <FiChevronDown
                                size={14}
                                className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="border-t border-gray-100 px-4 py-3">
                              {allChars.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-2">
                                  작품 캐릭터 정보가 없어요
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {allChars.map((char) => {
                                    const casting = perf.castings.find((c) => c.characterId === char.id);
                                    return (
                                      <div key={char.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 font-medium">{char.name}</span>
                                        {casting ? (
                                          <span className="font-semibold text-foreground">
                                            {getUserName(users, casting.userId)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-300 text-xs">미정</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {perf.castings
                                    .filter((c) => !allChars.find((ch) => ch.id === c.characterId))
                                    .map((c) => (
                                      <div key={c.characterId} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">캐릭터 #{c.characterId}</span>
                                        <span className="font-semibold text-foreground">
                                          {getUserName(users, c.userId)}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
