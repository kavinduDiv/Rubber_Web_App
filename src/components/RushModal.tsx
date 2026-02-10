import React, { useState, useEffect } from 'react';
import { Tree } from '@/lib/types';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDistanceFromLatLonInMeters } from '@/lib/geo';
import {
    FaHistory, FaMapMarkerAlt,
    FaExclamationTriangle, FaCheckCircle, FaSpinner,
    FaTint, FaCut, FaPlus, FaList, FaTrash, FaSave
} from 'react-icons/fa';

interface RushModalProps {
    tree: Tree;
    onSave: (data: { cuts: number; milk_amount: number; note: string }) => Promise<void>;
    onClose: () => void;
    loading: boolean;
}

const MAX_DISTANCE_METERS = 50;

export default function RushModal({ tree, onSave, onClose, loading }: RushModalProps) {
    const [activeTab, setActiveTab] = useState<'entry' | 'history'>('entry');

    const [cuts, setCuts] = useState<number>(1);
    const [milk, setMilk] = useState<string>('');
    const [note, setNote] = useState('');

    const [distance, setDistance] = useState<number | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const history = useLiveQuery(() =>
        db.collections.where('tree_id').equals(tree.tree_id).reverse().toArray()
        , [tree.tree_id]);

    useEffect(() => {
        if ('geolocation' in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    if (tree.lat && tree.lng) {
                        const dist = getDistanceFromLatLonInMeters(
                            tree.lat, tree.lng,
                            position.coords.latitude, position.coords.longitude
                        );
                        setDistance(dist);
                    }
                },
                (err) => {
                    setLocationError(err.message);
                },
                { enableHighAccuracy: true, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        } else {
            setLocationError('Geolocation not supported.');
        }
    }, [tree]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        // Strict Geolocation Check
        if (distance !== null && distance > MAX_DISTANCE_METERS) {
            // Optional: Allow override in dev/testing if needed, but per UX requirement, alert is correct.
            alert(`Too far! You are ${distance.toFixed(0)}m away. Move closer (Max 50m).`);
            return;
        }

        if (!milk || cuts === 0) return;

        await onSave({ cuts, milk_amount: Number(milk), note });

        // Reset form for next entry (if stays open)
        setMilk('');
        setNote('');
        // Switch to history tab temporarily to show success? No, user prefers speed.
        // If auto-advance is disabled, user stays here.
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (confirm('Are you sure you want to delete this record?')) {
            await db.collections.delete(id);
        }
    };

    const isLocationValid = distance !== null && distance <= MAX_DISTANCE_METERS;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content animate-fade-in text-main flex flex-col h-[600px] max-h-[90vh] p-0 overflow-hidden bg-card border border-card-border shadow-2xl rounded-2xl" onClick={e => e.stopPropagation()}>

                {/* Header - Fixed */}
                <div className="flex-none p-4 pb-2 bg-card border-b border-card-border flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-main">{tree.tree_id}</h2>
                        <div className="text-xs text-muted flex items-center gap-1">
                            <FaMapMarkerAlt /> {tree.lat?.toFixed(5)}, {tree.lng?.toFixed(5)}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-2xl font-bold text-muted hover:text-white px-2">&times;</button>
                </div>

                {/* Improved Tabs */}
                <div className="flex-none flex border-b border-card-border bg-background/50">
                    <button
                        onClick={() => setActiveTab('entry')}
                        className={`flex-1 py-3 text-sm font-bold uppercase transition-all flex justify-center items-center gap-2
                ${activeTab === 'entry'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-muted hover:bg-card-bg hover:text-main border-b-2 border-transparent'}`}
                    >
                        <FaPlus /> New Entry
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-bold uppercase transition-all flex justify-center items-center gap-2
                ${activeTab === 'history'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-muted hover:bg-card-bg hover:text-main border-b-2 border-transparent'}`}
                    >
                        <FaHistory /> History Log
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-background relative">

                    {/* === TAB 1: ENTRY FORM === */}
                    {activeTab === 'entry' && (
                        <div className="p-4 flex flex-col h-full animate-fade-in">
                            {/* Location Status */}
                            <div className={`p-4 rounded-xl border mb-6 flex items-center gap-4 transition-colors ${locationError ? 'status-error bg-red-900/10 border-red-900/30 text-red-400' :
                                    distance === null ? 'status-pending bg-yellow-900/10 border-yellow-900/30 text-yellow-400' :
                                        isLocationValid ? 'status-synced bg-emerald-900/10 border-emerald-900/30 text-emerald-400' :
                                            'status-error bg-red-900/10 border-red-900/30 text-red-400'
                                }`}>
                                <div className="text-2xl">
                                    {locationError ? <FaExclamationTriangle /> :
                                        isLocationValid ? <FaCheckCircle /> :
                                            distance === null ? <FaSpinner className="animate-spin" /> :
                                                <FaExclamationTriangle />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm uppercase tracking-wide">
                                        {locationError ? 'GPS Signal Lost' :
                                            distance === null ? 'Locating Tree...' :
                                                isLocationValid ? 'Location Verified' : 'Out of Range'}
                                    </h3>
                                    <p className="text-xs font-mono opacity-80 mt-1">
                                        {locationError || (
                                            distance !== null ? `${distance.toFixed(0)}m away (limit: 50m)` :
                                                "Calculating proximity..."
                                        )}
                                    </p>
                                </div>
                            </div>

                            <form id="rush-form" onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="text-xs font-bold text-muted uppercase mb-2 ml-1">Cuts</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={cuts}
                                                onChange={(e) => setCuts(Number(e.target.value))}
                                                className="text-center font-bold text-3xl h-16 w-full rounded-xl border border-input-border bg-input-bg text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                min="1"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                                                <FaCut />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-bold text-muted uppercase mb-2 ml-1">Milk (L)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={milk}
                                                onChange={(e) => setMilk(e.target.value)}
                                                className="text-center font-bold text-3xl h-16 w-full rounded-xl border border-input-border bg-input-bg text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
                                                step="0.01"
                                                placeholder="0.0"
                                                autoFocus
                                                required
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                                                <FaTint />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col flex-1">
                                    <label className="text-xs font-bold text-muted uppercase mb-2 ml-1">Daily Note</label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="flex-1 w-full rounded-xl border border-input-border bg-input-bg text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow p-4 text-base resize-none"
                                        placeholder="Add observations..."
                                    />
                                </div>
                            </form>
                        </div>
                    )}

                    {/* === TAB 2: HISTORY LOG === */}
                    {activeTab === 'history' && (
                        <div className="p-4 space-y-3 animate-fade-in pb-20"> {/* Extra padding for footer if needed */}
                            {history?.map((col) => (
                                <div key={col.id} className="bg-card border border-card-border rounded-xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-primary/50 transition-colors">
                                    {/* Status Sync Line */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${col.synced ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

                                    <div className="flex justify-between items-start pl-3">
                                        <div>
                                            <div className="text-sm font-bold text-main">
                                                {new Date(col.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="text-xs text-muted mt-0.5">
                                                {new Date(col.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(col.id)}
                                            className="text-red-400 opacity-60 hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg"
                                            title="Delete Record"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pl-3">
                                        <div className="bg-background rounded-lg p-3 border border-card-border flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-blue-400">
                                                <FaTint /> <span className="text-[10px] font-bold uppercase tracking-wider">Milk</span>
                                            </div>
                                            <span className="text-xl font-bold text-white">{col.milk_amount}<span className="text-sm font-normal text-muted ml-0.5">L</span></span>
                                        </div>
                                        <div className="bg-background rounded-lg p-3 border border-card-border flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-orange-400">
                                                <FaCut /> <span className="text-[10px] font-bold uppercase tracking-wider">Cuts</span>
                                            </div>
                                            <span className="text-xl font-bold text-white">{col.cuts}</span>
                                        </div>
                                    </div>

                                    {col.note && (
                                        <div className="pl-3 pt-2 border-t border-card-border/50 text-xs italic text-muted flex items-start gap-2">
                                            <FaList className="mt-0.5 flex-shrink-0" /> {col.note}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {(!history || history.length === 0) && (
                                <div className="flex flex-col items-center justify-center h-48 text-muted opacity-50 border-2 border-dashed border-card-border rounded-xl">
                                    <FaHistory size={32} className="mb-2" />
                                    <p>No history entries found.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer actions - Only show Save on Entry tab */}
                {activeTab === 'entry' && (
                    <div className="flex-none p-4 bg-card border-t border-card-border flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary flex-1 py-3.5 text-base font-bold rounded-xl hover:bg-card-border"
                        >
                            Cancel
                        </button>
                        <button
                            form="rush-form"
                            type="submit"
                            disabled={loading || !isLocationValid}
                            className="btn btn-primary flex-[2] py-3.5 text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 rounded-xl transition-transform active:scale-95 disabled:scale-100 disabled:opacity-50"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {loading ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="flex-none p-4 bg-card border-t border-card-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary w-full py-3.5 text-base font-bold rounded-xl hover:bg-card-border"
                        >
                            Close Log
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
