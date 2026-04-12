'use client';

import { Production, Musical, User, STAFF_ROLE_LABELS, StaffRole } from '@/types';
import { FiEdit2, FiTrash2, FiChevronDown, FiMapPin, FiCalendar, FiUsers } from 'react-icons/fi';
import { useState } from 'react';

interface ProductionDetailProps {
  production: Production;
  musical: Musical | undefined;
  users: User[];
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function getUserName(users: User[], uid: string) {
  const u = users.find((u) => u.uid === uid);
  return u?.customName || u?.displayName || uid;
}

function formatDateTime(dt: string) {
  const [date, time] = dt.split('T');
  const [y, m, d] = date.split('-');
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일${time ? ` ${time}` : ''}`;
}

export default function ProductionDetail({
  production,
  musical,
  users,
  isAdmin,
  onEdit,
  onDelete,
}: ProductionDetailProps) {
  const [openPerformanceId, setOpenPerformanceId] = useState<string | null>(
    production.performances[0]?.id ?? null
  );

  const sortedPerformances = [...production.performances].sort((a, b) =>
    a.dateTime.localeCompare(b.dateTime)
  );

  // role별 그룹핑
  const staffByRole = production.staffs.reduce<Record<string, string[]>>((acc, s) => {
    const label = STAFF_ROLE_LABELS[s.role as StaffRole] ?? s.role;
    if (!acc[label]) acc[label] = [];
    acc[label].push(getUserName(users, s.userId));
    return acc;
  }, {});

  return (
    <div className="animate-fade-in-up">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          {musical && (
            <span className="inline-block px-2 py-0.5 bg-primary/8 text-primary text-xs font-medium rounded-lg mb-1.5">
              {musical.name}
            </span>
          )}
          <h2 className="text-xl font-bold text-foreground">{production.name}</h2>
          {production.description && (
            <p className="text-sm text-gray-400 mt-0.5">{production.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {production.startDate} ~ {production.endDate}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-1 ml-2 flex-shrink-0">
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

      {/* 스태프 */}
      {production.staffs.length > 0 && (
        <div className="mb-5">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            <FiUsers size={12} />
            스태프
          </h3>
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

      {/* 공연 일정 */}
      <div>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
          <FiCalendar size={12} />
          공연 일정 ({sortedPerformances.length}회)
        </h3>

        {sortedPerformances.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">등록된 공연 일정이 없어요</p>
        ) : (
          <div className="space-y-2">
            {sortedPerformances.map((perf, idx) => {
              const isOpen = openPerformanceId === perf.id;
              const castedCharIds = perf.castings.map((c) => c.characterId);
              const allChars = musical?.characters ?? [];

              return (
                <div key={perf.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* 날짜 헤더 (클릭으로 토글) */}
                  <button
                    onClick={() => setOpenPerformanceId(isOpen ? null : perf.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-primary bg-primary/8 w-6 h-6 rounded-lg flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
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

                  {/* 캐스팅 테이블 */}
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
                              <div
                                key={char.id}
                                className="flex items-center justify-between text-sm"
                              >
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
                          {/* 작품 characters에 없는 캐스팅 (혹시 있을 경우 보조 표시) */}
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
    </div>
  );
}
