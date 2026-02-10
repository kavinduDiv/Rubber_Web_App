import { useEffect } from 'react';

import { db } from './db';
import { Tree, Collection } from './types';


async function syncData() {
    if (!navigator.onLine) return;

    try {
        const unsyncedTrees = await db.trees.where('synced').equals(0).toArray();
        const unsyncedCollections = await db.collections.where('synced').equals(0).toArray();

        if (unsyncedTrees.length === 0 && unsyncedCollections.length === 0) return;

        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trees: unsyncedTrees, collections: unsyncedCollections }),
        });

        if (response.ok) {
            await db.transaction('rw', db.trees, db.collections, async () => {
                for (const tree of unsyncedTrees) {
                    if (tree.id) await db.trees.update(tree.id, { synced: 1 });
                }
                for (const col of unsyncedCollections) {
                    if (col.id) await db.collections.update(col.id, { synced: 1 });
                }
            });
            console.log('Sync successful');
        } else {
            console.error('Sync failed', response.statusText);
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

export function useAutoSync() {
    useEffect(() => {
        const handleOnline = () => syncData();

        window.addEventListener('online', handleOnline);
        // Initial check
        syncData();

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);
}
