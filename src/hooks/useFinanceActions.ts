import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, writeBatch, increment, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { WalletItem, TransactionItem } from '../types';

export function useFinanceActions() {
  const { user } = useAuth();

  const addWallet = async (data: Omit<WalletItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error("Unauthenticated");
    const docRef = await addDoc(collection(db, 'users', user.uid, 'wallets'), {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef;
  };

  const updateWallet = async (id: string, data: Partial<WalletItem>) => {
    if (!user) throw new Error("Unauthenticated");
    const docRef = doc(db, 'users', user.uid, 'wallets', id);
    await updateDoc(docRef, {
      ...data,
      userId: user.uid,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteWallet = async (id: string) => {
    if (!user) throw new Error("Unauthenticated");
    const docRef = doc(db, 'users', user.uid, 'wallets', id);
    await deleteDoc(docRef);
    // Note: In a production app, we would also delete or unlink associated transactions here,
    // or use a cloud function to clean them up. For now we just delete the wallet.
  };

  const addTransaction = async (data: Omit<TransactionItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error("Unauthenticated");
    
    const batch = writeBatch(db);
    
    // 1. Create the transaction
    const txRef = doc(collection(db, 'users', user.uid, 'transactions'));
    batch.set(txRef, {
      ...data,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Update the wallet balance
    const walletRef = doc(db, 'users', user.uid, 'wallets', data.walletId);
    const amountChange = data.type === 'income' ? data.amount : -data.amount;
    batch.update(walletRef, {
      balance: increment(amountChange),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    return txRef.id;
  };

  const deleteTransaction = async (transaction: TransactionItem) => {
    if (!user) throw new Error("Unauthenticated");
    
    const batch = writeBatch(db);
    
    // 1. Delete the transaction
    const txRef = doc(db, 'users', user.uid, 'transactions', transaction.id);
    batch.delete(txRef);

    // 2. Reverse the wallet balance
    const walletRef = doc(db, 'users', user.uid, 'wallets', transaction.walletId);
    const amountChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
    batch.update(walletRef, {
      balance: increment(amountChange),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  };

  const updateTransaction = async (
    oldTransaction: TransactionItem,
    newData: Omit<TransactionItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) throw new Error("Unauthenticated");
    const batch = writeBatch(db);

    // 1. Update the transaction
    const txRef = doc(db, 'users', user.uid, 'transactions', oldTransaction.id);
    batch.update(txRef, {
      ...newData,
      updatedAt: serverTimestamp(),
    });

    // 2. We must reverse the OLD transaction impact on the OLD wallet
    const oldWalletRef = doc(db, 'users', user.uid, 'wallets', oldTransaction.walletId);
    const oldAmountChange = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
    batch.update(oldWalletRef, {
      balance: increment(oldAmountChange),
      updatedAt: serverTimestamp()
    });

    // 3. We must apply the NEW transaction impact on the NEW wallet
    const newWalletRef = doc(db, 'users', user.uid, 'wallets', newData.walletId);
    const newAmountChange = newData.type === 'income' ? newData.amount : -newData.amount;
    batch.update(newWalletRef, {
      balance: increment(newAmountChange),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  };

  return { addWallet, updateWallet, deleteWallet, addTransaction, updateTransaction, deleteTransaction };
}
