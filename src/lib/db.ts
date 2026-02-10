import Dexie, { type EntityTable } from 'dexie';
import { Tree, Collection } from './types';

const db = new Dexie('RubberTreeDB') as Dexie & {
    trees: EntityTable<Tree, 'id'>,
    collections: EntityTable<Collection, 'id'>
};

// Define Schema
// Ensure we index fields we query by
db.version(2).stores({
    trees: '++id, tree_id, synced, created_at',
    collections: '++id, tree_id, timestamp, synced'
});

export { db };
