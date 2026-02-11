import { useEffect } from 'react';
import { db } from './db';
import { Tree, Collection } from './types';

// Push local changes to the server
async function pushData() {
    if (!navigator.onLine) return;

    try {
        const unsyncedTrees = await db.trees.where('synced').equals(0).toArray();
        const unsyncedCollections = await db.collections.where('synced').equals(0).toArray();

        // If no local changes, nothing to push
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
            console.log('Sync Push successful');
        } else {
            console.error('Sync Push failed', response.statusText);
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Pull server data to local DB
async function pullData() {
    if (!navigator.onLine) return;

    try {
        const response = await fetch('/api/sync', { method: 'GET' });
        if (!response.ok) throw new Error('Failed to fetch server data');

        const data = await response.json();
        const { trees, collections } = data; // trees: {id, tree_id, lat...}, collections: {...}

        if (!trees && !collections) return;

        await db.transaction('rw', db.trees, db.collections, async () => {
            // 1. Sync Trees
            if (trees && Array.isArray(trees)) {
                for (const serverTree of trees) {
                    // Check if we have this tree locally
                    const localTree = await db.trees.where('tree_id').equals(serverTree.tree_id).first();

                    if (localTree) {
                        // Update local only if server is newer or local is synced (to avoid overwriting unsynced work)
                        if (localTree.synced === 1) {
                            await db.trees.update(localTree.id!, {
                                lat: serverTree.lat,
                                lng: serverTree.lng,
                                note: serverTree.note,
                                synced: 1 // Confirm it's synced
                            });
                        }
                    } else {
                        // Add new tree from server
                        await db.trees.add({
                            tree_id: serverTree.tree_id,
                            lat: serverTree.lat,
                            lng: serverTree.lng,
                            note: serverTree.note,
                            created_at: serverTree.created_at || new Date().toISOString(),
                            synced: 1
                        });
                    }
                }
            }

            // 2. Sync Collections
            if (collections && Array.isArray(collections)) {
                for (const serverCol of collections) {
                    // Try to find a matching collection (same tree, time, amount)
                    // Since timestamp precision might differ (ISO vs DB datetime), allow slight fuzziness or check strict
                    // DB stores timestamp string.
                    // Let's use exact match on tree_id + timestamp (converted to ISO string or however stored)

                    // In DB we store simplified ISO string or just string.
                    // Server sends: "2024-02-11T09:00:00.000Z" (JSON).
                    // Local dexie: "2024-02-11T09..."

                    // Simplest: Check if we have a collection for this tree around this time?
                    // Or just check if we have this exact record synced.
                    // Better: "Add if not exists" logic.

                    // Helper: Convert server time to match local format?
                    // Actually, if we just use tree_id and timestamp, it's safer.

                    const existing = await db.collections
                        .where('tree_id').equals(serverCol.tree_id)
                        .filter(c => {
                            // Check if timestamps are close (within 1 second) or identical
                            const t1 = new Date(c.timestamp).getTime();
                            const t2 = new Date(serverCol.timestamp).getTime();
                            return Math.abs(t1 - t2) < 2000; // 2 sec tolerance
                        })
                        .first();

                    if (!existing) {
                        await db.collections.add({
                            tree_id: serverCol.tree_id,
                            cuts: serverCol.cuts,
                            milk_amount: serverCol.milk_amount,
                            note: serverCol.note,
                            timestamp: new Date(serverCol.timestamp).toISOString(),
                            synced: 1
                        });
                    }
                }
            }
        });
        console.log('Sync Pull successful');

    } catch (error) {
        console.error('Pull error:', error);
    }
}

export function useAutoSync() {
    useEffect(() => {
        const handleOnline = () => {
            pushData().then(pullData);
        };

        window.addEventListener('online', handleOnline);

        // Initial sync on mount
        // We pull first to get new data, then push any local changes (or vice versa needs thought)
        // Usually: Push local changes first to resolve conflicts? Or Pull to get latest?
        // Let's Pull first to populate UI, then Push.
        pullData().then(pushData);

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);
}
