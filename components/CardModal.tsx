import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, Card, Checklist, ChecklistItem, List, Label, BoardState } from '../types';
import { XIcon, TypeIcon, TagIcon, CheckSquareIcon, CalendarIcon, ZapIcon, Trash2Icon, Edit2Icon, PlusIcon, CalendarPlusIcon, LoaderIcon } from './icons';
import { refineTextWithAI, generateChecklistWithAI } from '../services/geminiService';
import { MarkdownEditor } from './MarkdownEditor';

const LabelManager: React.FC<{ card: Card; onUpdate: (updates: Partial<Card>) => void }> = ({ card, onUpdate }) => {
    const { state, dispatch } = useAppContext();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);
    const [confirmingDeleteLabelId, setConfirmingDeleteLabelId] = useState<string | null>(null);
    const [newLabelText, setNewLabelText] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('bg-blue-500');
    const popoverRef = useRef<HTMLDivElement>(null);
    
    const activeBoard = state.boards[state.activeBoardId];
    if (!activeBoard) return null;

    const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-600'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsPopoverOpen(false);
                setEditingLabel(null);
                setConfirmingDeleteLabelId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleLabel = (labelId: string) => {
        const newLabelIds = card.labelIds.includes(labelId)
            ? card.labelIds.filter(id => id !== labelId)
            : [...card.labelIds, labelId];
        onUpdate({ labelIds: newLabelIds });
    };

    const handleUpdateLabel = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLabel && editingLabel.text.trim()) {
            dispatch({ type: ActionType.UPDATE_LABEL, payload: { labelId: editingLabel.id, updates: { text: editingLabel.text, color: editingLabel.color } } });
            setEditingLabel(null);
        }
    };

    const handleAddLabel = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLabelText.trim()) {
            dispatch({ type: ActionType.ADD_LABEL, payload: { text: newLabelText, color: newLabelColor } });
            setNewLabelText('');
        }
    };

    const handleDeleteLabel = (labelId: string) => {
        dispatch({ type: ActionType.DELETE_LABEL, payload: { labelId } });
        setConfirmingDeleteLabelId(null);
        setEditingLabel(null);
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button onClick={() => setIsPopoverOpen(p => !p)} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700">
                <TagIcon className="w-5 h-5"/> <span>Labels</span>
            </button>

            {isPopoverOpen && (
                <div className="absolute z-10 mt-2 w-72 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-4">
                    <h5 className="text-center font-semibold mb-3">Labels</h5>
                    <div className="space-y-2 mb-4">
                        {Object.values(activeBoard.labels).map((label: Label) => (
                            <div key={label.id} className="flex items-center gap-2 group">
                                <input type="checkbox" checked={card.labelIds.includes(label.id)} onChange={() => handleToggleLabel(label.id)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"/>
                                <span className={`flex-1 px-2 py-1 text-xs font-semibold text-white rounded-md ${label.color}`}>{label.text}</span>
                                <button onClick={() => { setEditingLabel(label); setConfirmingDeleteLabelId(null); }} className="p-1 opacity-0 group-hover:opacity-100"><Edit2Icon className="w-4 h-4 text-gray-500"/></button>
                            </div>
                        ))}
                    </div>

                    {editingLabel ? (
                         <form onSubmit={handleUpdateLabel} className="space-y-2 p-2 border border-primary-500 rounded-md">
                             <input type="text" value={editingLabel.text} onChange={e => setEditingLabel({...editingLabel, text: e.target.value})} className="w-full text-sm p-1 rounded bg-white dark:bg-gray-800"/>
                             <div className="flex gap-1">{colors.map(c => <button key={c} type="button" onClick={() => setEditingLabel({...editingLabel, color: c})} className={`w-6 h-4 rounded ${c} ${editingLabel.color === c ? 'ring-2 ring-white' : ''}`}/>)}</div>
                             <div className="flex justify-end gap-2">
                                {confirmingDeleteLabelId === editingLabel.id ? (
                                    <>
                                        <span className="text-xs text-red-500">Remove from all cards?</span>
                                        <button onClick={() => handleDeleteLabel(editingLabel.id)} type="button" className="px-2 py-1 text-xs bg-red-600 text-white rounded">Confirm</button>
                                        <button onClick={() => setConfirmingDeleteLabelId(null)} type="button" className="px-2 py-1 text-xs hover:bg-gray-300 dark:hover:bg-gray-600 rounded">Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button type="submit" className="px-2 py-1 text-xs bg-primary-600 text-white rounded">Save</button>
                                        <button onClick={() => setConfirmingDeleteLabelId(editingLabel.id)} type="button" className="px-2 py-1 text-xs bg-red-600 text-white rounded">Delete</button>
                                    </>
                                )}
                             </div>
                         </form>
                    ) : (
                         <form onSubmit={handleAddLabel} className="space-y-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                             <input type="text" value={newLabelText} onChange={e => setNewLabelText(e.target.value)} placeholder="Create a new label" className="w-full text-sm p-1 rounded bg-white dark:bg-gray-800"/>
                             <div className="flex gap-1">{colors.map(c => <button key={c} type="button" onClick={() => setNewLabelColor(c)} className={`w-6 h-4 rounded ${c} ${newLabelColor === c ? 'ring-2 ring-white' : ''}`}/>)}</div>
                             <button type="submit" className="px-2 py-1 text-xs bg-primary-600 text-white rounded">Create</button>
                         </form>
                    )}
                </div>
            )}
        </div>
    );
};


const ChecklistComponent: React.FC<{
    checklist: Checklist;
    onUpdate: (updates: Partial<Checklist>) => void;
    onDelete: () => void;
}> = ({ checklist, onUpdate, onDelete }) => {
    const [newItemText, setNewItemText] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemText, setEditingItemText] = useState('');

    const completedCount = checklist.items.filter(i => i.isCompleted).length;
    const progress = checklist.items.length > 0 ? (completedCount / checklist.items.length) * 100 : 0;

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        const newItem: ChecklistItem = {
            id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            text: newItemText.trim(),
            isCompleted: false
        };
        onUpdate({ items: [...checklist.items, newItem] });
        setNewItemText('');
    };

    const handleToggleItem = (itemId: string) => {
        onUpdate({ items: checklist.items.map(item => item.id === itemId ? {...item, isCompleted: !item.isCompleted} : item) });
    };

    const handleDeleteItem = (itemId: string) => {
        onUpdate({ items: checklist.items.filter(item => item.id !== itemId) });
    };
    
    const handleStartEdit = (item: ChecklistItem) => {
        setEditingItemId(item.id);
        setEditingItemText(item.text);
    };

    const handleSaveEdit = (itemId: string) => {
        onUpdate({ items: checklist.items.map(item => item.id === itemId ? {...item, text: editingItemText.trim()} : item) });
        setEditingItemId(null);
        setEditingItemText('');
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold flex items-center gap-2"><CheckSquareIcon className="w-5 h-5"/> {checklist.title}</h4>
                <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1"><Trash2Icon className="w-4 h-4"/></button>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-mono">{Math.round(progress)}%</span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{width: `${progress}%`}}></div>
                </div>
            </div>
            <div className="space-y-1 pl-2">
                {checklist.items.map(item => (
                    <div key={item.id} className="group flex items-center gap-2">
                        <input type="checkbox" checked={item.isCompleted} onChange={() => handleToggleItem(item.id)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
                        {editingItemId === item.id ? (
                            <input
                                type="text" value={editingItemText} onChange={e => setEditingItemText(e.target.value)}
                                onBlur={() => handleSaveEdit(item.id)} autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(item.id)}
                                className="flex-1 bg-white dark:bg-gray-700 p-1 text-sm rounded"
                            />
                        ) : (
                            <span onClick={() => handleStartEdit(item)} className={`flex-1 text-sm ${item.isCompleted ? 'line-through text-gray-500' : ''}`}>{item.text}</span>
                        )}
                        <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100"><XIcon className="w-4 h-4"/></button>
                    </div>
                ))}
            </div>
             <form onSubmit={handleAddItem}>
                <input type="text" value={newItemText} onChange={e => setNewItemText(e.target.value)} placeholder="Add an item" className="w-full text-sm bg-gray-200 dark:bg-gray-700/50 p-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"/>
            </form>
        </div>
    );
};


export const CardModal: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { activeCardId, boards } = state;

    const activeBoard = activeCardId ? boards[state.activeBoardId] : null;

    const card = activeCardId && activeBoard ? activeBoard.cards[activeCardId.cardId] : null;
    const list = activeCardId && activeBoard ? activeBoard.lists[activeCardId.listId] : null;
    
    const [cardTitle, setCardTitle] = useState('');
    const [cardDescription, setCardDescription] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    
    const [isRefining, setIsRefining] = useState(false);
    const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    
    const [newChecklistTitle, setNewChecklistTitle] = useState('');
    const [addingChecklist, setAddingChecklist] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    useEffect(() => {
        if (card) {
            setCardTitle(card.title);
            setCardDescription(card.description || '');
        }
    }, [card]);
    
    if (!card || !list || !activeBoard) return null;

    const closeModal = () => dispatch({ type: ActionType.CLOSE_CARD_MODAL });

    const handleUpdate = (updates: Partial<Card>) => {
        dispatch({ type: ActionType.UPDATE_CARD, payload: { cardId: card.id, updates } });
    };

    const handleTitleSave = () => {
        if (cardTitle.trim() && cardTitle.trim() !== card.title) {
            handleUpdate({ title: cardTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleDescriptionSave = (newDescription: string) => {
        setCardDescription(newDescription);
        handleUpdate({ description: newDescription });
    };
    
    const displayAiError = (message: string) => {
        setAiError(message);
        setTimeout(() => setAiError(null), 4000);
    };

    const handleRefineDescription = async () => {
        setAiError(null);
        setIsRefining(true);
        try {
            const refined = await refineTextWithAI(cardDescription);
            setCardDescription(refined);
            handleUpdate({ description: refined });
        } catch (error) {
            console.error(error);
            displayAiError("Failed to refine description.");
        }
        setIsRefining(false);
    };
    
    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value ? new Date(e.target.value).toISOString() : undefined;
        handleUpdate({ dueDate: date });
    };

    const handleDeleteCard = () => {
        dispatch({ type: ActionType.DELETE_CARD, payload: { cardId: card.id, listId: list.id } });
        // The modal will close automatically because the reducer will nullify activeCardId if it's deleted.
    };

    const handleAddChecklist = () => {
        if (!newChecklistTitle.trim()) return;
        const newChecklist: Checklist = {
            id: `checklist-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title: newChecklistTitle.trim(),
            items: [],
        };
        handleUpdate({ checklists: [...card.checklists, newChecklist] });
        setNewChecklistTitle('');
        setAddingChecklist(false);
    };
    
    const handleGenerateChecklist = async () => {
        setAiError(null);
        setIsGeneratingChecklist(true);
        try {
            const checklistItems = await generateChecklistWithAI(card.title, card.description);
            const newChecklist: Checklist = {
                id: `checklist-ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                title: 'AI Generated Checklist',
                items: checklistItems.map((itemText) => ({
                    id: `item-ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    text: itemText.replace(/^- \[[x ]\] /i, ''),
                    isCompleted: false,
                })),
            };
            handleUpdate({ checklists: [...card.checklists, newChecklist] });
        } catch (error) {
            console.error(error);
            displayAiError("Failed to generate checklist.");
        } finally {
            setIsGeneratingChecklist(false);
        }
    };

    const handleUpdateChecklist = (checklistId: string, updates: Partial<Checklist>) => {
        handleUpdate({ checklists: card.checklists.map(cl => cl.id === checklistId ? { ...cl, ...updates } : cl) });
    };
    
    const handleDeleteChecklist = (checklistId: string) => {
        handleUpdate({ checklists: card.checklists.filter(cl => cl.id !== checklistId) });
    };
    
    const dueDateValue = card.dueDate ? card.dueDate.split('T')[0] : '';

    const ActionButton: React.FC<{icon: React.ReactNode; text: string; onClick:() => void; isLoading?: boolean; className?: string;}> = ({ icon, text, onClick, isLoading, className }) => (
        <button onClick={onClick} disabled={isLoading} className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 ${className}`}>
            {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin"/> : icon} <span>{text}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onMouseDown={closeModal}>
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start flex-shrink-0">
                    <div className="flex-1 mr-4">
                        {isEditingTitle ? (
                            <input type="text" value={cardTitle} onChange={e => setCardTitle(e.target.value)} onBlur={handleTitleSave} autoFocus onKeyDown={e => e.key === 'Enter' && handleTitleSave()} className="w-full bg-transparent text-2xl font-bold focus:outline-none"/>
                        ) : (
                            <h2 onClick={() => setIsEditingTitle(true)} className="text-2xl font-bold cursor-pointer">{card.title}</h2>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400">in list <span className="font-semibold">{list.title}</span></p>
                    </div>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-6 h-6"/></button>
                </header>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <main className="flex-1 p-6 overflow-y-auto space-y-6">
                        <div className="flex flex-wrap gap-1">
                            {card.labelIds.map(id => activeBoard.labels[id]).filter(Boolean).map(label => (
                                <span key={label.id} className={`px-2 py-1 text-xs font-semibold text-white rounded-md ${label.color}`}>{label.text}</span>
                            ))}
                        </div>
                        <div>
                             <h4 className="font-semibold mb-2 flex items-center gap-2"><TypeIcon className="w-5 h-5"/> Description</h4>
                             <MarkdownEditor value={cardDescription} onChange={handleDescriptionSave} />
                        </div>
                        
                        <div className="space-y-4">
                            {card.checklists.map(cl => <ChecklistComponent key={cl.id} checklist={cl} onUpdate={(updates) => handleUpdateChecklist(cl.id, updates)} onDelete={() => handleDeleteChecklist(cl.id)} />)}
                        </div>

                    </main>

                    <aside className="w-full md:w-64 flex-shrink-0 bg-gray-200/50 dark:bg-gray-900/20 p-4 space-y-4 overflow-y-auto border-t md:border-l md:border-t-0 border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400">Add to card</h3>
                        <LabelManager card={card} onUpdate={handleUpdate} />
                        
                        {addingChecklist ? (
                            <div className="p-2 border border-primary-500 rounded-md">
                                <input type="text" placeholder="Checklist title" autoFocus value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} className="w-full text-sm p-1 rounded bg-white dark:bg-gray-800"/>
                                <div className="flex gap-2 mt-2"><button onClick={handleAddChecklist} className="px-2 py-1 text-xs bg-primary-600 text-white rounded">Add</button><button onClick={() => setAddingChecklist(false)} className="px-2 py-1 text-xs hover:bg-gray-300 dark:hover:bg-gray-600 rounded">Cancel</button></div>
                            </div>
                        ) : (
                             <ActionButton icon={<CheckSquareIcon className="w-5 h-5"/>} text="Checklist" onClick={() => setAddingChecklist(true)}/>
                        )}

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-semibold text-sm">Due date</h4>
                                {card.dueDate && <button onClick={() => handleUpdate({dueDate: undefined})} className="text-xs text-gray-500 hover:underline">Remove</button>}
                            </div>
                            <input type="date" value={dueDateValue} onChange={handleDueDateChange} className="w-full p-2 text-sm rounded-md bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600" />
                        </div>
                        
                        <div className="pt-2">
                          <h3 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">AI Actions</h3>
                          {aiError && <p className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded-md mb-2">{aiError}</p>}
                          <div className="space-y-2">
                             <ActionButton icon={<ZapIcon className="w-5 h-5"/>} text="Refine Description" onClick={handleRefineDescription} isLoading={isRefining}/>
                             <ActionButton icon={<CalendarPlusIcon className="w-5 h-5"/>} text="Generate Checklist" onClick={handleGenerateChecklist} isLoading={isGeneratingChecklist}/>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <h3 className="text-sm font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Actions</h3>
                          {isConfirmingDelete ? (
                              <div>
                                  <p className="text-xs text-center mb-2">Are you sure?</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button onClick={handleDeleteCard} className="w-full text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
                                    <button onClick={() => setIsConfirmingDelete(false)} className="w-full text-sm px-3 py-1.5 rounded-md bg-gray-300 dark:bg-gray-600 hover:bg-gray-400">Cancel</button>
                                  </div>
                              </div>
                          ) : (
                             <ActionButton icon={<Trash2Icon className="w-5 h-5"/>} text="Delete Card" onClick={() => setIsConfirmingDelete(true)} className="bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-500/20"/>
                          )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
