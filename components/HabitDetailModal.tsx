import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType } from '../types';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

const toYMD = (date: Date): string => date.toISOString().split('T')[0];

const MonthlyCalendar: React.FC<{
    viewDate: Date;
    completions: Set<string>;
    onDayClick: (date: string) => void;
    habitColor: string;
    selectedDate: string;
    onDateSelect: (date: string) => void;
}> = ({ viewDate, completions, onDayClick, habitColor, selectedDate, onDateSelect }) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    const emptyDays = Array.from({ length: firstDay });
    
    const colorBase = habitColor.split('-')[1];

    return (
        <div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day} className="font-medium text-gray-500 dark:text-gray-400">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {emptyDays.map((_, i) => <div key={`empty-${i}`}></div>)}
                {calendarDays.map(day => {
                    const ymd = toYMD(day);
                    const isCompleted = completions.has(ymd);
                    const isSelectedForNote = ymd === selectedDate;
                    
                    return (
                        <div key={ymd} className="relative aspect-square">
                            <button
                                onClick={() => onDateSelect(ymd)}
                                className={`w-full h-full rounded-full transition-colors flex items-center justify-center
                                ${isSelectedForNote ? `ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800` : ''}
                                ${isCompleted ? `bg-${colorBase}-500 text-white hover:bg-${colorBase}-600` : `bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600`}
                            `}
                            >
                                {day.getDate()}
                            </button>
                             <button
                                 onClick={() => onDayClick(ymd)}
                                 className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 ${isCompleted ? `bg-white dark:bg-gray-900 border-${colorBase}-500` : 'bg-transparent border-gray-400'}`}
                             />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const HabitDetailModal: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { activeHabitId, habits } = state;

    const habit = useMemo(() => habits.find(h => h.id === activeHabitId), [activeHabitId, habits]);

    const [viewDate, setViewDate] = useState(new Date());
    const [noteText, setNoteText] = useState('');
    const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));

    useEffect(() => {
        if (habit?.notes && habit.notes[selectedDate]) {
            setNoteText(habit.notes[selectedDate]);
        } else {
            setNoteText('');
        }
    }, [selectedDate, habit]);

    if (!habit) return null;

    const completionsSet = new Set(habit.completions.map(c => c.date));

    const closeModal = () => dispatch({ type: ActionType.CLOSE_HABIT_DETAIL });

    const handleToggleCompletion = (date: string) => {
        dispatch({ type: ActionType.TOGGLE_HABIT_COMPLETION, payload: { habitId: habit.id, date } });
    };

    const handleNoteSave = () => {
        dispatch({ type: ActionType.ADD_HABIT_NOTE, payload: { habitId: habit.id, date: selectedDate, text: noteText }});
    };
    
    const changeMonth = (offset: number) => {
        setViewDate(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    };

    const stats = useMemo(() => {
        const sortedCompletions = [...habit.completions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const completionDates = new Set(sortedCompletions.map(c => c.date));
        
        let currentStreak = 0;
        let longestStreak = 0;
        let streak = 0;

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
        
        const totalCompletions = habit.completions.length;
        const habitAgeDays = Math.max(1, (new Date().getTime() - new Date(habit.createdAt).getTime()) / (1000 * 3600 * 24));
        const successRate = habitAgeDays > 0 ? (totalCompletions / habitAgeDays) * 100 : 0;
        
        return { currentStreak, longestStreak, totalCompletions, successRate: successRate.toFixed(0) };
    }, [habit.completions, habit.createdAt]);


    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onMouseDown={closeModal}>
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">{habit.name}</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-6 h-6"/></button>
                </header>
                <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                    <main className="flex-1 p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5"/></button>
                            <h3 className="font-semibold text-lg">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5"/></button>
                        </div>
                        <MonthlyCalendar 
                            viewDate={viewDate} 
                            completions={completionsSet} 
                            onDayClick={handleToggleCompletion} 
                            habitColor={habit.color}
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                        />
                    </main>
                    <aside className="w-full md:w-80 flex-shrink-0 bg-white dark:bg-gray-800/50 p-6 border-t md:border-l md:border-t-0 border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 flex-shrink-0">Statistics</h3>
                        <div className="space-y-3 mb-6 flex-shrink-0">
                           <p><strong>Current Streak:</strong> {stats.currentStreak} days</p>
                           <p><strong>Longest Streak:</strong> {stats.longestStreak} days</p>
                           <p><strong>Total Completions:</strong> {stats.totalCompletions}</p>
                           <p><strong>Overall Success Rate:</strong> {stats.successRate}%</p>
                        </div>
                        <h3 className="text-lg font-bold mb-4 flex-shrink-0">Daily Note for {new Date(selectedDate + 'T12:00:00').toLocaleDateString()}</h3>
                         <input 
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="w-full mb-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex-shrink-0"
                        />
                        <textarea 
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            onBlur={handleNoteSave}
                            placeholder="Add a note for this day..."
                            className="w-full flex-1 p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 resize-none"
                        />
                    </aside>
                </div>
            </div>
        </div>
    );
};