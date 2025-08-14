import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { surahData, SurahInfo } from '../utils/quranData';
import { SurahDetailModal } from './SurahDetailModal';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex-1">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{value}</p>
    </div>
);


export const QuranView: React.FC = () => {
    const { state } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSurah, setSelectedSurah] = useState<SurahInfo | null>(null);

    const filteredSurahs = useMemo(() => {
        if (!searchQuery) return surahData;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return surahData.filter(surah => 
            surah.name_simple.toLowerCase().includes(lowerCaseQuery) ||
            surah.name_arabic.includes(lowerCaseQuery) ||
            surah.id.toString() === lowerCaseQuery
        );
    }, [searchQuery]);

    const progressStats = useMemo(() => {
        let totalMemorizedAyahs = 0;
        let totalMemorizedSurahs = 0;
        
        for (const surah of surahData) {
            const memorizedAyahsForSurah = Object.keys(state.quranProgress[surah.id] || {}).length;
            totalMemorizedAyahs += memorizedAyahsForSurah;

            if (memorizedAyahsForSurah === surah.verses_count) {
                totalMemorizedSurahs++;
            }
        }

        return { totalMemorizedAyahs, totalMemorizedSurahs };
    }, [state.quranProgress]);


    return (
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <StatCard title="Total Memorized Ayahs" value={`${progressStats.totalMemorizedAyahs} / 6236`} />
                    <StatCard title="Completed Surahs" value={`${progressStats.totalMemorizedSurahs} / 114`} />
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Search Surah by name or number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-full p-4 text-lg rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Surah Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredSurahs.map(surah => {
                        const memorizedCount = Object.keys(state.quranProgress[surah.id] || {}).length;
                        const progress = surah.verses_count > 0 ? (memorizedCount / surah.verses_count) * 100 : 0;
                        
                        let status: 'completed' | 'in-progress' | 'not-started' = 'not-started';
                        if (progress === 100) status = 'completed';
                        else if (progress > 0) status = 'in-progress';

                        return (
                            <div 
                                key={surah.id} 
                                onClick={() => setSelectedSurah(surah)}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between border-l-4
                                    ${status === 'completed' ? 'border-green-500' : status === 'in-progress' ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'}"
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                            status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' : 
                                            status === 'in-progress' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200' :
                                            'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}>
                                            {surah.id}
                                        </span>
                                        <div className="text-right">
                                            <h3 className="font-quran text-xl font-bold">{surah.name_arabic}</h3>
                                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{surah.name_simple}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{surah.verses_count} Ayahs</p>
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        <span>Progress</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                status === 'completed' ? 'bg-green-500' : 'bg-primary-500'
                                            }`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedSurah && (
                <SurahDetailModal 
                    surah={selectedSurah}
                    onClose={() => setSelectedSurah(null)}
                />
            )}
        </div>
    );
};