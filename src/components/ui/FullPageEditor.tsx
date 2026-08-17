import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, Copy, Download, ChevronDown, Keyboard } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { Extension } from '@tiptap/core';

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

interface FullPageEditorProps {
  title: string;
  setTitle: (t: string) => void;
  content: string;
  setContent: (c: string) => void;
  category?: string;
  setCategory?: (c: string) => void;
  categoryType?: 'links' | 'notes' | 'tasks';
  onSave: (payload: { title: string; content: string; category: string }) => Promise<void>;
  onCancel: () => void;
  hideTitle?: boolean;
}

export const FullPageEditor: React.FC<FullPageEditorProps> = ({
  title, setTitle, content, setContent, category, setCategory, categoryType, onSave, onCancel, hideTitle = false
}) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontSize,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-400 no-underline hover:underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Placeholder.configure({
        placeholder: 'Start writing here...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      // Save HTML to content
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'w-full flex-1 bg-transparent border-none outline-none resize-none text-base md:text-lg leading-relaxed text-text-main min-h-[300px] prose prose-invert prose-blockquote:border-l-[3px] prose-blockquote:border-primary/50 prose-blockquote:bg-[rgba(255,255,255,0.02)] prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:my-4 prose-blockquote:text-muted max-w-none focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        if (!editor) return false;
        
        // Link: Ctrl/Cmd + K
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
           event.preventDefault();
           setLink();
           return true;
        }

        // Ordered List: Ctrl/Cmd + Shift + 7
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '7') {
           event.preventDefault();
           editor.chain().focus().toggleOrderedList().run();
           return true;
        }

        // Bullet List: Ctrl/Cmd + Shift + 8
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '8') {
           event.preventDefault();
           editor.chain().focus().toggleBulletList().run();
           return true;
        }

        // Blockquote: Ctrl/Cmd + Shift + 9
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '9') {
           event.preventDefault();
           editor.chain().focus().toggleBlockquote().run();
           return true;
        }

        // Font Size Increase/Decrease
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === '.' || event.key === '>')) {
           event.preventDefault();
           const currentSize = editor.getAttributes('textStyle').fontSize || '16px';
           const sizeVal = parseInt(currentSize);
           if (!isNaN(sizeVal)) {
              let nextSize = sizeVal;
              if (sizeVal < 14) nextSize = 14;
              else if (sizeVal < 16) nextSize = 16;
              else if (sizeVal < 18) nextSize = 18;
              else if (sizeVal < 20) nextSize = 20;
              else if (sizeVal < 24) nextSize = 24;
              else if (sizeVal < 32) nextSize = 32;
              (editor.chain().focus() as any).setFontSize(`${nextSize}px`).run();
           } else {
              (editor.chain().focus() as any).setFontSize('18px').run();
           }
           return true;
        }

        if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === ',' || event.key === '<')) {
           event.preventDefault();
           const currentSize = editor.getAttributes('textStyle').fontSize || '16px';
           const sizeVal = parseInt(currentSize);
           if (!isNaN(sizeVal)) {
              let nextSize = sizeVal;
              if (sizeVal > 24) nextSize = 24;
              else if (sizeVal > 20) nextSize = 20;
              else if (sizeVal > 18) nextSize = 18;
              else if (sizeVal > 16) nextSize = 16;
              else if (sizeVal > 14) nextSize = 14;
              else if (sizeVal > 12) nextSize = 12;
              
              if (nextSize <= 16) {
                 (editor.chain().focus() as any).unsetFontSize().run();
              } else {
                 (editor.chain().focus() as any).setFontSize(`${nextSize}px`).run();
              }
           }
           return true;
        }

        return false;
      }
    },
  });

  const initialDataRef = useRef({ title, content, category: category || '' });
  const isDirty = title !== initialDataRef.current.title || content !== initialDataRef.current.content || category !== initialDataRef.current.category;

  const currentDataRef = useRef({ title, content, category: category || '' });
  
  useEffect(() => {
    currentDataRef.current = { title, content, category: category || '' };
  }, [title, content, category]);

  const triggerSave = async () => {
    if (!currentDataRef.current.title.trim() && !currentDataRef.current.content.trim()) return;
    
    setSaveStatus('saving');
    try {
      await onSave(currentDataRef.current);
      initialDataRef.current = currentDataRef.current;
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
    }
  };

  const handleCopy = async () => {
    if (!editor) return;
    try {
      await navigator.clipboard.writeText(editor.getText());
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleDownload = () => {
    if (!editor) return;
    const textContent = editor.getText();
    const fileName = (title.trim() || (hideTitle ? 'temporary-note' : 'note')).replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.txt';
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    if (url === null) return;
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    let validUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      validUrl = 'https://' + url;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: validUrl }).run();
  };

  // Autosave
  useEffect(() => {
    if (!isDirty) return;
    
    const handler = setTimeout(() => {
      triggerSave();
    }, 1500);

    return () => clearTimeout(handler);
  }, [title, content, category, isDirty]);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        triggerSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full h-full animate-in fade-in z-10 md:p-6 lg:p-8">
      <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] shadow-[0_8px_40px_rgba(0,0,0,0.12)] rounded-3xl overflow-hidden relative backdrop-blur-2xl">
      <header className="sticky top-0 w-full z-10 flex items-center justify-between px-4 md:px-8 py-4 bg-[rgba(255,255,255,0.01)] backdrop-blur-md">
        <button 
          onClick={onCancel}
          className="flex items-center gap-2 text-muted hover:text-text-main transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-2">
             <button 
               onClick={handleCopy}
               className="p-2 text-muted hover:text-text-main transition-colors flex items-center gap-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[rgba(255,255,255,0.1)] text-xs font-medium"
               title="Copy to clipboard"
             >
               {copyStatus === 'copied' ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
               <span className="hidden sm:inline">{copyStatus === 'copied' ? 'Copied' : 'Copy'}</span>
             </button>
             <button 
               onClick={handleDownload}
               className="p-2 text-muted hover:text-text-main transition-colors flex items-center gap-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[rgba(255,255,255,0.1)] text-xs font-medium"
               title="Download as TXT"
             >
               <Download size={16} />
               <span className="hidden sm:inline">Download TXT</span>
             </button>
          </div>

          {isDirty && saveStatus === 'idle' && <span className="text-xs text-muted">Unsaved changes</span>}
          {saveStatus === 'saving' && <span className="flex items-center gap-1.5 text-xs text-muted"><Loader2 size={12} className="animate-spin" /> Saving...</span>}
          {saveStatus === 'saved' && <span className="flex items-center gap-1.5 text-xs text-green-500"><CheckCircle2 size={12} /> Saved</span>}
          {saveStatus === 'error' && <span className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle size={12} /> Error saving</span>}
          
          <button 
            onClick={triggerSave}
            disabled={saveStatus === 'saving' || (!isDirty && saveStatus !== 'error')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-hover transition-all disabled:opacity-50 shadow-sm shadow-primary/20"
          >
            <Save size={16} /> {saveStatus === 'saving' ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-8 md:py-12 flex flex-col">
        <div className="max-w-3xl mx-auto w-full flex flex-col flex-1">
          {categoryType && setCategory && (
            <div className="mb-6">
              <CategorySelector type={categoryType} value={category || 'General'} onChange={setCategory} />
            </div>
          )}
          {!hideTitle && (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Note"
              autoFocus
              className="w-full bg-transparent text-3xl md:text-4xl font-bold border-none outline-none placeholder:text-muted/50 text-text-main mb-6 py-2"
            />
          )}

          {/* Markdown Toolbar */}
          {editor && (
             <div className="flex items-center gap-1.5 pb-4 mb-4 border-b border-border/50 text-muted overflow-x-auto scrollbar-hide snap-x">
               <div className="flex items-center gap-1.5 min-w-max snap-start">
                 <select 
                   onChange={(e) => {
                     if (e.target.value) {
                       (editor.chain().focus() as any).setFontSize(e.target.value).run();
                     } else {
                       (editor.chain().focus() as any).unsetFontSize().run();
                     }
                   }}
                   className="bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] text-sm border border-border/50 rounded-lg px-2 py-1.5 outline-none mr-1 transition-colors"
                 >
                   <option value="">Size</option>
                   <option value="12px">12px</option>
                   <option value="14px">14px</option>
                   <option value="16px">16px</option>
                   <option value="18px">18px</option>
                   <option value="20px">20px</option>
                   <option value="24px">24px</option>
                   <option value="32px">32px</option>
                 </select>
                 
                 <select
                   onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                   className="bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] text-sm border border-border/50 rounded-lg px-2 py-1.5 outline-none transition-colors"
                 >
                   <option value="">Text Color</option>
                   <option value="#F5F7FA">Default</option>
                   <option value="#A7ADB8">Gray</option>
                   <option value="#F87171">Red</option>
                   <option value="#FB923C">Orange</option>
                   <option value="#FACC15">Yellow</option>
                   <option value="#4ADE80">Green</option>
                   <option value="#60A5FA">Blue</option>
                   <option value="#C084FC">Purple</option>
                 </select>

                 <select
                   onChange={(e) => {
                     if (e.target.value) {
                       editor.chain().focus().setHighlight({ color: e.target.value }).run();
                     } else {
                       editor.chain().focus().unsetHighlight().run();
                     }
                   }}
                   className="bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] text-sm border border-border/50 rounded-lg px-2 py-1.5 outline-none mr-2 transition-colors"
                 >
                   <option value="">Highlight</option>
                   <option value="transparent">None</option>
                   <option value="rgba(167, 173, 184, 0.2)">Gray</option>
                   <option value="rgba(248, 113, 113, 0.2)">Red</option>
                   <option value="rgba(250, 204, 21, 0.2)">Yellow</option>
                   <option value="rgba(74, 222, 128, 0.2)">Green</option>
                   <option value="rgba(96, 165, 250, 0.2)">Blue</option>
                   <option value="rgba(192, 132, 252, 0.2)">Purple</option>
                 </select>
               </div>

               <div className="flex items-center gap-1.5 min-w-max snap-start">
                 <div className="w-px h-4 bg-border mx-1" />
                 <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }} className={`w-8 h-8 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] hover:text-text-main rounded-lg transition-colors text-sm font-bold ${editor.isActive('bold') ? 'bg-[var(--primary-soft)] text-primary' : ''}`}>B</button>
                 <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }} className={`w-8 h-8 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] hover:text-text-main rounded-lg transition-colors text-sm italic ${editor.isActive('italic') ? 'bg-[var(--primary-soft)] text-primary' : ''}`}>I</button>
                 <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }} className={`w-8 h-8 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] hover:text-text-main rounded-lg transition-colors text-sm underline ${editor.isActive('underline') ? 'bg-[var(--primary-soft)] text-primary' : ''}`}>U</button>
                 <button type="button" onMouseDown={(e) => { e.preventDefault(); setLink(); }} className={`px-2.5 h-8 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] hover:text-text-main rounded-lg transition-colors text-sm font-medium ${editor.isActive('link') ? 'bg-[var(--primary-soft)] text-primary' : ''}`}>Link</button>
               </div>
               
               <div className="flex items-center gap-1.5 min-w-max snap-start">
                 <div className="w-px h-4 bg-border mx-1" />
                 <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }} className={`w-8 h-8 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] hover:text-text-main rounded-lg transition-colors text-sm ${editor.isActive('bulletList') ? 'bg-[var(--primary-soft)] text-primary' : ''}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                 </button>
                 <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }} className={`w-8 h-8 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] hover:text-text-main rounded-lg transition-colors text-sm ${editor.isActive('orderedList') ? 'bg-[var(--primary-soft)] text-primary' : ''}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
                 </button>
                 <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }} className={`w-8 h-8 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] hover:text-text-main rounded-lg transition-colors text-sm ${editor.isActive('blockquote') ? 'bg-[var(--primary-soft)] text-primary' : ''}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path></svg>
                 </button>
                 <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }} className={`w-8 h-8 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] hover:text-text-main rounded-lg transition-colors text-sm flex items-center gap-1`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                 </button>
               </div>

               <div className="ml-auto relative group flex shrink-0 items-center pl-2">
                  <button className="p-1.5 text-muted hover:text-text-main transition-colors rounded hover:bg-card">
                     <Keyboard size={16} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl bg-[rgba(20,24,32,0.95)] border border-border shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-xs text-muted pointer-events-none">
                     <div className="font-semibold text-text-main mb-2">Keyboard Shortcuts</div>
                     <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5">
                       <span>Bold</span><kbd className="font-mono bg-[rgba(255,255,255,0.1)] px-1 rounded">⌘/⌃ B</kbd>
                       <span>Italic</span><kbd className="font-mono bg-[rgba(255,255,255,0.1)] px-1 rounded">⌘/⌃ I</kbd>
                       <span>Underline</span><kbd className="font-mono bg-[rgba(255,255,255,0.1)] px-1 rounded">⌘/⌃ U</kbd>
                       <span>Link</span><kbd className="font-mono bg-[rgba(255,255,255,0.1)] px-1 rounded">⌘/⌃ K</kbd>
                       <span>Numbered list</span><kbd className="font-mono bg-[rgba(255,255,255,0.1)] px-1 rounded">⌘/⌃ ⇧ 7</kbd>
                       <span>Bulleted list</span><kbd className="font-mono bg-[rgba(255,255,255,0.1)] px-1 rounded">⌘/⌃ ⇧ 8</kbd>
                       <span>Quote</span><kbd className="font-mono bg-[rgba(255,255,255,0.1)] px-1 rounded">⌘/⌃ ⇧ 9</kbd>
                       <span>Size Up</span><kbd className="font-mono bg-[rgba(255,255,255,0.1)] px-1 rounded">⌘/⌃ ⇧ .</kbd>
                       <span>Size Down</span><kbd className="font-mono bg-[rgba(255,255,255,0.1)] px-1 rounded">⌘/⌃ ⇧ ,</kbd>
                     </div>
                  </div>
               </div>
             </div>
          )}

          <div className="flex-1 cursor-text" onClick={() => editor?.commands.focus()}>
             <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
