'use client';

import { Musical } from '@/types';
import SceneAccordion from './SceneAccordion';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface MusicalDetailProps {
  musical: Musical;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MusicalDetail({ musical, isAdmin, onEdit, onDelete }: MusicalDetailProps) {
  const sortedScenes = [...musical.scenes].sort((a, b) => a.index - b.index);
  const allCharacters = musical.characters ?? [];

  return (
    <div className="animate-fade-in-up">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{musical.name}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {sortedScenes.length}막 &middot; {sortedScenes.reduce((acc, s) => acc + s.numbers.length, 0)}넘버
            {allCharacters.length > 0 && ` · ${allCharacters.length}캐릭터`}
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

      {/* Scene 아코디언 목록 */}
      {sortedScenes.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          등록된 막/장이 없어요
        </div>
      ) : (
        <div className="space-y-2">
          {sortedScenes.map((scene) => (
            <SceneAccordion
              key={scene.id}
              scene={scene}
              allCharacters={allCharacters}
            />
          ))}
        </div>
      )}
    </div>
  );
}
