import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Tree } from '@/lib/types';
import { FaTree, FaCheck, FaExclamation, FaSearch } from 'react-icons/fa';

interface TreeGridProps {
    onSelectTree: (tree: Tree) => void;
    searchQuery: string;
}

export default function TreeGrid({ onSelectTree, searchQuery }: TreeGridProps) {
    // Fetch all trees, then filter in memory for responsiveness properties
    // For large datasets, we might want to use db.trees.where('tree_id').startsWith(searchQuery)
    // but case insensitive search in Dexie requires a bit more setup or manual filtering.
    const trees = useLiveQuery(async () => {
        let collection = db.trees.toArray();
        return collection;
    }, []);

    if (!trees) return <div className="p-4 text-center text-muted">Loading trees...</div>;

    const filteredTrees = trees.filter(t =>
        t.tree_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (trees.length === 0) {
        return (
            <div className="p-10 text-center card bg-card/50 border-dashed">
                <div className="text-4xl mb-4 opacity-50">🌳</div>
                <h3 className="text-xl font-bold text-main">No Trees Yet</h3>
                <p className="text-muted text-sm mt-2">Tap "+ New Tree" to get started.</p>
            </div>
        );
    }

    if (filteredTrees.length === 0) {
        return (
            <div className="p-10 text-center text-muted">
                <FaSearch className="mx-auto text-2xl mb-2 opacity-30" />
                <p>No trees found matching "{searchQuery}"</p>
            </div>
        );
    }

    return (
        <div className="grid-layout fade-in">
            {filteredTrees.map((tree) => (
                <div
                    key={tree.id}
                    onClick={() => onSelectTree(tree)}
                    className="card cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all active:scale-95 group relative overflow-hidden"
                >
                    {/* Status Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${tree.synced ? 'bg-primary' : 'bg-yellow-500'}`}></div>

                    <div className="flex justify-between items-start mb-2 pl-2">
                        <div className={`p-2 rounded-lg ${tree.synced ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            <FaTree />
                        </div>
                        {tree.synced ? (
                            <span className="text-[10px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                <FaCheck size={8} /> Synced
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold uppercase text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 flex items-center gap-1">
                                <FaExclamation size={8} /> Pending
                            </span>
                        )}
                    </div>

                    <div className="pl-2">
                        <h3 className="text-lg font-bold text-main group-hover:text-primary transition-colors">
                            {tree.tree_id}
                        </h3>
                        <p className="text-xs text-muted truncate h-4">
                            {tree.note || ''}
                        </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-card-border pl-2 flex justify-between items-center text-[10px] text-muted font-mono">
                        <span>{tree.lat?.toFixed(5)}, {tree.lng?.toFixed(5)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
