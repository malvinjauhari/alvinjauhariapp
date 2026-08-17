import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useFirestoreActions(collectionName: string) {
  const { user } = useAuth();

  const add = async (data: any) => {
    if (!user) throw new Error("Unauthenticated");
    const docRef = await addDoc(collection(db, 'users', user.uid, collectionName), {
      ...data,
      userId: user.uid, // enforce ownership
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef;
  };

  const update = async (id: string, data: any) => {
    if (!user) throw new Error("Unauthenticated");
    const docRef = doc(db, 'users', user.uid, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      userId: user.uid,
      updatedAt: serverTimestamp(),
    });
  };

  const remove = async (id: string) => {
    if (!user) throw new Error("Unauthenticated");
    const docRef = doc(db, 'users', user.uid, collectionName, id);
    await deleteDoc(docRef);
  };

  const removeMany = async (ids: string[]) => {
    if (!user) throw new Error("Unauthenticated");
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, 'users', user.uid, collectionName, id);
      batch.delete(docRef);
    });
    await batch.commit();
  };

  return { add, update, remove, removeMany };
}
