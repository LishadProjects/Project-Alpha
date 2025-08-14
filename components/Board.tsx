
import React, { useState } from 'react';
import { List } from './List';
import { useAppContext } from '../hooks/useAppContext';
import { PlusIcon } from './icons';
import { ActionType, Card as CardType } from '../types';

export const Board: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  
  const activeBoard = state.boards[state.activeBoardId];

  if (!activeBoard) {
      return <div className="p-4 flex items-center justify-center h-full text-gray-500">No board selected. Create one to get started.</div>;
  }

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      const newList = {
        id: `list-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: newListTitle.trim(),
        cardIds: [],
      };
      dispatch({ type: ActionType.ADD_LIST, payload: { list: newList } });
      setNewListTitle('');
      setIsAddingList(false);
    }
  };

  return (
    <div 
      className="p-2 sm:p-4 flex gap-4 h-full items-start"
    >
      {activeBoard.listOrder.map((listId, index) => {
        const list = activeBoard.lists[listId];
        if (!list) return null;
        const cards = list.cardIds
          .map(cardId => activeBoard.cards[cardId])
          .filter(Boolean) as CardType[];
        return <List key={list.id} list={list} cards={cards} index={index} />;
      })}
      <div className="flex-shrink-0 w-72">
        {isAddingList ? (
          <form onSubmit={handleAddList} className="bg-gray-200 dark:bg-gray-800 p-2 rounded-lg">
            <input
              type="text"
              autoFocus
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Enter list title..."
              className="w-full p-2 rounded border border-primary-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="mt-2 flex items-center gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Add List</button>
              <button type="button" onClick={() => setIsAddingList(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="w-full p-2.5 rounded-lg bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 transition-colors flex items-center justify-start gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add another list
          </button>
        )}
      </div>
    </div>
  );
};