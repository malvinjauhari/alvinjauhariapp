import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, FileJson, Loader2, CheckCircle2 } from 'lucide-react';
import { collection, getDocs, writeBatch, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { ContentHeader } from '../../../components/layout/ContentHeader';

export const DataManagementPage = () => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'ready' | 'importing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');
  const [importData, setImportData] = useState<any>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const collectionsToExport = ['links', 'notes', 'tasks', 'temporaryNotes', 'categories', 'sections'];

  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const data: Record<string, any> = {};
      
      for (const colName of collectionsToExport) {
        const querySnapshot = await getDocs(collection(db, 'users', user.uid, colName));
        data[colName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Add profile/settings if they exist at users/{uid}
      const pDoc = await getDoc(doc(db, 'users', user.uid));
      if (pDoc.exists()) {
          data.profile = pDoc.data();
      }

      const exportObj = {
        app: "Alvin Jauhari App",
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        userId: user.uid,
        data
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alvin-app-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('validating');
    setImportError('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.app !== "Alvin Jauhari App" || !json.exportVersion || !json.data) {
          throw new Error('Invalid export file format.');
        }
        setImportData(json);
        setImportStatus('ready');
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON file.');
        setImportStatus('error');
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file.');
      setImportStatus('error');
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const executeImport = async () => {
     if (!user || !importData) return;
     
     if (importMode === 'replace') {
         const confirmed = window.confirm("WARNING: Replace mode will overwrite existing matched data and may lead to data loss. Are you sure you want to proceed? Consider exporting a backup first.");
         if (!confirmed) return;
     }
     
     setIsImporting(true);
     setImportStatus('importing');
     try {
        const BATCH_LIMIT = 450;
        let batch = writeBatch(db);
        let operationCount = 0;
        let batchPromises: Promise<void>[] = [];

        const commitBatch = () => {
           if (operationCount > 0) {
              batchPromises.push(batch.commit());
              batch = writeBatch(db);
              operationCount = 0;
           }
        };

        const { data } = importData;
        
        for (const colName of collectionsToExport) {
            if (!data[colName] || !Array.isArray(data[colName])) continue;
            
            for (const item of data[colName]) {
                const { id, ...docData } = item;
                if (!id) continue;
                
                // Safety: force userId to current user
                const safeData = {
                   ...docData,
                   userId: user.uid
                };
                
                // We use setDoc with merge for both 'merge' and 'replace' 
                // because a true replace would require deleting everything first which is dangerous.
                // Or we can delete all first if replace. 
                // But simplified: we just overwrite the document.
                
                const docRef = doc(db, 'users', user.uid, colName, id);
                batch.set(docRef, safeData, { merge: importMode === 'merge' });
                operationCount++;
                
                if (operationCount >= BATCH_LIMIT) {
                    commitBatch();
                }
            }
        }
        
        commitBatch();
        await Promise.all(batchPromises);
        
        setImportStatus('success');
     } catch (e: any) {
         console.error('Import failed', e);
         setImportError(e.message || 'Failed to import data');
         setImportStatus('error');
     } finally {
         setIsImporting(false);
     }
  };

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-28 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <ContentHeader 
          title="Data Management" 
          subtitle="Export your data for backup or import to restore."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Export Card */}
          <div className="premium-card p-6 flex flex-col gap-4 animate-fade-up">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                   <Download size={20} />
                </div>
                <div>
                   <h3 className="font-semibold text-lg text-text-main">Export Data</h3>
                   <p className="text-sm text-muted">Download all your records</p>
                </div>
             </div>
             <p className="text-sm text-muted flex-1">
                Your export will include all your notes, tasks, categories, links, and workspace configurations in a secure JSON format.
             </p>
             <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 premium-btn premium-btn-primary p-3 rounded-xl disabled:opacity-50"
             >
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileJson size={18} />}
                {isExporting ? 'Exporting...' : 'Generate JSON Backup'}
             </button>
          </div>

          {/* Import Card */}
          <div className="premium-card p-6 flex flex-col gap-4 animate-fade-up" style={{ animationDelay: '50ms' }}>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(142,162,255,0.1)] text-[#a3b6fc] border border-[rgba(142,162,255,0.2)] flex items-center justify-center">
                   <Upload size={20} />
                </div>
                <div>
                   <h3 className="font-semibold text-lg text-text-main">Import Data</h3>
                   <p className="text-sm text-muted">Restore your workspace</p>
                </div>
             </div>
             
             {importStatus === 'idle' || importStatus === 'validating' || importStatus === 'error' ? (
                 <div className="flex flex-col gap-4 flex-1 mt-2">
                    <p className="text-sm text-muted">
                        Select a previously exported JSON backup file to restore your data.
                    </p>
                    
                    {importStatus === 'error' && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-2">
                           <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                           <span>{importError}</span>
                        </div>
                    )}
                    
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importStatus === 'validating'}
                        className="mt-auto w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-border transition-colors text-text-main"
                    >
                        {importStatus === 'validating' ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        Select Backup File
                    </button>
                 </div>
             ) : importStatus === 'success' ? (
                 <div className="flex flex-col gap-4 flex-1 items-center justify-center text-center py-4">
                     <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-2">
                         <CheckCircle2 size={32} />
                     </div>
                     <h4 className="font-medium text-text-main">Import Successful</h4>
                     <p className="text-sm text-muted">Your data has been restored.</p>
                     <button
                        onClick={() => {
                            setImportStatus('idle');
                            setImportData(null);
                        }}
                        className="mt-4 px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-text-main text-sm"
                     >
                         Done
                     </button>
                 </div>
             ) : (
                 <div className="flex flex-col gap-4 flex-1">
                    <div className="p-3 bg-[rgba(0,0,0,0.2)] rounded-xl border border-[rgba(255,255,255,0.05)] text-sm">
                       <div className="flex justify-between items-center text-muted mb-1">
                           <span>Backup from</span>
                           <span>{new Date(importData.exportedAt).toLocaleDateString()}</span>
                       </div>
                       <div className="grid grid-cols-2 gap-2 mt-3">
                          {collectionsToExport.map(col => {
                              const count = importData.data[col]?.length || 0;
                              if (count === 0) return null;
                              return (
                                  <div key={col} className="flex justify-between items-center text-xs">
                                      <span className="capitalize text-muted">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      <span className="font-medium text-text-main px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] rounded">{count}</span>
                                  </div>
                              );
                          })}
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-auto">
                        <label className="text-sm font-medium text-text-main">Import Mode</label>
                        <select 
                            value={importMode}
                            onChange={(e) => setImportMode(e.target.value as any)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none text-text-main focus:border-primary text-sm"
                        >
                            <option value="merge">Merge with existing data</option>
                            <option value="replace">Replace existing matching data</option>
                        </select>
                    </div>

                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => {
                                setImportStatus('idle');
                                setImportData(null);
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-transparent border border-border text-muted hover:text-text-main text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={executeImport}
                            disabled={isImporting}
                            className="flex-[2] flex items-center justify-center gap-2 premium-btn premium-btn-primary py-2.5 rounded-xl disabled:opacity-50 text-sm"
                        >
                            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            {isImporting ? 'Importing...' : 'Confirm Import'}
                        </button>
                    </div>
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
