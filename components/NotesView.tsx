
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, AppAction, Note, Notebook, Tag } from '../types';
import { PlusIcon, NotebookIcon, Trash2Icon, EditIcon, MoreVerticalIcon, SearchIcon, BookOpenIcon, XIcon, TagIcon, ChevronDownIcon, ZapIcon, BookmarkIcon, BookmarkFillIcon, InfoIcon, HistoryIcon, DownloadIcon, LayoutGridIcon, ListIcon, ChevronLeftIcon } from './icons';
import { MarkdownEditor } from './MarkdownEditor';
import { generateTagsWithAI } from '../services/geminiService';

const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
    const timeoutRef = useRef<number | null>(null);
    return (...args: any[]) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

function stripMarkdown(markdown: string): string {
    if (!markdown) return '';
    return markdown
        .replace(/#+\s/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/(\*|_|`|~){1,3}(.*?)\1{1,3}/g, '$2')
        .replace(/(\r\n|\n|\r)/gm, " ")
        .trim();
}

const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- Sub-components for NotesView ---

const NoteListItem: React.FC<{ note: Note; isActive: boolean; onClick: () => void; onDragStart: (e: React.DragEvent) => void; onContextMenu: (e: React.MouseEvent) => void; }> = ({ note, isActive, onClick, onDragStart, onContextMenu }) => {
    const { state } = useAppContext();
    const noteTags = note.tagIds.map(id => state.tags[id]).filter(Boolean);

    return (
        <div
            onClick={onClick}
            onContextMenu={onContextMenu}
            draggable
            onDragStart={onDragStart}
            className={`p-4 border-b border-gray-200/50 dark:border-gray-700/50 cursor-pointer group relative note-item-enter transition-colors duration-150 ${isActive ? 'bg-primary-50 dark:bg-primary-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
        >
            <div className="flex justify-between items-start">
                <h3 className="font-bold truncate pr-6 text-gray-800 dark:text-gray-100">{note.title || 'Untitled Note'}</h3>
                {note.pinned && <BookmarkFillIcon className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{formatDate(note.updatedAt)} <span className="mx-1">&middot;</span> {stripMarkdown(note.content).substring(0, 100) || 'No content'}</p>
            {noteTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {noteTags.map(tag => (
                        <span key={tag.id} className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">{tag.name}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

const NoteGridItem: React.FC<{ note: Note; isActive: boolean; onClick: () => void; onDragStart: (e: React.DragEvent) => void; onContextMenu: (e: React.MouseEvent) => void; }> = ({ note, isActive, onClick, onDragStart, onContextMenu }) => {
    const { state } = useAppContext();
    const noteTags = note.tagIds.map(id => state.tags[id]).filter(Boolean);
    
    return (
        <div
            onClick={onClick}
            onContextMenu={onContextMenu}
            draggable
            onDragStart={onDragStart}
            className={`note-item-enter rounded-lg border dark:border-gray-700 cursor-pointer group relative transition-all duration-150 flex flex-col h-48
            ${isActive ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700 ring-2 ring-primary-500' : 'bg-white dark:bg-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'}`}
        >
             {note.pinned && <BookmarkFillIcon className="w-4 h-4 text-yellow-500 absolute top-2 right-2" />}
            <div className="p-3 flex-1 overflow-hidden">
                <h3 className="font-bold truncate pr-6 text-gray-800 dark:text-gray-100">{note.title || 'Untitled Note'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 break-words line-clamp-3">{stripMarkdown(note.content) || 'No content'}</p>
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-gray-700/50 flex-shrink-0">
                {noteTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {noteTags.slice(0, 2).map(tag => (
                            <span key={tag.id} className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">{tag.name}</span>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(note.updatedAt)}</p>
            </div>
        </div>
    );
};


const NotebookContextMenu: React.FC<{ notebook: Notebook; position: { x: number; y: number }; onClose: () => void; dispatch: React.Dispatch<AppAction>; }> = ({ notebook, position, onClose, dispatch }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) { onClose(); } };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleRename = () => {
        const newName = prompt("Enter new notebook name:", notebook.name);
        if (newName && newName.trim()) { dispatch({ type: ActionType.UPDATE_NOTEBOOK, payload: { id: notebook.id, name: newName.trim() } }); }
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the notebook "${notebook.name}"? All notes inside will be moved to trash.`)) { dispatch({ type: ActionType.DELETE_NOTEBOOK, payload: { id: notebook.id } }); }
        onClose();
    };

    return (
        <div ref={menuRef} style={{ top: position.y, left: position.x }} className="fixed z-50 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-md p-1 border border-gray-200 dark:border-gray-700">
            <button onClick={handleRename} className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><EditIcon className="w-4 h-4" /> Rename</button>
            <button onClick={handleDelete} className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"><Trash2Icon className="w-4 h-4" /> Delete</button>
        </div>
    );
};

const NoteContextMenu: React.FC<{ note: Note; position: { x: number; y: number }; onClose: () => void; dispatch: React.Dispatch<AppAction>; }> = ({ note, position, onClose, dispatch }) => {
    const { state } = useAppContext();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) { onClose(); } };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handlePinToggle = () => { dispatch({ type: ActionType.TOGGLE_NOTE_PIN, payload: { noteId: note.id } }); onClose(); };
    const handleDelete = () => { if (window.confirm(`Move "${note.title || 'Untitled Note'}" to trash?`)) { dispatch({ type: ActionType.DELETE_NOTE, payload: { noteId: note.id } }); } onClose(); };
    const handleMove = (notebookId: string) => { dispatch({ type: ActionType.UPDATE_NOTE, payload: { noteId: note.id, updates: { notebookId } } }); onClose(); };

    return (
        <div ref={menuRef} style={{ top: position.y, left: position.x }} className="fixed z-50 w-56 bg-white dark:bg-gray-800 shadow-xl rounded-md p-1 border border-gray-200 dark:border-gray-700">
            <button onClick={handlePinToggle} className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                {note.pinned ? <BookmarkFillIcon className="w-4 h-4"/> : <BookmarkIcon className="w-4 h-4"/>} {note.pinned ? 'Unpin' : 'Pin Note'}
            </button>
            <div className="relative group">
                 <button className="w-full text-left flex items-center justify-between gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="flex items-center gap-3"><NotebookIcon className="w-4 h-4"/> Move to</span>
                    <ChevronDownIcon className="w-4 h-4 -rotate-90"/>
                </button>
                <div className="absolute left-full top-0 -mt-2 w-56 bg-white dark:bg-gray-800 shadow-xl rounded-md p-1 border border-gray-200 dark:border-gray-700 hidden group-hover:block max-h-60 overflow-y-auto">
                    {Object.values(state.notebooks).map(nb => (
                        <button key={nb.id} disabled={nb.id === note.notebookId} onClick={() => handleMove(nb.id)} className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                            {nb.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="my-1 h-px bg-gray-200 dark:bg-gray-700"/>
            <button onClick={handleDelete} className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30">
                <Trash2Icon className="w-4 h-4" /> Delete
            </button>
        </div>
    );
};

const EditorHeader: React.FC<{ note: Note; onDelete: () => void; dispatch: React.Dispatch<AppAction>; isMobile: boolean; onBack: () => void; }> = ({ note, onDelete, dispatch, isMobile, onBack }) => {
    const [title, setTitle] = useState(note.title);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const infoRef = useRef<HTMLDivElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    
    const debouncedTitleUpdate = useDebounce((newTitle: string) => {
        dispatch({ type: ActionType.UPDATE_NOTE, payload: { noteId: note.id, updates: { title: newTitle } } });
    }, 500);

    useEffect(() => { setTitle(note.title); }, [note]);
    useEffect(() => { if (title !== note.title) { debouncedTitleUpdate(title); } }, [title, note.title, debouncedTitleUpdate]);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (infoRef.current && !infoRef.current.contains(event.target as Node)) { setIsInfoOpen(false); }
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) { setIsMoreMenuOpen(false); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const wordCount = useMemo(() => note.content?.match(/\b\w+\b/g)?.length || 0, [note.content]);

    return (
        <div className="p-4 md:p-6 flex-shrink-0 flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700">
            {isMobile && (
                 <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ChevronLeftIcon className="w-6 h-6"/>
                </button>
            )}
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" className="w-full bg-transparent text-xl md:text-2xl font-bold focus:outline-none"/>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => dispatch({ type: ActionType.TOGGLE_NOTE_PIN, payload: { noteId: note.id } })} title={note.pinned ? "Unpin note" : "Pin note"} className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${note.pinned ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {note.pinned ? <BookmarkFillIcon className="w-5 h-5"/> : <BookmarkIcon className="w-5 h-5"/>}
                </button>
                <div className="relative" ref={infoRef}>
                    <button onClick={() => setIsInfoOpen(p => !p)} title="Note Info" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"><InfoIcon className="w-5 h-5"/></button>
                    {isInfoOpen && (
                        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 shadow-xl rounded-md p-3 border border-gray-200 dark:border-gray-700 z-10 text-sm space-y-2">
                           <p><strong>Words:</strong> {wordCount}</p>
                           <p><strong>Characters:</strong> {note.content.length}</p>
                           <p><strong>Created:</strong> {new Date(note.createdAt).toLocaleString()}</p>
                           <p><strong>Updated:</strong> {new Date(note.updatedAt).toLocaleString()}</p>
                        </div>
                    )}
                </div>
                 <div className="relative" ref={moreMenuRef}>
                    <button onClick={() => setIsMoreMenuOpen(p => !p)} title="More actions" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"><MoreVerticalIcon className="w-5 h-5"/></button>
                    {isMoreMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 shadow-xl rounded-md p-1 border border-gray-200 dark:border-gray-700 z-10">
                            <button className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><HistoryIcon className="w-4 h-4"/> Version History</button>
                            <button className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><DownloadIcon className="w-4 h-4"/> Export as Markdown</button>
                            <div className="my-1 h-px bg-gray-200 dark:bg-gray-700"/>
                            <button onClick={onDelete} className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"><Trash2Icon className="w-4 h-4"/> Delete Note</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TagEditor: React.FC<{ note: Note; onUpdate: (updates: Partial<Note>) => void }> = ({ note, onUpdate }) => {
    const { state, dispatch } = useAppContext();
    const [inputValue, setInputValue] = useState('');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (editorRef.current && !editorRef.current.contains(event.target as Node)) { setIsPopoverOpen(false); } };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddTag = (tagId: string) => {
        if (!note.tagIds.includes(tagId)) { onUpdate({ tagIds: [...note.tagIds, tagId] }); }
    };

    const handleCreateAndAddTag = (tagName: string) => {
        if (!tagName) return;
        const normalizedTagName = tagName.toLowerCase();
        const existingTag = Object.values(state.tags).find(t => t.name === normalizedTagName);
        if (existingTag) { handleAddTag(existingTag.id); } 
        else { dispatch({ type: ActionType.ADD_TAG, payload: { name: normalizedTagName } }); }
        setInputValue('');
    };
    
    const handleGenerateAITags = async () => {
        setIsGenerating(true);
        try {
            const tagNames = await generateTagsWithAI(note.title, note.content);
            dispatch({ type: ActionType.ADD_AI_TAGS_TO_NOTE, payload: { noteId: note.id, tagNames }});
        } catch (error) { console.error(error); alert("Failed to generate AI tags."); } 
        finally { setIsGenerating(false); }
    };

    const handleRemoveTag = (tagIdToRemove: string) => { onUpdate({ tagIds: note.tagIds.filter(id => id !== tagIdToRemove) }); };

    const displayedTags = note.tagIds.map(tagId => state.tags[tagId]).filter(Boolean);
    const availableTags = Object.values(state.tags).filter(t => !note.tagIds.includes(t.id) && t.name.toLowerCase().includes(inputValue.toLowerCase()));

    return (
        <div ref={editorRef} className="relative">
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <TagIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                {displayedTags.map(tag => (
                    <div key={tag.id} className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-sm rounded-full px-2 py-0.5">
                        <span>{tag.name}</span>
                        <button onClick={() => handleRemoveTag(tag.id)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"><XIcon className="w-3 h-3"/></button>
                    </div>
                ))}
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onFocus={() => setIsPopoverOpen(true)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAddTag(inputValue); }} placeholder="Add a tag..." className="flex-1 bg-transparent text-sm focus:outline-none min-w-[80px]"/>
            </div>
            {isPopoverOpen && (
                <div className="absolute bottom-full left-0 w-full max-w-sm mb-2 p-2 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-10">
                    {availableTags.length > 0 && (
                        <div className="max-h-40 overflow-y-auto">
                            {availableTags.map(tag => ( <button key={tag.id} onClick={() => { handleAddTag(tag.id); setIsPopoverOpen(false); }} className="w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">{tag.name}</button>))}
                        </div>
                    )}
                    {inputValue.trim() && !Object.values(state.tags).some(t => t.name === inputValue.trim().toLowerCase()) && (
                         <button onClick={() => handleCreateAndAddTag(inputValue)} className="w-full text-left text-sm px-2 py-1 rounded text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700">Create new tag: "{inputValue.trim()}"</button>
                    )}
                     <button onClick={handleGenerateAITags} disabled={isGenerating} className="w-full text-left text-sm px-2 py-1.5 mt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                        <ZapIcon className="w-4 h-4"/> {isGenerating ? 'Generating...' : 'Suggest with AI'}
                    </button>
                </div>
            )}
        </div>
    );
};

const EditorPane: React.FC<{ activeNote: Note | null; onDelete: (noteId: string) => void; isMobile: boolean; onBack: () => void; }> = ({ activeNote, onDelete, isMobile, onBack }) => {
    const { dispatch } = useAppContext();
    const [content, setContent] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle');
    const saveTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (activeNote) {
            setContent(activeNote.content);
            setSaveStatus('idle');
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        }
    }, [activeNote]);

    const debouncedSave = useDebounce((noteToSave: Note, newContent: string) => {
        setSaveStatus('saving');
        dispatch({ type: ActionType.UPDATE_NOTE, payload: { noteId: noteToSave.id, updates: { content: newContent } } });
        saveTimeoutRef.current = window.setTimeout(() => {
            setSaveStatus('saved');
            saveTimeoutRef.current = window.setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    }, 1000);

    useEffect(() => {
        if (!activeNote || content === activeNote.content) return;
        setSaveStatus('dirty');
        debouncedSave(activeNote, content);
    }, [content, activeNote, debouncedSave]);
    
    const handleTagUpdate = (updates: Partial<Note>) => { if (activeNote) { dispatch({ type: ActionType.UPDATE_NOTE, payload: { noteId: activeNote.id, updates } }); } };

    if (!activeNote) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center"><NotebookIcon className="w-24 h-24 text-gray-300 dark:text-gray-700 mb-4"/><h3 className="text-xl font-semibold">Select a note to view</h3><p>Or create a new note to get started.</p></div>
        );
    }

    const saveStatusText = { idle: '', dirty: 'Unsaved changes', saving: 'Saving...', saved: 'All changes saved' };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900 h-full">
            <EditorHeader note={activeNote} onDelete={() => onDelete(activeNote.id)} dispatch={dispatch} isMobile={isMobile} onBack={onBack}/>
            <div className="px-4 md:px-6 pb-4 flex-1 flex flex-col min-h-0"><MarkdownEditor value={content} onChange={setContent} placeholder="Start writing... You can use markdown."/></div>
            <footer className="p-4 md:px-6 flex-shrink-0 flex items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700">
                <TagEditor note={activeNote} onUpdate={handleTagUpdate} />
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{saveStatusText[saveStatus]}</span>
            </footer>
        </div>
    );
};

const TrashedNoteView: React.FC<{ note: Note }> = ({ note }) => {
    const { dispatch } = useAppContext();
    const handleRestore = () => { dispatch({ type: ActionType.RESTORE_NOTE, payload: { noteId: note.id } }); };
    const handlePermanentDelete = () => { if (window.confirm(`Are you sure you want to permanently delete "${note.title || 'Untitled Note'}"? This action cannot be undone.`)) { dispatch({ type: ActionType.PERMANENTLY_DELETE_NOTE, payload: { noteId: note.id } }); } };
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-gray-800/50"><Trash2Icon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"/><h3 className="text-xl font-bold">Note in Trash</h3><p className="text-gray-600 dark:text-gray-400 mb-6">"{note.title || 'Untitled Note'}"</p><div className="flex gap-4"><button onClick={handleRestore} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Restore Note</button><button onClick={handlePermanentDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete Permanently</button></div></div>
    );
};

export const NotesView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { notebooks, notes, notebookOrder, trashedNotes, tags } = state;
    const [filter, setFilter] = useState<{ type: 'all' | 'notebook' | 'tag' | 'pinned' | 'trash', id: string | null }>({ type: 'all', id: null });
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notebookMenu, setNotebookMenu] = useState<{ id: string; x: number; y: number; } | null>(null);
    const [noteMenu, setNoteMenu] = useState<{ note: Note; x: number; y: number; } | null>(null);
    const [isTagsExpanded, setIsTagsExpanded] = useState(true);
    const [isNotebooksExpanded, setIsNotebooksExpanded] = useState(true);
    const [dragOverNotebook, setDragOverNotebook] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    
    // --- Mobile State Management ---
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [mobileView, setMobileView] = useState<'sidebar' | 'list' | 'editor'>('sidebar');

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const allNotes = useMemo(() => Object.values(notes), [notes]);
    const notesByNotebook = useMemo(() => { const counts: Record<string, number> = {}; for (const note of allNotes) { counts[note.notebookId] = (counts[note.notebookId] || 0) + 1; } return counts; }, [allNotes]);
    const notesByTag = useMemo(() => { const counts: Record<string, number> = {}; for (const note of allNotes) { for (const tagId of note.tagIds) { counts[tagId] = (counts[tagId] || 0) + 1; } } return counts; }, [allNotes]);

    const filteredNotes = useMemo(() => {
        let notesInScope: Note[] = [];
        switch (filter.type) {
            case 'trash': notesInScope = Object.values(trashedNotes); break;
            case 'pinned': notesInScope = allNotes.filter(n => n.pinned); break;
            case 'notebook': notesInScope = allNotes.filter(n => n.notebookId === filter.id); break;
            case 'tag': notesInScope = allNotes.filter(n => n.tagIds.includes(filter.id!)); break;
            case 'all': default: notesInScope = allNotes; break;
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            notesInScope = notesInScope.filter(n => n.title.toLowerCase().includes(lower) || stripMarkdown(n.content).toLowerCase().includes(lower) || n.tagIds.some(tagId => tags[tagId]?.name.toLowerCase().includes(lower)));
        }
        return notesInScope.sort((a, b) => (a.pinned !== b.pinned) ? (a.pinned ? -1 : 1) : (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    }, [allNotes, trashedNotes, tags, filter, searchTerm]);
    
    useEffect(() => {
        if (state.noteToView) {
            const { notebookId, noteId } = state.noteToView;
            setFilter({ type: 'notebook', id: notebookId });
            setActiveNoteId(noteId);
            if (isMobile) setMobileView('editor');
            dispatch({ type: ActionType.CLEAR_NOTE_TO_VIEW });
        }
    }, [state.noteToView, dispatch, isMobile]);

    useEffect(() => {
        if (filteredNotes.length > 0 && !filteredNotes.some(n => n.id === activeNoteId)) { setActiveNoteId(filteredNotes[0].id); } 
        else if (filteredNotes.length === 0) { setActiveNoteId(null); }
    }, [filteredNotes, activeNoteId]);

    const activeNote = useMemo(() => (activeNoteId ? notes[activeNoteId] || trashedNotes[activeNoteId] : null), [notes, trashedNotes, activeNoteId]);
    
    const handleNewNote = () => {
        const targetNotebookId = filter.type === 'notebook' ? filter.id : (notebookOrder[0] || null);
        if (!targetNotebookId) { alert("Please create a notebook first."); return; }
        dispatch({ type: ActionType.ADD_NOTE, payload: { notebookId: targetNotebookId, title: '' } });
    };

    const handleDeleteNote = useCallback((noteId: string) => {
        const noteToDelete = notes[noteId];
        if (noteToDelete) { dispatch({ type: ActionType.DELETE_NOTE, payload: { noteId } }); }
    }, [notes, dispatch]);
    
    const handleNoteDragStart = (e: React.DragEvent, note: Note) => { e.dataTransfer.setData('application/zenith-note-id', note.id); e.dataTransfer.effectAllowed = 'move'; };
    const handleNotebookDrop = (e: React.DragEvent, targetNotebookId: string) => {
        e.preventDefault();
        const noteId = e.dataTransfer.getData('application/zenith-note-id');
        const sourceNote = notes[noteId];
        if (noteId && sourceNote && sourceNote.notebookId !== targetNotebookId) { dispatch({ type: ActionType.UPDATE_NOTE, payload: { noteId, updates: { notebookId: targetNotebookId } } }); }
        setDragOverNotebook(null);
    };

    const filterTitle = useMemo(() => {
        switch (filter.type) {
            case 'trash': return 'Trash';
            case 'pinned': return 'Pinned Notes';
            case 'notebook': return notebooks[filter.id!]?.name || 'Notebook';
            case 'tag': return `#${tags[filter.id!]?.name || 'Tag'}`;
            default: return 'All Notes';
        }
    }, [filter, notebooks, tags]);
    
    const handleNewNotebook = () => { const name = prompt("Enter new notebook name:"); if (name && name.trim()) { dispatch({ type: ActionType.ADD_NOTEBOOK, payload: { name: name.trim() } }); } };

    const SidebarLink: React.FC<{ isActive: boolean; onClick: () => void; onDrop?: (e: React.DragEvent) => void; isDropTarget?: boolean; onContextMenu?: (e: React.MouseEvent) => void; children: React.ReactNode }> = ({ isActive, onClick, onDrop, isDropTarget, onContextMenu, children }) => (
         <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }} onContextMenu={onContextMenu} onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); if(onDrop) setDragOverNotebook(filter.id); }} onDragLeave={() => { if(onDrop) setDragOverNotebook(null); }}
            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm group transition-colors duration-150 ${isDropTarget ? 'bg-primary-200 dark:bg-primary-800' : ''} ${isActive ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {children}
        </a>
    );

    return (
        <div className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-800" onContextMenu={(e) => { if (notebookMenu || noteMenu) { e.preventDefault(); setNotebookMenu(null); setNoteMenu(null); }}}>
            {/* Sidebar */}
            <aside className={`w-full md:w-64 flex-shrink-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col ${isMobile && mobileView !== 'sidebar' ? 'hidden' : 'flex'}`}>
                <div className="p-3 flex-shrink-0"><button onClick={handleNewNote} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm"><EditIcon className="w-5 h-5"/> New Note</button></div>
                <nav className="flex-1 overflow-y-auto p-2 space-y-1"><SidebarLink isActive={filter.type === 'all'} onClick={() => { setFilter({ type: 'all', id: null }); if(isMobile) setMobileView('list'); }}><span className="flex items-center gap-3"><BookOpenIcon className="w-5 h-5"/> All Notes</span><span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{allNotes.length}</span></SidebarLink><SidebarLink isActive={filter.type === 'pinned'} onClick={() => { setFilter({ type: 'pinned', id: null }); if(isMobile) setMobileView('list'); }}><span className="flex items-center gap-3"><BookmarkIcon className="w-5 h-5"/> Pinned</span><span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{allNotes.filter(n=>n.pinned).length}</span></SidebarLink><SidebarLink isActive={filter.type === 'trash'} onClick={() => { setFilter({ type: 'trash', id: null }); if(isMobile) setMobileView('list'); }}><span className="flex items-center gap-3"><Trash2Icon className="w-5 h-5"/> Trash</span><span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{Object.keys(trashedNotes).length}</span></SidebarLink><div className="pt-4"><button onClick={() => setIsNotebooksExpanded(p => !p)} className="w-full text-left flex items-center justify-between text-xs font-bold uppercase text-gray-500 dark:text-gray-400 px-3 py-1 mb-1 group">Notebooks <span className="flex items-center gap-1"><button type="button" onClick={(e) => {e.stopPropagation(); handleNewNotebook();}} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary-500"><PlusIcon className="w-4 h-4"/></button><ChevronDownIcon className={`w-4 h-4 transition-transform ${isNotebooksExpanded ? '' : '-rotate-90'}`}/></span></button>{isNotebooksExpanded && notebookOrder.map(id => notebooks[id] && ( <SidebarLink key={id} isActive={filter.type === 'notebook' && filter.id === id} onClick={() => {setFilter({type: 'notebook', id}); if(isMobile) setMobileView('list'); }} onContextMenu={(e) => { e.preventDefault(); setNotebookMenu({id, x: e.clientX, y: e.clientY})}} onDrop={(e) => handleNotebookDrop(e, id)} isDropTarget={dragOverNotebook === id}><div className="flex items-center gap-3 truncate"><NotebookIcon className="w-5 h-5 flex-shrink-0"/> <span className="truncate">{notebooks[id].name}</span></div><span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{notesByNotebook[id] || 0}</span></SidebarLink>))}</div><div className="pt-4"><button onClick={() => setIsTagsExpanded(p => !p)} className="w-full text-left flex items-center justify-between text-xs font-bold uppercase text-gray-500 dark:text-gray-400 px-3 py-1 mb-1">Tags <ChevronDownIcon className={`w-4 h-4 transition-transform ${isTagsExpanded ? '' : '-rotate-90'}`}/></button>{isTagsExpanded && Object.values(tags).sort((a,b) => a.name.localeCompare(b.name)).map(tag => ( <SidebarLink key={tag.id} isActive={filter.type === 'tag' && filter.id === tag.id} onClick={() => {setFilter({type: 'tag', id: tag.id}); if(isMobile) setMobileView('list');}}><div className="flex items-center gap-3 truncate"><TagIcon className="w-5 h-5 flex-shrink-0"/> <span className="truncate">{tag.name}</span></div><span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{notesByTag[tag.id] || 0}</span></SidebarLink>))}</div></nav>
            </aside>
            {notebookMenu && notebooks[notebookMenu.id] && <NotebookContextMenu notebook={notebooks[notebookMenu.id]} position={{ x: notebookMenu.x, y: notebookMenu.y }} onClose={() => setNotebookMenu(null)} dispatch={dispatch} />}
            {noteMenu && <NoteContextMenu note={noteMenu.note} position={{x: noteMenu.x, y: noteMenu.y}} onClose={() => setNoteMenu(null)} dispatch={dispatch} />}

            {/* Note List */}
            <section className={`w-full md:w-80 lg:w-96 flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 flex-col ${isMobile && mobileView !== 'list' ? 'hidden' : 'flex'}`}>
                 <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col gap-3">
                     <div className="flex justify-between items-center">
                        {isMobile && (
                            <button onClick={() => setMobileView('sidebar')} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <ChevronLeftIcon className="w-6 h-6"/>
                            </button>
                        )}
                        <h2 className="text-lg font-bold truncate">{filterTitle}</h2>
                        <div className="flex items-center gap-1 p-0.5 bg-gray-200 dark:bg-gray-700 rounded-md">
                            <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''}`}><ListIcon className="w-4 h-4"/></button>
                            <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''}`}><LayoutGridIcon className="w-4 h-4"/></button>
                        </div>
                     </div>
                      <div className="relative"><SearchIcon className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search notes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"/></div>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    {filteredNotes.length > 0 ? (
                        viewMode === 'list' ? (
                            <div>{filteredNotes.map(note => <NoteListItem key={note.id} note={note} isActive={activeNoteId === note.id} onClick={() => { setActiveNoteId(note.id); if(isMobile) setMobileView('editor'); }} onDragStart={(e) => handleNoteDragStart(e, note)} onContextMenu={(e) => { e.preventDefault(); setNoteMenu({ note, x: e.clientX, y: e.clientY }); }} />)}</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 p-3">{filteredNotes.map(note => <NoteGridItem key={note.id} note={note} isActive={activeNoteId === note.id} onClick={() => { setActiveNoteId(note.id); if(isMobile) setMobileView('editor'); }} onDragStart={(e) => handleNoteDragStart(e, note)} onContextMenu={(e) => { e.preventDefault(); setNoteMenu({ note, x: e.clientX, y: e.clientY }); }}/>)}</div>
                        )
                    ) : (<div className="p-8 text-center text-gray-500"><p className="font-semibold">No notes found</p><p className="text-sm">Create a new note to get started.</p></div>)}
                 </div>
            </section>

            {/* Editor */}
            <main className={`flex-1 flex-col overflow-hidden ${isMobile && mobileView !== 'editor' ? 'hidden' : 'flex'}`}><div key={activeNote?.id || 'empty-editor'} className="flex-1 flex flex-col min-h-0 fade-in">{filter.type === 'trash' && activeNote ? <TrashedNoteView note={activeNote} /> : <EditorPane activeNote={activeNote} onDelete={handleDeleteNote} isMobile={isMobile} onBack={() => setMobileView('list')} />}</div></main>
        </div>
    );
};
