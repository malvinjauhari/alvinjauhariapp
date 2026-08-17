import React, { useState } from 'react';
import { useUserCollection } from '../../../../hooks/useUserCollection';
import { TransactionItem, WalletItem } from '../../../../types';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Plus, Filter, Search, Edit2, History as HistoryIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { Modal } from '../../../../components/ui/Modal';
import { useFinanceActions } from '../../../../hooks/useFinanceActions';

export const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: transactions, loading: txLoading } = useUserCollection<TransactionItem>('transactions');
  const { data: wallets, loading: walletsLoading } = useUserCollection<WalletItem>('wallets');
  const { addTransaction, updateTransaction, deleteTransaction } = useFinanceActions();

  const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get('action') === 'add');
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const handleOpenAddModal = () => {
    setSearchParams({ action: 'add' });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx: TransactionItem) => {
    setSelectedTx(tx);
    setTxType(tx.type);
    setAmount(tx.amount.toString());
    setCategoryId(tx.category);
    setWalletId(tx.walletId);
    setNotes(tx.notes || '');
    
    // Convert timestamp to YYYY-MM-DD
    const txDate = tx.date?.seconds ? new Date(tx.date.seconds * 1000) : new Date(tx.date);
    setDate(txDate.toISOString().split('T')[0]);
    
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    searchParams.delete('action');
    setSearchParams(searchParams);
    setIsAddModalOpen(false);
    setSelectedTx(null);
    resetForm();
  };

  const resetForm = () => {
    setTxType('expense');
    setAmount('');
    setCategoryId('');
    setWalletId('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setError(null);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!walletId) {
      setError("Please select a wallet.");
      return;
    }
    if (!categoryId) {
      setError("Please enter a category.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const txData = {
        type: txType,
        amount: Number(amount),
        walletId,
        category: categoryId,
        notes,
        date: new Date(date).toISOString(),
      };

      if (selectedTx) {
        await updateTransaction(selectedTx, txData);
      } else {
        await addTransaction(txData);
      }
      
      handleCloseAddModal();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tx: TransactionItem) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This will update your wallet balance.")) return;
    try {
      await deleteTransaction(tx);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete transaction.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="p-4 md:px-8 max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard/finance')}
              className="p-2 -ml-2 rounded-xl text-muted hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Transactions</h1>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Transaction</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-4 pb-20">
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted border border-dashed border-border/50 rounded-2xl bg-[rgba(20,24,32,0.2)]">
              <HistoryIcon size={40} className="mb-4 text-muted/30" />
              <p className="font-medium text-lg text-foreground mb-1">No Transactions</p>
              <p className="text-sm">Your transaction history will appear here.</p>
            </div>
          ) : (
            transactions.map(tx => {
              const isIncome = tx.type === 'income';
              const wallet = wallets.find(w => w.id === tx.walletId);
              const txDate = tx.date?.seconds ? new Date(tx.date.seconds * 1000) : new Date(tx.date);
              
              return (
                <div key={tx.id} className="premium-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {isIncome ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{tx.category}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted mt-1">
                        <span className="bg-white/5 px-2 py-0.5 rounded-md">{wallet?.name || 'Unknown Wallet'}</span>
                        <span>•</span>
                        <span>{txDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      {tx.notes && <p className="text-sm text-muted mt-2">{tx.notes}</p>}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4">
                    <p className={`font-bold text-lg ${isIncome ? 'text-emerald-500' : 'text-foreground'}`}>
                      {isIncome ? '+' : '-'}{formatIDR(tx.amount)}
                    </p>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditModal(tx)}
                        className="text-xs text-muted hover:text-foreground hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(tx)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title={selectedTx ? "Edit Transaction" : "Add Transaction"}>
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl">
              {error}
            </div>
          )}
          
          <div className="flex p-1 bg-secondary rounded-xl">
            <button
              type="button"
              onClick={() => setTxType('expense')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${txType === 'expense' ? 'bg-background shadow text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${txType === 'income' ? 'bg-background shadow text-foreground' : 'text-muted hover:text-foreground'}`}
            >
              Income
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted ml-1">Amount (IDR)</label>
            <input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full bg-secondary border-none rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted/50"
              required
              min="1"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted ml-1">Wallet Source</label>
            <select
              value={walletId}
              onChange={e => setWalletId(e.target.value)}
              className="w-full bg-secondary border-none rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              required
            >
              <option value="">Select Wallet</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted ml-1">Category</label>
            <input 
              type="text" 
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              placeholder={txType === 'expense' ? 'e.g. Food, Transport, Bills' : 'e.g. Salary, Bonus, Transfer'}
              className="w-full bg-secondary border-none rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-medium text-muted ml-1">Date</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-secondary border-none rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted ml-1">Notes (Optional)</label>
            <input 
              type="text" 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add details..."
              className="w-full bg-secondary border-none rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={handleCloseAddModal}
              className="px-5 py-2.5 rounded-xl font-medium text-muted hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || wallets.length === 0}
              className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
              {wallets.length === 0 ? 'Add Wallet First' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
