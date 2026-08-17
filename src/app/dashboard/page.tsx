import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Loader2, Plus, FolderPlus, Mic, X, Square, ArrowRight, ListTodo, FileText, Link2, Sparkles, Clock } from 'lucide-react';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';
import { useUserCollection } from '../../hooks/useUserCollection';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { classifyInput } from '../../lib/classify';

type ChatbotMode = 'default' | 'creating_category_select_type' | 'creating_category_enter_name';

export const DashboardHome = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { add: addCategory } = useFirestoreActions('categories');
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [mode, setMode] = useState<ChatbotMode>('default');
  const [pendingCategoryType, setPendingCategoryType] = useState<'links' | 'notes' | 'tasks' | null>(null);

  const { data: tasks = [], loading: tasksLoading } = useUserCollection<any>('tasks');
  const { data: notes = [], loading: notesLoading } = useUserCollection<any>('notes');
  const { data: links = [], loading: linksLoading } = useUserCollection<any>('links');
  const { data: tempNotes = [], loading: tempNotesLoading } = useUserCollection<any>('temporaryNotes');

  const upcomingTasks = tasks.filter((t: any) => t.status && t.status !== 'done').slice(0, 3);

  const [micLanguage, setMicLanguage] = useState('id-ID'); // default id-ID
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    status: speechStatus,
    isSupported: isSpeechSupported,
    errorMessage: sttError,
    setErrorMessage: setSttError,
    startListening,
    stopListening
  } = useSpeechToText({
    language: micLanguage,
    onTranscriptReady: (transcript) => {
      setInput((prev) => (prev ? prev + ' ' : '') + transcript);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  });

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    if (mode === 'creating_category_enter_name') {
      await handleCreateCategorySubmit(input.trim());
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await classifyInput(user.uid, input.trim(), 'chatbot');
      setResult(data);
      if (data.status === 'success') {
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error('Failed to capture:', err);
      setResult({ status: 'error', message: 'Failed to classify input.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCategoryCreation = () => {
    setMode('creating_category_select_type');
    setResult(null);
  };

  const handleSelectCategoryType = (type: 'links' | 'notes' | 'tasks') => {
    setPendingCategoryType(type);
    setMode('creating_category_enter_name');
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCreateCategorySubmit = async (name: string) => {
    if (!name || !pendingCategoryType) return;
    setLoading(true);
    try {
      await addCategory({
        name,
        type: pendingCategoryType
      });
      const typeStr = pendingCategoryType.charAt(0).toUpperCase() + pendingCategoryType.slice(1);
      setResult({
        status: 'success',
        message: `Category "${name}" successfully created for ${typeStr}.`,
        action: () => navigate(`/dashboard/${pendingCategoryType !== 'links' ? pendingCategoryType : 'links'}`)
      });
      setMode('default');
      setPendingCategoryType(null);
      setInput('');
    } catch (e) {
      console.error(e);
      setResult({ status: 'error', message: 'Failed to create category.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMode = () => {
    setMode('default');
    setPendingCategoryType(null);
    setInput('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full pb-28 md:pb-8">
      {/* Decorative blurred background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
        
        <div className="relative overflow-hidden premium-card p-6 md:p-8 rounded-3xl z-0 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 -z-10" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3 -z-10" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-main flex items-center gap-3">
                Good to see you, {profile?.displayName?.split(' ')[0] || 'there'} <Sparkles className="text-primary/70" size={24} />
              </h1>
              <p className="text-muted/90 mt-2 text-lg">Capture your thoughts. Let AI organize them for you.</p>
            </div>
            
            {mode === 'default' && (
              <div className="flex gap-2">
                <button 
                  onClick={handleStartCategoryCreation}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-text-main transition-all rounded-xl shadow-sm border border-white/[0.05]"
                >
                  <FolderPlus size={18} className="text-primary/80" /> <span className="font-medium font-sm">Category</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {mode === 'creating_category_select_type' && (
          <div className="p-6 premium-card animate-in fade-in slide-in-from-top-2 border-[var(--primary)] border-opacity-30">
            <h3 className="font-medium mb-4 flex items-center gap-2 text-text-main"><Bot className="text-primary" size={20}/> Where do you want to create this category?</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handleSelectCategoryType('links')} className="px-5 py-2.5 premium-btn premium-btn-secondary">Links</button>
              <button onClick={() => handleSelectCategoryType('notes')} className="px-5 py-2.5 premium-btn premium-btn-secondary">Notes</button>
              <button onClick={() => handleSelectCategoryType('tasks')} className="px-5 py-2.5 premium-btn premium-btn-secondary">Tasks</button>
              <button onClick={handleCancelMode} className="px-5 py-2.5 text-muted hover:text-text-main text-sm font-medium transition-colors ml-auto">Cancel</button>
            </div>
          </div>
        )}

        {/* Conversational Capture Box */}
        {(mode === 'default' || mode === 'creating_category_enter_name') && (
          <section className={`premium-card p-1 focus-within:ring-2 ring-primary/20 transition-all ${loading ? 'border-primary/50 shadow-lg shadow-primary/5' : mode !== 'default' ? 'border-primary/50 ring-2 ring-primary/10' : ''}`}>
            {speechStatus !== 'idle' ? (
              <div className="flex flex-col gap-2 p-3 min-h-[64px] justify-center animate-in fade-in">
                {sttError ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-400">{sttError}</span>
                    <button onClick={() => setSttError(null)} className="text-muted hover:text-text-main"><X size={16} /></button>
                  </div>
                ) : speechStatus === 'stopping' || speechStatus === 'processing' ? (
                  <div className="flex items-center gap-2 text-primary justify-center text-sm font-medium w-full py-2">
                     <Loader2 size={18} className="animate-spin" />
                     {micLanguage === 'id-ID' ? 'Memproses...' : 'Processing...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-4 pl-2 flex-1">
                      <div className="flex gap-1.5 items-center h-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div 
                            key={i} 
                            className="w-1 bg-[var(--primary)] rounded-full animate-bounce"
                            style={{ 
                              height: `${Math.random() * 18 + 6}px`,
                              animationDelay: `${i * 0.12}s`,
                              animationDuration: '0.7s'
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-primary flex-1">
                        {micLanguage === 'id-ID' ? 'Mendengarkan...' : 'Listening...'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={stopListening}
                      className="w-10 h-10 flex items-center justify-center shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors"
                    >
                      <Square size={16} className="fill-current" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCapture} className="flex flex-col gap-2 p-2">
                <textarea 
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'creating_category_enter_name' ? `Enter category name for ${pendingCategoryType}...` : "Paste a link, note a thought, or add a task..."}
                  className="w-full bg-transparent resize-none outline-none p-4 text-text-main placeholder:text-muted/60 min-h-[90px] overflow-hidden leading-relaxed text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCapture(e as any);
                    }
                    if (e.key === 'Escape' && mode !== 'default') {
                      handleCancelMode();
                    }
                  }}
                  disabled={loading}
                />
                <div className="flex justify-between items-center px-3 pb-2 pt-1">
                  <div className="flex items-center gap-2 text-xs text-muted font-medium">
                    {mode === 'default' ? (
                      <>
                        <Bot size={16} className={loading ? "animate-pulse text-primary" : ""} /> 
                        {loading ? (
                          <span className="flex items-center gap-1 text-primary">
                            Thinking <span className="flex"><span className="animate-pulse-dot">.</span><span className="animate-pulse-dot">.</span><span className="animate-pulse-dot">.</span></span>
                          </span>
                        ) : "AI Auto-Classification"}
                      </>
                    ) : (
                      <>
                        <FolderPlus size={16} className="text-primary" />
                        <span className="text-primary">Creating Category • Press Esc to cancel</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      value={micLanguage} 
                      onChange={(e) => setMicLanguage(e.target.value)}
                      className="bg-transparent border border-border/50 hover:border-border text-xs text-muted rounded-lg p-2 outline-none cursor-pointer transition-colors"
                      title="Voice Language"
                    >
                      <option value="id-ID">ID</option>
                      <option value="en-US">EN</option>
                    </select>
                    <button 
                      type="button"
                      onClick={startListening}
                      className="p-3 text-muted hover:text-primary transition-colors flex items-center justify-center rounded-xl bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[rgba(255,255,255,0.1)]"
                      title="Dictate message"
                    >
                      <Mic size={20} />
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="premium-btn premium-btn-primary p-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20 flex items-center justify-center rounded-xl"
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Capture Result Feedback */}
        {result && (
          <div className={`p-5 premium-card animate-fade-up transition-all ${result.status === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-500' : 'bg-[var(--primary-soft)] border-primary/20 text-text-main'}`}>
            {result.status === 'error' ? (
              <p className="text-sm font-medium">{result.message}</p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-sm font-bold text-green-600 dark:text-green-500 uppercase tracking-wider text-[11px]">
                      {result.detectedType 
                        ? `Saved as ${result.count > 1 ? result.count + ' ' : ''}${result.detectedType.replace('_', ' ')}${result.count > 1 ? 's' : ''}` 
                        : 'Success'}
                    </p>
                  </div>
                  {result.action && (
                    <button onClick={result.action} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                      View <ArrowRight size={14} />
                    </button>
                  )}
                </div>
                {result.message ? (
                  <p className="font-medium text-lg leading-snug">{result.message}</p>
                ) : (
                  <>
                    {result.data?.items ? (
                      <div className="flex flex-col gap-2 mt-2">
                        {result.data.items.map((it: any, idx: number) => (
                           <p key={idx} className="font-semibold text-sm truncate hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/links`)}>
                             • {it.url}
                           </p>
                        ))}
                      </div>
                    ) : (
                      <>
                        {result.data?.title && <p className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/${result.savedCollection.toLowerCase()}`)}>{result.data.title}</p>}
                        {(result.data?.content || result.data?.description) && (
                          <p className="text-muted text-sm leading-relaxed mt-1 line-clamp-3">
                            {result.data.content || result.data.description}
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div onClick={() => navigate('/dashboard/notes')} className="premium-card p-5 cursor-pointer group flex flex-col gap-3 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <div>
              {notesLoading ? <Skeleton className="h-8 w-12 mb-1" /> : <p className="text-2xl font-bold">{notes.length}</p>}
              <p className="text-sm text-muted font-medium">Notes</p>
            </div>
          </div>
          <div onClick={() => navigate('/dashboard/tasks')} className="premium-card p-5 cursor-pointer group flex flex-col gap-3 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ListTodo size={20} />
            </div>
            <div>
              {tasksLoading ? <Skeleton className="h-8 w-12 mb-1" /> : <p className="text-2xl font-bold">{tasks.length}</p>}
              <p className="text-sm text-muted font-medium">Tasks</p>
            </div>
          </div>
          <div onClick={() => navigate('/dashboard/links')} className="premium-card p-5 cursor-pointer group flex flex-col gap-3 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Link2 size={20} />
            </div>
            <div>
              {linksLoading ? <Skeleton className="h-8 w-12 mb-1" /> : <p className="text-2xl font-bold">{links.length}</p>}
              <p className="text-sm text-muted font-medium">Saved Links</p>
            </div>
          </div>
          <div onClick={() => navigate('/dashboard/temporary-notes')} className="premium-card p-5 cursor-pointer group flex flex-col gap-3 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles size={20} />
            </div>
            <div>
              {tempNotesLoading ? <Skeleton className="h-8 w-12 mb-1" /> : <p className="text-2xl font-bold">{tempNotes.length}</p>}
              <p className="text-sm text-muted font-medium">Quick Temp</p>
            </div>
          </div>
        </div>

        {(tasksLoading || upcomingTasks.length > 0) && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock size={18} className="text-primary" /> Active Tasks
              </h3>
              <button onClick={() => navigate('/dashboard/tasks')} className="text-sm text-primary hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tasksLoading ? (
                <>
                  <Skeleton className="h-[72px] w-full" />
                  <Skeleton className="h-[72px] w-full" />
                  <Skeleton className="h-[72px] w-full" />
                </>
              ) : (
                upcomingTasks.map((task: any) => (
                  <div key={task.id} className="premium-card p-4 hover:border-primary/30 transition-colors">
                    <p className="font-medium text-sm line-clamp-2">{task.title}</p>
                    <p className="text-xs text-muted mt-2 capitalize">{task.status ? task.status.replace('-', ' ') : 'To DO'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
