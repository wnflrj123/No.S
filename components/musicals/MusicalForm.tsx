'use client';

import { useState, useRef, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { Musical, MusicalScene, MusicalCharacter } from '@/types';
import { FiX, FiPlus, FiTrash2, FiChevronRight, FiChevronLeft } from 'react-icons/fi';

interface MusicalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingMusical?: Musical | null;
}

// ──────────────────────────────────────────────
// 변환 헬퍼
// ──────────────────────────────────────────────

function charsToTable(chars: MusicalCharacter[]): string[][] {
  const rows = chars.map((c) => [c.name, c.abbr ?? '', c.description]);
  return rows.length ? rows : [['', '', '']];
}

function tableToChars(rows: string[][]): MusicalCharacter[] {
  let id = 1;
  return rows
    .filter(([name]) => name.trim())
    .map(([name, abbr = '', desc = '']) => ({
      id: id++,
      name: name.trim(),
      abbr: abbr.trim() || undefined,
      description: desc.trim(),
    }));
}

function scenesToTable(scenes: MusicalScene[], allCharacters: MusicalCharacter[]): string[][] {
  const charMap = new Map(allCharacters.map((c) => [c.id, c.name]));
  const rows: string[][] = [];
  for (const scene of [...scenes].sort((a, b) => a.index - b.index)) {
    const nums = [...scene.numbers].sort((a, b) => a.index - b.index);
    if (nums.length === 0) {
      rows.push([`#${scene.index}`, scene.title, '', '', '']);
    } else {
      nums.forEach((num) => {
        const charNames = num.characters
          .map((id) => charMap.get(id) ?? '')
          .filter(Boolean)
          .join(',');
        rows.push([`#${scene.index}`, scene.title, `M${num.index}`, num.title, charNames]);
      });
    }
  }
  return rows.length ? rows : [['', '', '', '', '']];
}

/** 붙여넣기 후 씬 컬럼(0,1) 위에서 아래로 전파 (Excel 병합 셀 대응) */
function forwardFillSceneCols(rows: string[][]): string[][] {
  const result = rows.map((r) => [...r]);
  let lastScene = ['', ''];
  for (let r = 0; r < result.length; r++) {
    const col0 = result[r][0]?.trim() ?? '';
    const col2 = result[r][2]?.trim() ?? '';
    if (col0) {
      lastScene = [result[r][0], result[r][1] ?? ''];
    } else if (col2 && lastScene[0]) {
      result[r][0] = lastScene[0];
      result[r][1] = lastScene[1];
    }
  }
  return result;
}

/** 테이블 → 씬 구조 (col4 쉼표 구분 캐릭터 이름 → ID 매핑) */
function tableToScenes(rows: string[][], allCharacters: MusicalCharacter[]): MusicalScene[] {
  // 이름 또는 축약어로 ID 매핑
  const tokenToId = new Map<string, number>();
  for (const c of allCharacters) {
    tokenToId.set(c.name.trim().toLowerCase(), c.id);
    if (c.abbr) tokenToId.set(c.abbr.trim().toLowerCase(), c.id);
  }

  const scenes: MusicalScene[] = [];
  let currentScene: MusicalScene | null = null;
  let sceneIdSeq = 1;
  let numIdSeq = 1;

  for (const row of rows) {
    const col0 = row[0]?.trim() ?? '';
    const col1 = row[1]?.trim() ?? '';
    const col2 = row[2]?.trim() ?? '';
    const col3 = row[3]?.trim() ?? '';
    const col4 = row[4]?.trim() ?? '';

    if (!col2 && !col0) continue;

    if (col0) {
      const digits = col0.replace(/\D/g, '');
      const idx = digits ? parseInt(digits, 10) : scenes.length;
      if (!currentScene || currentScene.index !== idx) {
        currentScene = { id: sceneIdSeq++, index: idx, title: col1, numbers: [] };
        scenes.push(currentScene);
      }
    }

    if (currentScene && col2) {
      const digits = col2.replace(/\D/g, '');
      const numIdx = digits ? parseInt(digits, 10) : numIdSeq;
      const characters = col4
        ? col4
            .split(',')
            .map((n) => tokenToId.get(n.trim().toLowerCase()))
            .filter((id): id is number => id !== undefined)
        : [];
      currentScene.numbers.push({
        id: numIdSeq++,
        index: numIdx,
        title: col3,
        characters,
      });
    }
  }
  return scenes;
}

/** 한 줄(탭 구분 O마커 또는 쉼표 구분 이름/축약어)을 캐릭터 이름 CSV로 변환 */
function resolveCharLine(line: string, allCharacters: MusicalCharacter[]): string {
  if (line.includes('\t')) {
    // 타입 1: 열 위치 = allCharacters 순서, O/o인 경우만 선택
    const cols = line.split('\t');
    return allCharacters
      .filter((_, i) => cols[i]?.trim().toLowerCase() === 'o')
      .map((c) => c.name)
      .join(',');
  }
  // 타입 2: 쉼표 구분 이름/축약어
  const tokenToChar = new Map<string, MusicalCharacter>();
  for (const c of allCharacters) {
    tokenToChar.set(c.name.trim().toLowerCase(), c);
    if (c.abbr) tokenToChar.set(c.abbr.trim().toLowerCase(), c);
  }
  return line
    .split(',')
    .map((t) => tokenToChar.get(t.trim().toLowerCase())?.name)
    .filter((n): n is string => n !== undefined)
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .join(',');
}

// ──────────────────────────────────────────────
// 캐릭터 Chip 셀 (클릭 토글 + 붙여넣기 활성화)
// ──────────────────────────────────────────────
function CharacterChipCell({
  value,
  allCharacters,
  onChange,
  onMultiRowPaste,
}: {
  value: string;
  allCharacters: MusicalCharacter[];
  onChange: (val: string) => void;
  onMultiRowPaste?: (lines: string[]) => void;
}) {
  const selectedSet = new Set(
    value.split(',').map((n) => n.trim().toLowerCase()).filter(Boolean)
  );

  const toCanonical = (names: Set<string>) =>
    allCharacters
      .filter((c) => names.has(c.name.toLowerCase()))
      .map((c) => c.name)
      .join(',');

  const toggle = (charName: string) => {
    const lower = charName.toLowerCase();
    const next = new Set(selectedSet);
    if (next.has(lower)) next.delete(lower);
    else next.add(lower);
    onChange(toCanonical(next));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain').trim();
    if (!text) return;

    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);

    if (lines.length > 1 && onMultiRowPaste) {
      // 여러 행 → 상위에서 행별로 적용
      onMultiRowPaste(lines);
    } else {
      // 단일 행 → 현재 셀에만 적용
      onChange(resolveCharLine(lines[0] ?? '', allCharacters));
    }
  };

  return (
    <div
      className="px-2 py-1.5 flex flex-wrap gap-1 min-h-[34px] items-center outline-none focus:bg-primary/4 w-full"
      tabIndex={0}
      onPaste={handlePaste}
    >
      {allCharacters.length === 0 ? (
        <span className="text-[11px] text-gray-300">Step 1에서 캐릭터 등록</span>
      ) : (
        allCharacters.map((char) => {
          const selected = selectedSet.has(char.name.toLowerCase());
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => toggle(char.name)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors select-none ${
                selected
                  ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-500'
              }`}
            >
              {char.name}
            </button>
          );
        })
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// 공용 테이블 에디터
// ──────────────────────────────────────────────
interface TableEditorProps {
  rows: string[][];
  headers: string[];
  colWidths: string[];
  onChange: (rows: string[][]) => void;
  placeholder?: string[];
  renderCell?: (
    r: number,
    c: number,
    val: string,
    onCellChange: (val: string) => void
  ) => React.ReactNode | null;
}

function TableEditor({ rows, headers, colWidths, onChange, placeholder, renderCell }: TableEditorProps) {
  const numCols = headers.length;
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const focus = useCallback((r: number, c: number) => {
    inputRefs.current.get(`${r}-${c}`)?.focus();
  }, []);

  const update = (r: number, c: number, val: string) => {
    const next = rows.map((row) => [...row]);
    next[r][c] = val;
    onChange(next);
  };

  const addRow = () => {
    onChange([...rows, Array(numCols).fill('')]);
    setTimeout(() => focus(rows.length, 0), 50);
  };

  const removeRow = (r: number) => {
    const next = rows.filter((_, i) => i !== r);
    onChange(next.length ? next : [Array(numCols).fill('')]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (c > 0) focus(r, c - 1);
        else if (r > 0) focus(r - 1, numCols - 1);
      } else {
        if (c < numCols - 1) focus(r, c + 1);
        else {
          if (r === rows.length - 1) addRow();
          else focus(r + 1, 0);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (r === rows.length - 1) addRow();
      else focus(r + 1, c);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRow: number, startCol: number) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    e.preventDefault();

    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines[lines.length - 1] === '') lines.pop();

    const next = rows.map((row) => [...row]);
    for (let r = 0; r < lines.length; r++) {
      const cols = lines[r].split('\t');
      const targetRow = startRow + r;
      while (next.length <= targetRow) next.push(Array(numCols).fill(''));
      for (let c = 0; c < cols.length; c++) {
        const targetCol = startCol + c;
        if (targetCol < numCols) next[targetRow][targetCol] = cols[c];
      }
    }
    onChange(next);
  };

  // 'flex-1' 키워드: 남은 공간을 모두 차지 (마지막 열 밀림 방지)
  const cellStyle = (w: string): React.CSSProperties =>
    w === 'flex-1' ? { flex: 1, minWidth: 0 } : { width: w, flexShrink: 0 };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
      {/* 헤더 */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {headers.map((h, c) => (
          <div
            key={c}
            className="px-3 py-2 text-xs font-semibold text-gray-500 border-r border-gray-200 last:border-r-0"
            style={cellStyle(colWidths[c])}
          >
            {h}
          </div>
        ))}
        <div className="w-8 flex-shrink-0" />
      </div>

      {/* 데이터 행 */}
      {rows.map((row, r) => (
        <div
          key={r}
          className="flex items-center border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 group"
        >
          {row.map((val, c) => {
            const custom = renderCell?.(r, c, val, (v) => update(r, c, v));
            if (custom !== null && custom !== undefined) {
              return (
                <div
                  key={c}
                  className="border-r border-gray-100 last:border-r-0 self-stretch flex items-center"
                  style={cellStyle(colWidths[c])}
                >
                  {custom}
                </div>
              );
            }
            return (
              <input
                key={c}
                ref={(el) => {
                  if (el) inputRefs.current.set(`${r}-${c}`, el);
                  else inputRefs.current.delete(`${r}-${c}`);
                }}
                value={val}
                onChange={(e) => update(r, c, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, r, c)}
                onPaste={(e) => handlePaste(e, r, c)}
                placeholder={placeholder?.[c] ?? ''}
                className="px-3 py-2 bg-transparent outline-none focus:bg-primary/4 border-r border-gray-100 last:border-r-0 text-foreground placeholder:text-gray-300"
                style={cellStyle(colWidths[c])}
              />
            );
          })}
          <div className="w-8 flex-shrink-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => removeRow(r)}
              className="w-5 h-5 flex items-center justify-center text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <FiTrash2 size={11} />
            </button>
          </div>
        </div>
      ))}

      {/* 행 추가 */}
      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors border-t border-gray-100"
      >
        <FiPlus size={12} />
        행 추가
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 1: 기본 정보 + 캐릭터 테이블
// ──────────────────────────────────────────────
interface Step1Props {
  name: string;
  imageUrl: string;
  charRows: string[][];
  onNameChange: (v: string) => void;
  onImageChange: (v: string) => void;
  onCharRowsChange: (rows: string[][]) => void;
}

function Step1({ name, imageUrl, charRows, onNameChange, onImageChange, onCharRowsChange }: Step1Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
          작품명 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="예: 레미제라블, 오페라의 유령"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
          포스터 이미지 URL
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
        />
        {imageUrl && (
          <div className="mt-2 w-16 h-24 rounded-lg overflow-hidden border border-gray-100">
            <img
              src={imageUrl}
              alt="미리보기"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium" style={{ color: '#4e5968' }}>
            캐릭터 목록
          </label>
          <span className="text-[11px] text-gray-400">엑셀에서 복사 후 셀에 붙여넣기 가능</span>
        </div>
        <TableEditor
          rows={charRows}
          headers={['이름', '축약어', '설명']}
          colWidths={['30%', '20%', 'flex-1']}
          onChange={onCharRowsChange}
          placeholder={['장발장', '발장', '전직 죄수, 마들렌 시장']}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 2: 구성 테이블 (Scene / Number / Characters chip)
// ──────────────────────────────────────────────
interface Step2Props {
  structRows: string[][];
  allCharacters: MusicalCharacter[];
  onStructRowsChange: (rows: string[][]) => void;
}

function Step2({ structRows, allCharacters, onStructRowsChange }: Step2Props) {
  const handleStructChange = (rows: string[][]) => {
    const filled = forwardFillSceneCols(rows);
    onStructRowsChange(filled);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium" style={{ color: '#4e5968' }}>막/넘버 구성</label>
          <span className="text-[11px] text-gray-400">엑셀에서 복사 후 셀에 붙여넣기 가능</span>
        </div>
        <p className="text-[11px] text-gray-400 mb-2">
          같은 막의 다음 넘버는 Scene 열을 비워두세요. Characters 셀에 이름·축약어를 붙여넣거나 칩을 클릭하세요.
        </p>
        <TableEditor
          rows={structRows}
          headers={['Scene', 'Scene Title', 'Number', 'Number Title', 'Characters']}
          colWidths={['9%', '22%', '9%', '25%', 'flex-1']}
          onChange={handleStructChange}
          placeholder={['#1', 'At the End of the Day', 'M5', 'At the End of the Day', '']}
          renderCell={(r, c, val, onCellChange) => {
            if (c !== 4) return null;
            return (
              <CharacterChipCell
                value={val}
                allCharacters={allCharacters}
                onChange={onCellChange}
                onMultiRowPaste={(lines) => {
                  const dataLines = lines.slice(1); // 첫 번째 행(헤더) 무시
                  const next = structRows.map((row) => [...row]);
                  for (let i = 0; i < dataLines.length; i++) {
                    const targetRow = r + i;
                    while (next.length <= targetRow) next.push(['', '', '', '', '']);
                    next[targetRow][4] = resolveCharLine(dataLines[i], allCharacters);
                  }
                  handleStructChange(next);
                }}
              />
            );
          }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 메인: 스테퍼 컨테이너
// ──────────────────────────────────────────────
export default function MusicalForm({ onSuccess, onCancel, editingMusical }: MusicalFormProps) {
  const { user, isAdmin } = useAuth();
  const isEditing = !!editingMusical;

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(editingMusical?.name ?? '');
  const [imageUrl, setImageUrl] = useState(editingMusical?.imageUrl ?? '');
  const [charRows, setCharRows] = useState<string[][]>(
    () => charsToTable(editingMusical?.characters ?? [])
  );
  const [structRows, setStructRows] = useState<string[][]>(
    () => scenesToTable(editingMusical?.scenes ?? [], editingMusical?.characters ?? [])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!name.trim()) { setError('작품명을 입력해주세요'); return; }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!user || !isAdmin) { setError('운영진만 작품을 등록할 수 있어요'); return; }
    if (!name.trim()) { setError('작품명을 입력해주세요'); return; }

    setIsSubmitting(true);
    setError(null);
    try {
      const characters = tableToChars(charRows);
      const finalScenes = tableToScenes(structRows, characters);

      const payload = {
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        characters,
        scenes: finalScenes,
        updatedAt: Timestamp.now(),
      };

      if (isEditing && editingMusical) {
        await updateDoc(doc(db, 'musicals', editingMusical.id), payload);
      } else {
        await addDoc(collection(db, 'musicals'), {
          ...payload,
          createdBy: user.uid,
          createdByName: user.displayName || '익명',
          createdAt: Timestamp.now(),
        });
      }
      onSuccess?.();
    } catch (err) {
      console.error('작품 저장 실패:', err);
      setError('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 헤더 + 스테퍼 */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">
            {isEditing ? '작품 수정' : '작품 등록'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* 스테퍼 인디케이터 */}
        <div className="flex items-center gap-2">
          {(['기본정보 & 캐릭터', '구성 정보'] as const).map((label, idx) => {
            const n = idx + 1;
            return (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                      step === n ? 'bg-primary text-white' : step > n ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {n}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${step === n ? 'text-foreground' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {idx === 0 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 본문 */}
      <div className="px-5 py-4 overflow-y-auto max-h-[60vh]">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>
        )}
        {step === 1 ? (
          <Step1
            name={name}
            imageUrl={imageUrl}
            charRows={charRows}
            onNameChange={setName}
            onImageChange={setImageUrl}
            onCharRowsChange={setCharRows}
          />
        ) : (
          <Step2
            structRows={structRows}
            allCharacters={tableToChars(charRows)}
            onStructRowsChange={setStructRows}
          />
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
        {step === 1 ? (
          <>
            <button type="button" onClick={onCancel} className="px-5 py-3 bg-secondary text-foreground font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
              취소
            </button>
            <button type="button" onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm">
              다음 <FiChevronRight size={16} />
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 px-4 py-3 bg-secondary text-foreground font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
              <FiChevronLeft size={16} /> 이전
            </button>
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm">
              {isSubmitting ? '저장 중...' : isEditing ? '수정하기' : '등록하기'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
