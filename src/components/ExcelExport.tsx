import React from 'react';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export default function ExcelExport() {
    const handleExport = async () => {
        try {
            const collections = await db.collections.toArray();
            const trees = await db.trees.toArray();

            // Create a map for quick tree lookup
            const treeMap = new Map();
            trees.forEach(t => treeMap.set(t.tree_id, t));

            const data = collections.map(c => {
                const t = treeMap.get(c.tree_id);
                return {
                    'Date': new Date(c.timestamp).toLocaleDateString(),
                    'Time': new Date(c.timestamp).toLocaleTimeString(),
                    'Tree ID': c.tree_id,
                    'Cuts': c.cuts,
                    'Milk (L/kg)': c.milk_amount,
                    'Daily Note': c.note || '',
                    'Tree Lat': t ? t.lat : 'N/A',
                    'Tree Lng': t ? t.lng : 'N/A',
                    'Tree Note': t ? t.note || '' : '',
                    'Synced': c.synced ? 'Yes' : 'No'
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Collection_Data');

            // Also export Trees list separately for reference
            const treeData = trees.map(t => ({
                'Tree ID': t.tree_id,
                'Latitude': t.lat,
                'Longitude': t.lng,
                'Note': t.note || '',
                'Created At': new Date(t.created_at).toLocaleString()
            }));
            const treeSheet = XLSX.utils.json_to_sheet(treeData);
            XLSX.utils.book_append_sheet(workbook, treeSheet, 'Trees_Registry');

            XLSX.writeFile(workbook, `Rubber_Plantation_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (e) {
            console.error('Export failed', e);
            alert('Export failed. Check console for details.');
        }
    };

    return (
        <button
            onClick={handleExport}
            className="btn btn-secondary bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
        >
            Export Report
        </button>
    );
}
