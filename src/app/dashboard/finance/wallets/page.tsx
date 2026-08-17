import React, { useState } from 'react';
import { useUserCollection } from '../../../../hooks/useUserCollection';
import { WalletItem, WalletType } from '../../../../types';
import { ArrowLeft, Plus, CreditCard, Landmark, Wallet as WalletIcon, MoreVertical, Trash, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { Modal } from '../../../../components/ui/Modal';
import { useFinanceActions } from '../../../../hooks/useFinanceActions';
import { ConfirmDeleteModal } from '../../../../components/ui/ConfirmDeleteModal';

export const WalletsPage = () => {
  const navigate = useNavigate();
  const { data: wallets, loading: walletsLoading } = useUserCollection<WalletItem>('wallets');
  const { addWallet, updateWallet, deleteWallet } = useFinanceActions();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletItem | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('E-Wallet');
  const [balance, setBalance] = useState('');

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const resetForm = () => {
    setName('');
    setType('E-Wallet');
    setBalance('');
    setError(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (wallet: WalletItem) => {
    setSelectedWallet(wallet);
    setName(wallet.name);
    setType(wallet.type);
    setBalance(wallet.balance.toString());
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (wallet: WalletItem) => {
    setSelectedWallet(wallet);
    setIsDeleteModalOpen(true);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a wallet name.");
      return;
    }
    
    // Balance can be 0, but must be a valid number
    if (balance === '' || isNaN(Number(balance))) {
      setError("Please enter a valid initial balance.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (isEditModalOpen && selectedWallet) {
        await updateWallet(selectedWallet.id, {
          name: name.trim(),
          type,
          balance: Number(balance)
        });
        setIsEditModalOpen(false);
      } else {
        await addWallet({
          name: name.trim(),
          type,
          balance: Number(balance)
        });
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async () => {
    if (!selectedWallet) return;
    try {
      setLoading(true);
      await deleteWallet(selectedWallet.id);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete wallet.");
    } finally {
      setLoading(false);
    }
  };

  const getWalletIcon = (wType: WalletType) => {
    switch (wType) {
      case 'Bank': return <Landmark size={24} />;
      case 'Cash': return <WalletIcon size={24} />;
      case 'E-Wallet': return <CreditCard size={24} />;
      default: return <CreditCard size={24} />;
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
            <h1 className="text-xl font-bold">My Wallets</h1>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Wallet</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto pb-20">
          {walletsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted border border-dashed border-border/50 rounded-2xl bg-[rgba(20,24,32,0.2)]">
              <WalletIcon size={40} className="mb-4 text-muted/30" />
              <p className="font-medium text-lg text-foreground mb-1">No Wallets Yet</p>
              <p className="text-sm mb-6 text-center max-w-xs">Add your bank accounts, e-wallets, or cash to start tracking your finances.</p>
              <button 
                onClick={handleOpenAddModal}
                className="flex items-center justify-center gap-2 bg-secondary text-foreground px-6 py-3 rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-all"
              >
                <Plus size={16} />
                Add Your First Wallet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map(wallet => (
                <div key={wallet.id} className="premium-card p-5 flex flex-col justify-between h-36 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                        {getWalletIcon(wallet.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{wallet.name}</h3>
                        <p className="text-xs text-muted font-medium">{wallet.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEditModal(wallet)} className="p-1.5 text-muted hover:text-foreground hover:bg-white/10 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleOpenDeleteModal(wallet)} className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="z-10 mt-4">
                    <p className="text-2xl font-bold tracking-tight text-foreground">{formatIDR(wallet.balance)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} title={isEditModalOpen ? "Edit Wallet" : "Add Wallet"}>
        <form onSubmit={handleSaveWallet} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted ml-1">Wallet Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Bank', 'E-Wallet', 'Cash'] as WalletType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-3 flex flex-col items-center justify-center gap-2 rounded-xl transition-all border ${type === t ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-secondary text-muted hover:text-foreground hover:bg-white/5'}`}
                >
                  {getWalletIcon(t)}
                  <span className="text-xs font-medium">{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted ml-1">Wallet Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. BCA, GoPay, Main Cash"
              className="w-full bg-secondary border-none rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted/50"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted ml-1">{isEditModalOpen ? "Adjust Balance (IDR)" : "Initial Balance (IDR)"}</label>
            <input 
              type="number" 
              value={balance}
              onChange={e => setBalance(e.target.value)}
              placeholder="0"
              className="w-full bg-secondary border-none rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted/50"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
              className="px-5 py-2.5 rounded-xl font-medium text-muted hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
              Save Wallet
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteWallet}
        title="Delete Wallet"
        message={`Are you sure you want to delete ${selectedWallet?.name}? This action cannot be undone and will not automatically delete associated transactions.`}
      />
    </div>
  );
};
