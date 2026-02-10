import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { FaTree, FaMapMarkerAlt, FaLocationArrow, FaCheck } from 'react-icons/fa';

interface CreateTreeModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateTreeModal({ onClose, onSuccess }: CreateTreeModalProps) {
    const [treeId, setTreeId] = useState('');
    const [note, setNote] = useState('');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => setCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                }),
                (err) => setError('GPS Error: ' + err.message),
                { enableHighAccuracy: true }
            );
        } else {
            setError('GPS not supported.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!treeId || !coords) return;

        setLoading(true);
        try {
            await db.trees.add({
                tree_id: treeId,
                lat: coords.lat,
                lng: coords.lng,
                note: note,
                created_at: new Date().toISOString(),
                synced: 0,
            });
            onSuccess();
            onClose();
        } catch (e) {
            setError('Tree ID might already exist.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FaTree className="text-emerald" /> New Tree
                    </h2>
                    <button onClick={onClose} className="text-2xl font-bold text-muted hover:text-white">&times;</button>
                </div>

                {error && (
                    <div className="mb-4 status-error text-center p-2 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-muted">Tree ID / Number</label>
                        <input
                            type="text"
                            value={treeId}
                            onChange={(e) => setTreeId(e.target.value)}
                            placeholder="e.g. T-101"
                            required
                            className="font-bold text-lg"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-muted">Note (Optional)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Descriptive details..."
                            rows={3}
                        />
                    </div>

                    <div className="p-3 bg-background border border-card rounded flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted">
                            <FaLocationArrow /> GPS Status
                        </div>
                        {coords ? (
                            <div className="font-mono font-bold text-emerald flex items-center gap-2 text-xs">
                                <FaCheck /> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                            </div>
                        ) : (
                            <div className="text-warning-text flex items-center gap-2 text-xs animate-pulse">
                                Acquiring...
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !coords}
                            className="btn btn-primary"
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
