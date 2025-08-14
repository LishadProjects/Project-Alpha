
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType } from '../types';
import { SurahInfo } from '../utils/quranData';
import { XIcon, BookOpenIcon, CheckIcon } from './icons';

export const SurahDetailModal: React.FC<{
    surah: SurahInfo;
    onClose: () => void;
}> = ({ surah, onClose }) => {
    const { state, dispatch } = useAppContext();
    
    // Initialize with memorized ayahs from global state
    const initialMemorizedAyahs = useMemo(() => {
        const progress = state.quranProgress[surah.id] || {};
        return new Set(Object.keys(progress).map(Number));
    }, [state.quranProgress, surah.id]);

    const [selectedAyahs, setSelectedAyahs] = useState<Set<number>>(initialMemorizedAyahs);
    const lastSelectedAyah = useRef<number | null>(null);

    const ayahs = Array.from({ length: surah.verses_count }, (_, i) => i + 1);

    const handleAyahClick = (ayahNumber: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedAyahs);

        if (e.shiftKey && lastSelectedAyah.current !== null) {
            // Range selection
            const start = Math.min(lastSelectedAyah.current, ayahNumber);
            const end = Math.max(lastSelectedAyah.current, ayahNumber);
            for (let i = start; i <= end; i++) {
                newSelected.add(i);
            }
        } else if (e.metaKey || e.ctrlKey) {
            // Toggle single
            if (newSelected.has(ayahNumber)) {
                newSelected.delete(ayahNumber);
            } else {
                newSelected.add(ayahNumber);
            }
        } else {
            // Simple toggle
            if (newSelected.has(ayahNumber)) {
                newSelected.delete(ayahNumber);
            } else {
                newSelected.add(ayahNumber);
            }
        }

        setSelectedAyahs(newSelected);
        lastSelectedAyah.current = ayahNumber;
    };

    const handleSelectAll = () => {
        const allAyahs = new Set(ayahs);
        setSelectedAyahs(allAyahs);
    };

    const handleDeselectAll = () => {
        setSelectedAyahs(new Set());
    };

    const handleSave = () => {
        dispatch({
            type: ActionType.SET_QURAN_PROGRESS,
            payload: { surahNumber: surah.id, memorizedAyahs: selectedAyahs }
        });
        onClose();
    };

    const hasUnsavedChanges = useMemo(() => {
        if (selectedAyahs.size !== initialMemorizedAyahs.size) return true;
        for (const ayah of selectedAyahs) {
            if (!initialMemorizedAyahs.has(ayah)) return true;
        }
        return false;
    }, [selectedAyahs, initialMemorizedAyahs]);

    const handleClose = () => {
        if (hasUnsavedChanges) {
            if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
                onClose();
            }
        } else {
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onMouseDown={handleClose}>
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <BookOpenIcon className="w-6 h-6 text-primary-500" />
                        <div>
                            <h2 className="text-xl font-bold">Surah {surah.name_simple} ({surah.name_arabic})</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAyahs.size} / {surah.verses_count} Ayahs Memorized</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center gap-2 disabled:bg-gray-400" disabled={!hasUnsavedChanges}>
                            <CheckIcon className="w-5 h-5" />
                            <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
                        </button>
                        <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to select. Use <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md">Shift</kbd> for range, <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md">Ctrl</kbd> for multi-select.</p>
                    <div className="flex gap-2">
                        <button onClick={handleSelectAll} className="text-sm px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Select All</button>
                        <button onClick={handleDeselectAll} className="text-sm px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Deselect All</button>
                    </div>
                </div>

                <main className="p-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
                        {ayahs.map(ayah => {
                            const isSelected = selectedAyahs.has(ayah);
                            return (
                                <button
                                    key={ayah}
                                    onClick={(e) => handleAyahClick(ayah, e)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all duration-150 font-bold text-sm
                                    ${isSelected 
                                        ? 'bg-primary-500 border-primary-600 text-white transform scale-105 shadow-lg' 
                                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/40'}`}
                                >
                                    {ayah}
                                </button>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
};
