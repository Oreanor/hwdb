import { CollectionItem } from '../types';

const COLLECTION_STORAGE_KEY = 'hwdb_collection';

export function getCollection(): CollectionItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(COLLECTION_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addToCollection(item: CollectionItem): void {
  const collection = getCollection();
  // Check if item already exists
  const exists = collection.some(
    existing => existing.lnk === item.lnk && existing.variantIndex === item.variantIndex
  );
  if (!exists) {
    collection.push(item);
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collection));
    window.dispatchEvent(new Event('collectionChanged'));
  }
}

export function removeFromCollection(item: CollectionItem): void {
  const collection = getCollection();
  const newCollection = collection.filter(
    existing => !(existing.lnk === item.lnk && existing.variantIndex === item.variantIndex)
  );
  localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(newCollection));
  window.dispatchEvent(new Event('collectionChanged'));
}

export function isInCollection(item: CollectionItem): boolean {
  const collection = getCollection();
  return collection.some(
    existing => existing.lnk === item.lnk && existing.variantIndex === item.variantIndex
  );
} 