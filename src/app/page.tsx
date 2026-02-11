'use client';
import { useState, useCallback } from 'react';
import { useAutoSync } from '@/lib/sync';
import TreeGrid from '@/components/TreeGrid';
import CreateTreeModal from '@/components/CreateTreeModal';
import RushModal from '@/components/RushModal';
import ExcelExport from '@/components/ExcelExport';
import { db } from '@/lib/db';
import { Tree } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';
import { FaLeaf, FaPlus, FaSearch } from 'react-icons/fa';

export default function Home() {
  useAutoSync();
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to find next tree
  const selectNextTree = useCallback(async (currentId: number) => {
    if (!currentId) return;

    // Find next ID in sequence strictly
    const nextTree = await db.trees.where('id').above(currentId).first();
    if (nextTree) {
      setSelectedTree(nextTree);
      toast.success(`Opening Tree ${nextTree.tree_id}`, { icon: '➡️' });
    } else {
      toast('Cycle Complete!', { icon: '🎉' });
      setSelectedTree(null);
    }
  }, []);

  const handleSaveCollection = async (data: { cuts: number; milk_amount: number; note: string }) => {
    if (!selectedTree || !selectedTree.id) return;
    setLoading(true);
    try {
      await db.collections.add({
        tree_id: selectedTree.tree_id,
        cuts: data.cuts,
        milk_amount: data.milk_amount,
        note: data.note,
        timestamp: new Date().toISOString(),
        synced: 0
      });
      toast.success('Saved!');
      // Move to next tree automatically
      // await selectNextTree(selectedTree.id);
      // Wait, user might want to check history. Maybe just delay it? 
      // User asked for "Auto open popup for next tree ID" in prompt 0.
      // So let's stick to auto-advance.
      setTimeout(() => selectNextTree(selectedTree.id!), 500); // slight delay for user to see 'Saved' success
    } catch (e) {
      console.error(e);
      toast.error('Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-main transition-colors duration-300">
      <Toaster position="top-right" toastOptions={{
        className: 'bg-card text-main border-card shadow-lg',
        style: { background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' },
      }} />

      {/* Search Bar / Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-card-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg shadow-emerald-500/20">
                <FaLeaf />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400 hidden sm:block">
                Rubber PWA
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <ExcelExport />
              <button
                onClick={() => setShowRegister(true)}
                className="btn btn-primary flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform text-sm px-3 py-2"
              >
                <FaPlus /> <span className="hidden sm:inline">New Tree 12</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <FaSearch />
            </div>
            <input
              type="text"
              className="bg-input-bg border border-input-border text-input-text text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5"
              placeholder="Search Tree ID or Note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <TreeGrid onSelectTree={setSelectedTree} searchQuery={searchQuery} />
      </div>

      {/* Modals */}
      {showRegister && (
        <CreateTreeModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => { }}
        />
      )}


      {selectedTree && (
        <RushModal
          key={selectedTree.id}
          tree={selectedTree}
          onSave={handleSaveCollection}
          onClose={() => setSelectedTree(null)}
          loading={loading}
        />
      )}
    </main>
  );
}
