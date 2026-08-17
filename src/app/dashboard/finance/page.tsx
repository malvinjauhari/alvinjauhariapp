import React, { useState } from 'react';
import { useUserCollection } from '../../../hooks/useUserCollection';
import { WalletItem, TransactionItem } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, History, CreditCard, ChevronRight } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';

export const FinanceDashboardPage = () => {
  const navigate = useNavigate();
  const { data: wallets, loading: walletsLoading } = useUserCollection<WalletItem>('wallets');
  const { data: transactions, loading: txLoading } = useUserCollection<TransactionItem>('transactions');

  const totalBalance = wallets.reduce((acc, wallet) => acc + (wallet.balance || 0), 0);
  
  const recentTransactions = transactions.slice(0, 5);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto">
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Header / Total Balance */}
        <div className="premium-card p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
          <p className="text-muted font-medium mb-2">Total Balance</p>
          {walletsLoading ? (
            <Skeleton className="h-12 w-48 mb-4" />
          ) : (
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              {formatIDR(totalBalance)}
            </h1>
          )}
          
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/dashboard/finance/transactions?action=add')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus size={20} />
              Add Transaction
            </button>
            <button 
              onClick={() => navigate('/dashboard/finance/wallets')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-secondary/80 transition-all active:scale-95"
            >
              <Wallet size={20} />
              Manage Wallets
            </button>
          </div>
        </div>

        {/* Quick Stats / Fund Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Wallets</h2>
              <button onClick={() => navigate('/dashboard/finance/wallets')} className="text-primary text-sm hover:underline flex items-center">
                View All <ChevronRight size={16} />
              </button>
            </div>
            
            {walletsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : wallets.length === 0 ? (
              <div className="premium-card p-6 text-center border-dashed border-border/50 bg-background/50">
                <p className="text-muted mb-4">No wallets added yet.</p>
                <button 
                  onClick={() => navigate('/dashboard/finance/wallets')}
                  className="text-primary font-medium hover:underline"
                >
                  Add your first wallet
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {wallets.slice(0, 3).map(wallet => (
                  <div key={wallet.id} className="premium-card p-4 flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate('/dashboard/finance/wallets')}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{wallet.name}</h3>
                        <p className="text-xs text-muted">{wallet.type}</p>
                      </div>
                    </div>
                    <p className="font-bold">{formatIDR(wallet.balance)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Transactions</h2>
              <button onClick={() => navigate('/dashboard/finance/transactions')} className="text-primary text-sm hover:underline flex items-center">
                View All <ChevronRight size={16} />
              </button>
            </div>
            
            {txLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="premium-card p-6 text-center border-dashed border-border/50 bg-background/50">
                <p className="text-muted">No recent transactions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map(tx => {
                  const isIncome = tx.type === 'income';
                  const wallet = wallets.find(w => w.id === tx.walletId);
                  return (
                    <div key={tx.id} className="premium-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {isIncome ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{tx.category}</h3>
                          <p className="text-xs text-muted">{wallet?.name || 'Unknown Wallet'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isIncome ? 'text-emerald-500' : 'text-foreground'}`}>
                          {isIncome ? '+' : '-'}{formatIDR(tx.amount)}
                        </p>
                        {tx.date && (
                          <p className="text-[10px] text-muted mt-1">
                            {new Date(tx.date.seconds ? tx.date.seconds * 1000 : tx.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
