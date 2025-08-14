import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, Habit } from '../types';
import { AddEditHabitModal } from './AddEditHabitModal';
import { PlusIcon, EditIcon, ArchiveIcon, TargetIcon, AwardIcon, DumbbellIcon, BookOpenIcon, LeafIcon, WaterBottleIcon } from './icons';

const toYMD = (date: Date): string => date.toISOString().split('T')[0];

const iconMap: { [key: string]: React.FC<{ className?: string }> } = {
    DumbbellIcon,
    BookOpenIcon,
    LeafIcon,
    WaterBottleIcon,
    RepeatIcon: PlusIcon, // fallback
};

const HabitIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
    const IconComponent = iconMap[name] || PlusIcon;
    return <IconComponent className={className} />;
};


const HeatmapCalendar: React.FC<{ habit: Habit }> = ({ habit }) => {
    const { dispatch } = useAppContext();
    const completionsSet = useMemo(() => new Set(habit.completions.map(c => c.date)), [habit.completions]);

    const handleDayClick = (date: string) => {
        dispatch({ type: ActionType.TOGGLE_HABIT_COMPLETION, payload: { habitId: habit.id, date } });
    };

    const today = new Date();
    const days = [];
    // 7 weeks * 7 days = 49 days
    for (let i = 48; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        days.push(date);
    }

    const getIntensity = (isCompleted: boolean, date: Date) => {
        if (!isCompleted) return 'bg-gray-200 dark:bg-gray-700/50';
        const colorBase = habit.color.split('-')[1]; // e.g., 'blue' from 'text-blue-500'
        return `bg-${colorBase}-500`;
    };

    return (
        <div className="grid grid-cols-7 grid-rows-7 gap-1.5">
            {days.map(day => {
                const ymd = toYMD(day);
                const isCompleted = completionsSet.has(ymd);
                return (
                    <button
                        key={ymd}
                        onClick={(e) => { e.stopPropagation(); handleDayClick(ymd); }}
                        className={`w-5 h-5 rounded-sm ${getIntensity(isCompleted, day)} transition-transform hover:scale-110`}
                        title={day.toLocaleDateString()}
                    />
                );
            })}
        </div>
    );
};

const HabitCard: React.FC<{ habit: Habit; onEdit: (habit: Habit) => void }> = ({ habit, onEdit }) => {
    const { dispatch } = useAppContext();
    const { name, icon, color, goal, goalUnit, completions, id } = habit;
    
    const stats = useMemo(() => {
        const sortedCompletions = [...completions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const completionDates = new Set(sortedCompletions.map(c => c.date));
        
        let currentStreak = 0;
        let longestStreak = 0;
        let streak = 0;

        // Calculate current streak
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            if (completionDates.has(toYMD(date))) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Calculate longest streak
        if (sortedCompletions.length > 0) {
            streak = 1;
            longestStreak = 1;
            for (let i = 1; i < sortedCompletions.length; i++) {
                const currentDate = new Date(sortedCompletions[i].date);
                const prevDate = new Date(sortedCompletions[i-1].date);
                const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
                if (diffDays === 1) {
                    streak++;
                } else {
                    streak = 1;
                }
                longestStreak = Math.max(longestStreak, streak);
            }
        }
        
        // 30-day completion rate
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const recentCompletions = completions.filter(c => new Date(c.date) >= thirtyDaysAgo).length;
        const completionRate = (recentCompletions / 30) * 100;
        
        return { currentStreak, longestStreak, completionRate };
    }, [completions]);
    
    const handleArchive = () => {
        if(window.confirm(`Are you sure you want to archive the habit "${name}"?`)) {
            dispatch({ type: ActionType.ARCHIVE_HABIT, payload: { habitId: id } });
        }
    }
    
    const handleCardClick = () => {
        dispatch({ type: ActionType.OPEN_HABIT_DETAIL, payload: { habitId: id } });
    };

    return (
        <div onClick={handleCardClick} className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col justify-between border-l-4 ${habit.color.replace('text', 'border')} cursor-pointer`}>
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <HabitIcon name={icon} className={`w-6 h-6 ${color}`} />
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Goal: {goal} times a {goalUnit}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(habit); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleArchive(); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ArchiveIcon className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div title="Current Streak"><TargetIcon className={`w-5 h-5 mx-auto mb-1 ${color}`}/> <span className="font-bold">{stats.currentStreak}</span> days</div>
                    <div title="Longest Streak"><AwardIcon className={`w-5 h-5 mx-auto mb-1 ${color}`}/> <span className="font-bold">{stats.longestStreak}</span> days</div>
                    <div title="30d Completion"><PlusIcon className={`w-5 h-5 mx-auto mb-1 ${color}`}/> <span className="font-bold">{stats.completionRate.toFixed(0)}%</span></div>
                </div>
            </div>
            <HeatmapCalendar habit={habit} />
        </div>
    );
};

export const HabitTrackerView: React.FC = () => {
    const { state } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

    const handleOpenModal = (habit?: Habit) => {
        setHabitToEdit(habit || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setHabitToEdit(null);
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-y-auto">
            <header className="p-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Habits</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                    <PlusIcon className="w-5 h-5" /> Add New Habit
                </button>
            </header>
            <main className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {state.habits.filter(h => !h.isArchived).map(habit => (
                        <HabitCard key={habit.id} habit={habit} onEdit={() => handleOpenModal(habit)} />
                    ))}
                </div>
            </main>
            {isModalOpen && (
                <AddEditHabitModal habitToEdit={habitToEdit} onClose={handleCloseModal} />
            )}
        </div>
    );
};