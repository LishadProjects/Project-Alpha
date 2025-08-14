
import React, { useState, useRef } from 'react';
import { Card as CardType, List as ListType, ActionType } from '../types';
import { Card } from './Card';
import { PlusIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import { useAppContext } from '../hooks/useAppContext';

interface ListProps {
  list: ListType;
  cards: CardType[];
  index: number;
}

export const List: React.FC<ListProps> = ({ list, cards, index }) => {
  const { state, dispatch } = useAppContext();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const isCollapsed = list.isCollapsed ?? false;

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle.trim() !== list.title) {
        dispatch({
            type: ActionType.UPDATE_LIST_TITLE,
            payload: { listId: list.id, newTitle: editedTitle.trim() }
        });
    }
    setIsEditingTitle(false);
  };
  
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if(newCardTitle.trim()){
        const newCard: CardType = {
            id: `card-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title: newCardTitle.trim(),
            labelIds: [],
            checklists: [],
            comments: [],
            attachments: [],
        };
        dispatch({ type: ActionType.ADD_CARD, payload: { listId: list.id, card: newCard }});
        setNewCardTitle('');
        setIsAddingCard(false);
    }
  };

  const handleToggleCollapse = () => {
    dispatch({ type: ActionType.TOGGLE_LIST_COLLAPSED, payload: { listId: list.id } });
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const { cardId: draggedCardId, listId: sourceListId } = state.dragging;
    const isDraggingCard = !!draggedCardId;
    const isDraggingList = !!sourceListId && !draggedCardId;

    if (isDraggingList) {
        if (sourceListId !== list.id) {
            dispatch({ type: ActionType.MOVE_LIST, payload: { listId: sourceListId, destIndex: index } });
        }
    } else if (isDraggingCard && sourceListId) {
        // Calculate destination index for the card
        const cardElements = Array.from(cardContainerRef.current?.children || []);
        const dropY = e.clientY;
        
        let destIndex = cards.length; // Default to the end of the list
        for (let i = 0; i < cardElements.length; i++) {
            const cardEl = cardElements[i] as HTMLElement;
            if (cardEl.getAttribute('data-card-id') === draggedCardId) continue;
            
            const rect = cardEl.getBoundingClientRect();
            if (dropY < rect.top + rect.height / 2) {
                destIndex = i;
                break;
            }
        }

        const sourceIndex = cards.findIndex(c => c.id === draggedCardId);
        
        if (sourceListId === list.id) {
            if (sourceIndex === destIndex) {
                 dispatch({ type: ActionType.CLEAR_DRAGGING });
                 return; 
            }
            if (sourceIndex > -1 && sourceIndex < destIndex) {
                destIndex--;
            }
        }
        
        dispatch({
            type: ActionType.MOVE_CARD,
            payload: { cardId: draggedCardId, sourceListId, destListId: list.id, destIndex }
        });
    }

    dispatch({ type: ActionType.CLEAR_DRAGGING });
  };

  const handleListDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent card drag logic from firing
    dispatch({ type: ActionType.SET_DRAGGING_LIST, payload: { listId: list.id } });
  };
  
  const handleDragEnd = () => {
    dispatch({ type: ActionType.CLEAR_DRAGGING });
  };

  // --- Dynamic Styling ---
  const isListBeingDragged = state.dragging.listId === list.id && !state.dragging.cardId;
  const isCardDraggingOver = dragOver && state.dragging.cardId;
  const isListDraggingOver = dragOver && state.dragging.listId && !state.dragging.cardId && state.dragging.listId !== list.id;

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-shrink-0 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-sm h-fit max-h-full flex flex-col transition-all duration-300
        ${isCollapsed ? 'w-14' : 'w-64 sm:w-72'}
        ${isListBeingDragged ? 'opacity-50' : ''}
        ${isListDraggingOver ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900' : ''}
      `}
    >
      {isCollapsed ? (
         <div 
          className="h-full flex flex-col items-center justify-between p-2 cursor-pointer"
          draggable={true}
          onDragStart={handleListDragStart}
          onDragEnd={handleDragEnd}
          onClick={handleToggleCollapse}
        >
          <ChevronDownIcon className="w-5 h-5 flex-shrink-0 text-gray-600 dark:text-gray-400"/>
          <div className="flex-grow flex items-center justify-center w-full overflow-hidden my-2">
             <h3 className="font-bold text-md text-gray-700 dark:text-gray-200 whitespace-nowrap [writing-mode:vertical-lr] text-center rotate-180">
                {list.title}
            </h3>
          </div>
          <span className="text-sm font-bold bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
              {cards.length}
          </span>
        </div>
      ) : (
        <>
            <div 
                className={`p-3 flex items-start justify-between ${isEditingTitle ? '' : 'cursor-grab'}`}
                draggable={!isEditingTitle}
                onDragStart={handleListDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 mr-2">
                    {isEditingTitle ? (
                        <textarea
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleTitleSave(); }
                                if (e.key === 'Escape') { setIsEditingTitle(false); setEditedTitle(list.title); }
                            }}
                            autoFocus
                            onFocus={e => e.currentTarget.select()}
                            className="w-full font-bold text-md bg-white dark:bg-gray-900 rounded-md p-1 border-2 border-primary-500 focus:outline-none resize-none"
                            rows={2}
                        />
                    ) : (
                        <h3 onClick={() => setIsEditingTitle(true)} className="font-bold text-md text-gray-700 dark:text-gray-200 w-full break-words">
                            {list.title}
                        </h3>
                    )}
                </div>
                <button onClick={handleToggleCollapse} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700/50">
                    <ChevronUpIcon className="w-5 h-5" />
                </button>
            </div>
            <div 
                ref={cardContainerRef}
                className={`px-2 pb-2 flex-1 overflow-y-auto transition-colors ${isCardDraggingOver ? 'bg-primary-100 dark:bg-primary-900/50' : ''}`}
            >
                {cards.map((card) => (
                    <Card key={card.id} card={card} listId={list.id} />
                ))}
                {isAddingCard ? (
                    <form onSubmit={handleAddCard} className="p-1">
                        <textarea
                        autoFocus
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder="Enter a title for this card..."
                        className="w-full p-2 rounded-lg border-2 border-primary-500 bg-white dark:bg-gray-700 focus:outline-none"
                        rows={3}
                        />
                        <div className="mt-2 flex items-center gap-2">
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Add card</button>
                        <button type="button" onClick={() => setIsAddingCard(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                        </div>
                    </form>
                ) : null}
            </div>
            {!isAddingCard && (
                <button 
                onClick={() => setIsAddingCard(true)}
                className="p-3 text-left w-full text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700/50 rounded-b-xl transition-colors flex items-center gap-2"
                >
                <PlusIcon className="w-5 h-5"/> Add a card
                </button>
            )}
        </>
      )}
    </div>
  );
};
