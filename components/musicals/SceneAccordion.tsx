'use client';

import { useState } from 'react';
import { MusicalScene, MusicalCharacter } from '@/types';
import { FiChevronDown } from 'react-icons/fi';

interface SceneAccordionProps {
  scene: MusicalScene;
  allCharacters: MusicalCharacter[];
}

export default function SceneAccordion({ scene, allCharacters }: SceneAccordionProps) {
  const [open, setOpen] = useState(false);

  const sortedNumbers = [...scene.numbers].sort((a, b) => a.index - b.index);

  const getChar = (id: number) => allCharacters.find((c) => c.id === id);

  return (
    <div className="bg-white rounded-xl border border-gray-100 border-l-[3px] border-l-primary overflow-hidden">
      {/* Scene 헤더 */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-primary/60 bg-primary/8 px-2 py-0.5 rounded-full">
            #{scene.index}
          </span>
          <span className="text-sm font-semibold text-foreground">{scene.title}</span>
        </div>
        <FiChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Number 목록 (아코디언 콘텐츠) */}
      <div
        className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-2 space-y-2 bg-gray-50/50">
            {sortedNumbers.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">등록된 넘버가 없어요</p>
            ) : (
              sortedNumbers.map((number) => (
                <div key={number.id} className="bg-white rounded-lg border border-gray-100 px-3 py-2.5">
                  {/* Number 행 */}
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-primary/50 mt-0.5 flex-shrink-0">
                      M{number.index}
                    </span>
                    <span className="text-sm font-medium text-foreground">{number.title}</span>
                  </div>

                  {/* Character 칩 목록 */}
                  {number.characters.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 ml-5">
                      {number.characters.map((charId) => {
                        const char = getChar(charId);
                        if (!char) return null;
                        return (
                          <div key={charId} className="relative group">
                            <span className="inline-block px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 cursor-default select-none">
                              {char.name}
                            </span>
                            {/* description 툴팁 */}
                            {char.description && (
                              <div className="absolute bottom-full left-0 mb-1.5 z-10 invisible group-hover:visible group-focus-within:visible pointer-events-none">
                                <div className="bg-gray-800 text-white text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap max-w-48 shadow-lg">
                                  {char.description}
                                  <div className="absolute top-full left-3 border-4 border-transparent border-t-gray-800" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
