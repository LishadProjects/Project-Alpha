import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, Habit, TrashedCard, TrashedNote } from '../types';
import { XIcon, Trash2Icon, RotateCcwIcon, DumbbellIcon, BookOpenIcon, LeafIcon, WaterBottleIcon, PlusIcon } from './icons';

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

export const TrashModal: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [activeTab, setActiveTab] = useState<'cards' | 'notes' | 'habits'>('cards');
    
    const activeBoard = state.boards[state.activeBoardId];

    const trashedCards = activeBoard ? Object.values(activeBoard.trashedCards).sort((a: TrashedCard, b: TrashedCard) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()) : [];
    const trashedNotes = Object.values(state.trashedNotes || {}).sort((a: TrashedNote, b: TrashedNote) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    const archivedHabits = [...(state.archivedHabits || [])].sort((a: Habit, b: Habit) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const closeModal = () => dispatch({ type: ActionType.CLOSE_TRASH_MODAL });

    const handleRestoreCard = (cardId: string) => {
        dispatch({ type: ActionType.RESTORE_CARD, payload: { cardId } });
    };
     const handleRestoreNote = (noteId: string) => {
        dispatch({ type: ActionType.RESTORE_NOTE, payload: { noteId } });
    };
     const handleRestoreHabit = (habitId: string) => {
        dispatch({ type: ActionType.RESTORE_HABIT, payload: { habitId } });
    };

    const handlePermanentDeleteCard = (cardId: string) => {
        if (window.confirm('This card will be deleted forever. This action cannot be undone.')) {
            dispatch({ type: ActionType.PERMANENTLY_DELETE_CARD, payload: { cardId } });
        }
    };
    const handlePermanentDeleteNote = (noteId: string) => {
        if (window.confirm('This note will be deleted forever. This action cannot be undone.')) {
            dispatch({ type: ActionType.PERMANENTLY_DELETE_NOTE, payload: { noteId } });
        }
    };
    const handlePermanentDeleteHabit = (habitId: string) => {
        if (window.confirm('This habit will be deleted forever. This action cannot be undone.')) {
            dispatch({ type: ActionType.PERMANENTLY_DELETE_HABIT, payload: { habitId } });
        }
    };

    const handleEmptyTrash = () => {
        if (window.confirm('Are you sure you want to permanently delete all items in the trash? This action cannot be undone.')) {
            dispatch({ type: ActionType.EMPTY_TRASH });
        }
    };
    
    const calculateDaysLeft = (deletedAt: string) => {
        const deleteDate = new Date(deletedAt);
        const thirtyDaysLater = new Date(deleteDate);
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        
        const now = new Date();
        const diffTime = thirtyDaysLater.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const EmptyState: React.FC<{ type: string }> = ({ type }) => (
        <div className="text-center text-gray-500 py-10">
            <Trash2Icon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold">Trash is empty</h3>
            <p>Deleted {type} will appear here.</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onMouseDown={closeModal}>
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Trash2Icon className="w-6 h-6 text-primary-500" />
                        <h2 className="text-xl font-bold">Trash</h2>
                    </div>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 pt-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <div className="flex -mb-px">
                            <button onClick={() => setActiveTab('cards')} className={`px-4 py-2 text-sm font-semibold border-b-2 ${activeTab === 'cards' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                Cards ({trashedCards.length})
                            </button>
                            <button onClick={() => setActiveTab('notes')} className={`px-4 py-2 text-sm font-semibold border-b-2 ${activeTab === 'notes' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                Notes ({trashedNotes.length})
                            </button>
                            <button onClick={() => setActiveTab('habits')} className={`px-4 py-2 text-sm font-semibold border-b-2 ${activeTab === 'habits' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                Habits ({archivedHabits.length})
                            </button>
                        </div>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                        {activeTab === 'cards' && (
                            trashedCards.length > 0 ? (
                                <div className="space-y-2">
                                    {trashedCards.map((card: TrashedCard) => {
                                        const list = activeBoard?.lists[card.originalListId];
                                        const daysLeft = calculateDaysLeft(card.deletedAt);
                                        return (
                                            <div key={card.id} className="group flex items-center gap-4 p-3 rounded-md bg-white dark:bg-gray-700/50 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                                                <div className="flex-1">
                                                    <p className="font-semibold">{card.title}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">From list: {list ? list.title : 'Unknown'}</p>
                                                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{daysLeft > 0 ? `Permanently deleted in ${daysLeft} day(s)` : 'Will be deleted soon'}</p>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleRestoreCard(card.id)} className="p-2 text-gray-500 hover:text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30" title="Restore Card"><RotateCcwIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handlePermanentDeleteCard(card.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30" title="Delete Forever"><Trash2Icon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState type="cards" />
                            )
                        )}
                        {activeTab === 'notes' && (
                           trashedNotes.length > 0 ? (
                               <div className="space-y-2">
                                   {trashedNotes.map((note: TrashedNote) => {
                                       const notebook = state.notebooks[note.notebookId];
                                       const daysLeft = calculateDaysLeft(note.deletedAt);
                                       return (
                                           <div key={note.id} className="group flex items-center gap-4 p-3 rounded-md bg-white dark:bg-gray-700/50 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                                                <div className="flex-1">
                                                    <p className="font-semibold">{note.title}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">From notebook: {notebook ? notebook.name : 'Unknown'}</p>
                                                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">{daysLeft > 0 ? `Permanently deleted in ${daysLeft} day(s)` : 'Will be deleted soon'}</p>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleRestoreNote(note.id)} className="p-2 text-gray-500 hover:text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30" title="Restore Note"><RotateCcwIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handlePermanentDeleteNote(note.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30" title="Delete Forever"><Trash2Icon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                       );
                                   })}
                               </div>
                           ) : <EmptyState type="notes" />
                        )}
                        {activeTab === 'habits' && (
                            archivedHabits.length > 0 ? (
                                <div className="space-y-2">
                                    {archivedHabits.map((habit: Habit) => (
                                        <div key={habit.id} className="group flex items-center gap-4 p-3 rounded-md bg-white dark:bg-gray-700/50 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                                            <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
                                                <HabitIcon name={habit.icon} className={`w-6 h-6 ${habit.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{habit.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Archived on: {new Date(habit.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleRestoreHabit(habit.id)} className="p-2 text-gray-500 hover:text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30" title="Restore Habit"><RotateCcwIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handlePermanentDeleteHabit(habit.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30" title="Delete Forever"><Trash2Icon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyState type="habits" />
                        )}
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Items are permanently deleted after 30 days.</p>
                    <button 
                        onClick={handleEmptyTrash} 
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-semibold disabled:opacity-50"
                        disabled={trashedCards.length === 0 && trashedNotes.length === 0 && archivedHabits.length === 0}
                    >
                        Empty Trash
                    </button>
                </footer>
            </div>
        </div>
    );
};