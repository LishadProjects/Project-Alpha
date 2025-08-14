import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, Habit } from '../types';
import { XIcon, PlusIcon, DumbbellIcon, BookOpenIcon, LeafIcon, WaterBottleIcon } from './icons';

const habitIcons = [
    { name: 'DumbbellIcon', component: DumbbellIcon },
    { name: 'BookOpenIcon', component: BookOpenIcon },
    { name: 'LeafIcon', component: LeafIcon },
    { name: 'WaterBottleIcon', component: WaterBottleIcon },
    { name: 'PlusIcon', component: PlusIcon },
];

const habitColors = [
    'text-rose-500',
    'text-amber-500',
    'text-green-500',
    'text-blue-500',
    'text-indigo-500',
    'text-purple-500',
];

export const AddEditHabitModal: React.FC<{
    habitToEdit: Habit | null;
    onClose: () => void;
}> = ({ habitToEdit, onClose }) => {
    const { dispatch } = useAppContext();
    
    const [name, setName] = useState(habitToEdit?.name || '');
    const [icon, setIcon] = useState(habitToEdit?.icon || 'PlusIcon');
    const [color, setColor] = useState(habitToEdit?.color || 'text-blue-500');
    const [goal, setGoal] = useState(habitToEdit?.goal || 5);
    const [goalUnit] = useState<'week'>(habitToEdit?.goalUnit || 'week');

    const isEditing = !!habitToEdit;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const payload = { name: name.trim(), icon, color, goal, goalUnit };

        if (isEditing) {
            dispatch({ type: ActionType.UPDATE_HABIT, payload: { habitId: habitToEdit.id, updates: payload } });
        } else {
            dispatch({ type: ActionType.ADD_HABIT, payload });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onMouseDown={onClose}>
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl w-full max-w-lg" onMouseDown={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-bold">{isEditing ? 'Edit Habit' : 'Create New Habit'}</h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </header>
                    <main className="p-6 space-y-4">
                        <div>
                            <label htmlFor="habit-name" className="text-sm font-medium">Name</label>
                            <input
                                id="habit-name"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g., Read every day"
                                required
                                className="w-full mt-1 p-2 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Icon</label>
                            <div className="mt-1 flex gap-2 p-2 bg-white dark:bg-gray-700 rounded-md">
                                {habitIcons.map(({ name: iconName, component: IconComponent }) => (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setIcon(iconName)}
                                        className={`p-2 rounded-md transition-colors ${icon === iconName ? 'bg-primary-100 dark:bg-primary-900/50' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                    >
                                        <IconComponent className={`w-6 h-6 ${color}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Color</label>
                            <div className="mt-1 flex gap-2 p-2 bg-white dark:bg-gray-700 rounded-md">
                                {habitColors.map(colorValue => (
                                    <button
                                        key={colorValue}
                                        type="button"
                                        onClick={() => setColor(colorValue)}
                                        className={`w-8 h-8 rounded-full transition-all ${colorValue.replace('text', 'bg')} ${color === colorValue ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-700 ring-primary-500' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Goal</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="number"
                                    value={goal}
                                    onChange={e => setGoal(Math.max(1, parseInt(e.target.value, 10)))}
                                    min="1"
                                    className="w-24 p-2 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                                />
                                <span className="text-gray-600 dark:text-gray-400">times a week</span>
                            </div>
                        </div>

                    </main>
                    <footer className="p-4 bg-gray-200 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                            {isEditing ? 'Save Changes' : 'Create Habit'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};