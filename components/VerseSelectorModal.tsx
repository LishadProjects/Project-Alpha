
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType } from '../types';
import { XIcon, BookOpenIcon } from './icons';
import { surahData } from '../utils/quranData';
import { SurahInfo } from '../utils/quranData';


export const VerseSelectorModal: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [surahs] = useState<SurahInfo[]>(surahData);
    const [selectedSurah, setSelectedSurah] = useState<string>(state.selectedVerse?.surah.toString() || '1');
    const [startAyah, setStartAyah] = useState<string>(state.selectedVerse?.startAyah.toString() || '1');
    const [endAyah, setEndAyah] = useState<string>(state.selectedVerse?.endAyah.toString() || '');
    const [error, setError] = useState('');

    const closeModal = () => dispatch({ type: ActionType.CLOSE_VERSE_SELECTOR });

    const handleSave = () => {
        const surahNum = parseInt(selectedSurah, 10);
        const startAyahNum = parseInt(startAyah, 10);
        const endAyahNum = parseInt(endAyah, 10) || startAyahNum;
        const surahData = surahs.find(s => s.id === surahNum);

        setError('');

        if (!surahNum || !startAyahNum || !surahData) {
            setError('Please select a valid Surah and Start Ayah.');
            return;
        }

        if (startAyahNum < 1 || startAyahNum > surahData.verses_count) {
            setError(`Start Ayah must be between 1 and ${surahData.verses_count}.`);
            return;
        }

        if (endAyahNum < startAyahNum) {
            setError('End Ayah must be greater than or equal to Start Ayah.');
            return;
        }
        
        if (endAyahNum > surahData.verses_count) {
             setError(`End Ayah must be between 1 and ${surahData.verses_count}.`);
            return;
        }

        dispatch({ type: ActionType.SET_SELECTED_VERSE, payload: { surah: surahNum, startAyah: startAyahNum, endAyah: endAyahNum } });
    };

    const handleSetRandom = () => {
        dispatch({ type: ActionType.SET_SELECTED_VERSE, payload: null });
    };
    
    // Reset ayahs when surah changes
    useEffect(() => {
        setStartAyah('1');
        setEndAyah('');
        setError('');
    }, [selectedSurah]);


    const maxVerse = surahs.find(s => s.id === parseInt(selectedSurah, 10))?.verses_count || 0;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onMouseDown={closeModal}>
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <BookOpenIcon className="w-6 h-6 text-primary-500" />
                        <h2 className="text-xl font-bold">Set Verses for Memorization</h2>
                    </div>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-6 overflow-y-auto flex-1 space-y-4">
                    
                        <>
                            <div>
                                <label htmlFor="surah-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Surah (Chapter)
                                </label>
                                <select
                                    id="surah-select"
                                    value={selectedSurah}
                                    onChange={e => setSelectedSurah(e.target.value)}
                                    className="w-full p-2 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {surahs.map(surah => (
                                        <option key={surah.id} value={surah.id}>
                                            {surah.id}. {surah.name_simple}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="start-ayah-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Ayah
                                    </label>
                                    <input
                                        type="number"
                                        id="start-ayah-input"
                                        value={startAyah}
                                        onChange={e => setStartAyah(e.target.value)}
                                        min="1"
                                        max={maxVerse}
                                        className="w-full p-2 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="end-ayah-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Ayah (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        id="end-ayah-input"
                                        value={endAyah}
                                        onChange={e => setEndAyah(e.target.value)}
                                        placeholder={startAyah}
                                        min={startAyah}
                                        max={maxVerse}
                                        className="w-full p-2 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                        </>
                    
                </main>

                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-between items-center gap-4">
                    <button onClick={handleSetRandom} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                        Show Random Verse Daily
                    </button>
                    <div className="flex gap-2">
                        <button onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                            Save Verses
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};