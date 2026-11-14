'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addToCollection, getCollection, removeFromCollection } from '../services/collectionService';

// The signed-in user's collection (variant ids). Loaded when the user changes;
// add/remove persist and return the updated list.
export function useCollection(userId: string | undefined) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setIds([]);
      return;
    }
    let live = true;
    getCollection(userId)
      .then((list) => live && setIds(list))
      .catch((err) => console.error('Failed to load the collection:', err));
    return () => {
      live = false;
    };
  }, [userId]);

  // Fresh from the backend (a shared ?view=collection link opens before the
  // effect above has finished).
  const reload = useCallback(async (): Promise<string[]> => {
    if (!userId) return [];
    const list = await getCollection(userId);
    setIds(list);
    return list;
  }, [userId]);

  const add = useCallback(
    async (id: string) => {
      if (userId) setIds(await addToCollection(userId, id));
    },
    [userId]
  );

  const remove = useCallback(
    async (id: string) => {
      if (userId) setIds(await removeFromCollection(userId, id));
    },
    [userId]
  );

  const idSet = useMemo(() => new Set(ids), [ids]);

  return { ids, idSet, reload, add, remove };
}
