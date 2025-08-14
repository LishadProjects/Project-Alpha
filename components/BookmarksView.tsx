import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, Bookmark, BookmarkFolder } from '../types';
import { PlusIcon, Trash2Icon, EditIcon, MoreVerticalIcon } from './icons';

const AddBookmarkForm: React.FC<{ folderId: string }> = ({ folderId }) => {
    const { dispatch } = useAppContext();
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!url.trim()) return;

        try {
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            const urlObject = new URL(fullUrl);
            const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${urlObject.hostname}`;

            const newBookmark: Bookmark = {
                id: `bm-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                title: title.trim() || urlObject.hostname.replace('www.', ''),
                url: fullUrl,
                faviconUrl,
            };

            dispatch({ type: ActionType.ADD_BOOKMARK, payload: { folderId, bookmark: newBookmark } });
            setUrl('');
            setTitle('');
        } catch (err) {
            setError('Invalid URL provided.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-2 space-y-2">
            <input
                type="text" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com" required
                className="w-full text-sm p-1.5 rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Custom title (optional)"
                className="w-full text-sm p-1.5 rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" className="w-full text-sm px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700">Add</button>
        </form>
    );
};


const BookmarkItem: React.FC<{ folderId: string; bookmark: Bookmark; onDragStart: (e: React.DragEvent, id: string) => void; onDragOver: (e: React.DragEvent, id: string) => void; }> = ({ folderId, bookmark, onDragStart, onDragOver }) => {
    const { dispatch } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(bookmark.title);
    const [editedUrl, setEditedUrl] = useState(bookmark.url);

    const handleDelete = () => {
        dispatch({ type: ActionType.DELETE_BOOKMARK, payload: { folderId, bookmarkId: bookmark.id } });
    };

    const handleSave = () => {
        const updates: Partial<Bookmark> = {};
        if (editedTitle.trim() && editedTitle !== bookmark.title) {
            updates.title = editedTitle.trim();
        }
        if (editedUrl.trim() && editedUrl !== bookmark.url) {
            updates.url = editedUrl.trim();
            try {
                const urlObject = new URL(updates.url.startsWith('http') ? updates.url : `https://${updates.url}`);
                updates.faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${urlObject.hostname}`;
            } catch (e) {
                alert("Invalid URL format.");
                return;
            }
        }
        if (Object.keys(updates).length > 0) {
            dispatch({ type: ActionType.UPDATE_BOOKMARK, payload: { folderId, bookmarkId: bookmark.id, updates } });
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-2 space-y-2 bg-primary-50 dark:bg-primary-900/30 rounded-md">
                <input type="text" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className="w-full text-sm p-1 rounded bg-white dark:bg-gray-800" />
                <input type="text" value={editedUrl} onChange={e => setEditedUrl(e.target.value)} className="w-full text-sm p-1 rounded bg-white dark:bg-gray-800" />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                    <button onClick={handleSave} className="text-xs px-2 py-1 rounded bg-primary-600 text-white">Save</button>
                </div>
            </div>
        );
    }
    
    return (
        <div 
            draggable 
            onDragStart={(e) => onDragStart(e, bookmark.id)}
            onDragOver={(e) => onDragOver(e, bookmark.id)}
            className="group flex items-center justify-between p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-grab"
        >
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 truncate">
                <img src={bookmark.faviconUrl} alt="" className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{bookmark.title}</span>
            </a>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsEditing(true)} className="p-1 text-gray-500 hover:text-primary-500"><EditIcon className="w-4 h-4" /></button>
                <button onClick={handleDelete} className="p-1 text-gray-500 hover:text-red-500"><Trash2Icon className="w-4 h-4" /></button>
            </div>
        </div>
    );
};

const FolderCard: React.FC<{ folder: BookmarkFolder }> = ({ folder }) => {
    const { dispatch } = useAppContext();
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(folder.title);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the folder "${folder.title}" and all its bookmarks?`)) {
            dispatch({ type: ActionType.DELETE_BOOKMARK_FOLDER, payload: { folderId: folder.id } });
        }
    };
    
    const handleSaveTitle = () => {
        if (editedTitle.trim() && editedTitle !== folder.title) {
            dispatch({ type: ActionType.UPDATE_BOOKMARK_FOLDER, payload: { folderId: folder.id, title: editedTitle.trim() }});
        }
        setIsEditing(false);
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.effectAllowed = 'move';
        setDraggedId(id);
    };
    
    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        // Visual feedback could be added here if desired
    };

    const handleDrop = (targetId: string | null) => {
        if (draggedId && draggedId !== targetId) {
            dispatch({ type: ActionType.REORDER_BOOKMARKS, payload: { folderId: folder.id, draggedId, targetId } });
        }
        setDraggedId(null);
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md flex flex-col h-fit">
            <div className="flex items-center justify-between mb-2">
                {isEditing ? (
                    <input
                        type="text" value={editedTitle} onChange={e => setEditedTitle(e.target.value)}
                        onBlur={handleSaveTitle} onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                        autoFocus
                        className="font-bold text-lg bg-transparent border-b-2 border-primary-500 focus:outline-none w-full"
                    />
                ) : (
                    <h3 className="font-bold text-lg truncate">{folder.title}</h3>
                )}
                <div className="flex items-center">
                    <button onClick={() => setIsEditing(true)} className="p-1 text-gray-500 hover:text-primary-500"><EditIcon className="w-5 h-5" /></button>
                    <button onClick={handleDelete} className="p-1 text-gray-500 hover:text-red-500"><Trash2Icon className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="space-y-1" onDrop={() => handleDrop(null)} onDragOver={(e) => e.preventDefault()}>
                {folder.bookmarks.map(bm => <BookmarkItem key={bm.id} folderId={folder.id} bookmark={bm} onDragStart={handleDragStart} onDragOver={handleDragOver} />)}
            </div>
            {isAdding ? (
                <AddBookmarkForm folderId={folder.id} />
            ) : (
                <button onClick={() => setIsAdding(true)} className="w-full flex items-center gap-2 mt-2 text-sm p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                    <PlusIcon className="w-4 h-4" /> Add Bookmark
                </button>
            )}
        </div>
    );
};

export const BookmarksView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [newFolderTitle, setNewFolderTitle] = useState('');

    const handleAddFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderTitle.trim()) {
            dispatch({ type: ActionType.ADD_BOOKMARK_FOLDER, payload: { title: newFolderTitle.trim() }});
            setNewFolderTitle('');
            setIsAddingFolder(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start">
                {state.bookmarkFolders.map(folder => <FolderCard key={folder.id} folder={folder} />)}
                <div>
                    {isAddingFolder ? (
                        <form onSubmit={handleAddFolder} className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-2">
                            <input
                                type="text" value={newFolderTitle} onChange={e => setNewFolderTitle(e.target.value)}
                                placeholder="Folder title" required autoFocus
                                className="w-full text-sm p-1.5 rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600"
                            />
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setIsAddingFolder(false)} className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                                <button type="submit" className="text-xs px-3 py-1 bg-primary-600 text-white rounded">Add</button>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setIsAddingFolder(true)} className="w-full flex items-center gap-2 p-3 text-lg font-semibold rounded-lg bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors">
                            <PlusIcon className="w-5 h-5"/> Add Folder
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};