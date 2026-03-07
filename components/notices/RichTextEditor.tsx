'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontSize as TiptapFontSize } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useState, useRef, useEffect } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiList,
  FiType,
} from 'react-icons/fi';
import { RiStrikethrough, RiFontSize } from 'react-icons/ri';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const COLORS = [
  { label: '기본', value: '#4e5968' },
  { label: '검정', value: '#191f28' },
  { label: '빨강', value: '#e53e3e' },
  { label: '파랑', value: '#3182f6' },
  { label: '초록', value: '#38a169' },
  { label: '주황', value: '#f59e0b' },
  { label: '보라', value: '#8b5cf6' },
  { label: '회색', value: '#8b95a1' },
];

const FONT_SIZES = [
  { label: '작게', size: '12px' },
  { label: '보통', size: '14px' },
  { label: '크게', size: '16px' },
  { label: '더 크게', size: '20px' },
];

export default function RichTextEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요',
}: RichTextEditorProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [openDropdown, setOpenDropdown] = useState<'fontSize' | 'color' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      TextStyle,
      TiptapFontSize,
      Color,
      Underline,
      TextAlign.configure({
        types: ['paragraph'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[160px] px-4 py-3 focus:outline-none text-sm leading-relaxed',
      },
    },
  });

  if (!editor) return null;

  const ToolButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div ref={dropdownRef} className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50">
        {/* Font Size */}
        <div className="relative">
          <button
            type="button"
            title="글자 크기"
            onClick={() => setOpenDropdown(openDropdown === 'fontSize' ? null : 'fontSize')}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              openDropdown === 'fontSize'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <RiFontSize size={16} />
          </button>
          {openDropdown === 'fontSize' && (
            <div className="absolute left-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl py-1.5 z-20 min-w-[120px]">
              <p className="text-[11px] font-medium text-gray-400 px-3 mb-1">글자 크기</p>
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.size}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setFontSize(fs.size).run();
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                  style={{ fontSize: fs.size, color: '#4e5968' }}
                >
                  {fs.label}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetFontSize().run();
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-gray-400"
                >
                  초기화
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Text Formatting */}
        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="굵게 (Ctrl+B)"
        >
          <FiBold size={15} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="기울임 (Ctrl+I)"
        >
          <FiItalic size={15} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="밑줄 (Ctrl+U)"
        >
          <FiUnderline size={15} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="취소선 (Ctrl+Shift+S)"
        >
          <RiStrikethrough size={15} />
        </ToolButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            title="글자 색상"
            onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              openDropdown === 'color'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <FiType size={15} />
            <span
              className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-1 rounded-full"
              style={{
                backgroundColor:
                  editor.getAttributes('textStyle').color || '#4e5968',
              }}
            />
          </button>
          {openDropdown === 'color' && (
            <div className="absolute left-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl p-3 z-20 min-w-[180px]">
              <p className="text-[11px] font-medium text-gray-400 mb-2">글자 색상</p>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(c.value).run();
                      setOpenDropdown(null);
                    }}
                    title={c.label}
                    className="w-9 h-9 rounded-xl border-2 border-gray-100 hover:scale-110 hover:border-gray-300 transition-all"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <div className="border-t border-gray-100 mt-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className="w-full text-xs text-center py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  직접 선택
                </button>
              </div>
              <input
                ref={colorInputRef}
                type="color"
                className="sr-only"
                onChange={(e) => {
                  editor.chain().focus().setColor(e.target.value).run();
                  setOpenDropdown(null);
                }}
              />
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Text Align */}
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="왼쪽 정렬"
        >
          <FiAlignLeft size={15} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="가운데 정렬"
        >
          <FiAlignCenter size={15} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="오른쪽 정렬"
        >
          <FiAlignRight size={15} />
        </ToolButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* List */}
        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="목록"
        >
          <FiList size={15} />
        </ToolButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
