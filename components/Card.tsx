import React from 'react';
import { Card as CardType, ActionType } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { CalendarIcon, CheckSquareIcon, MessageSquareIcon, PaperclipIcon } from './icons';

interface CardProps {
  card: CardType;
  listId: string;
}

export const Card: React.FC<CardProps> = ({ card, listId }) => {
  const { state, dispatch } = useAppContext();
  const activeBoard = state.boards[state.activeBoardId];
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent list drag handler from firing
    dispatch({ type: ActionType.SET_DRAGGING_CARD, payload: { cardId: card.id, listId: listId } });
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    dispatch({ type: ActionType.CLEAR_DRAGGING });
  };
  
  const openModal = () => {
    dispatch({ type: ActionType.OPEN_CARD_MODAL, payload: { cardId: card.id, listId: listId } });
  };

  const labels = activeBoard ? card.labelIds.map(id => activeBoard.labels[id]).filter(Boolean) : [];
  const checklistItemsCount = card.checklists.reduce((acc, c) => acc + c.items.length, 0);
  const completedChecklistItemsCount = card.checklists.reduce((acc, c) => acc + c.items.filter(i => i.isCompleted).length, 0);

  const dueDate = card.dueDate ? new Date(card.dueDate) : null;
  const isValidDueDate = dueDate && !isNaN(dueDate.getTime());

  return (
    <div
      data-card-id={card.id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={openModal}
      className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-transparent hover:border-primary-500"
    >
      {card.coverImage && <img src={card.coverImage} alt="Card cover" className="rounded-md mb-2 w-full h-32 object-cover" />}
      
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.map(label => (
            <span key={label.id} className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${label.color}`}>{label.text}</span>
          ))}
        </div>
      )}
      
      <p className="font-medium text-gray-800 dark:text-gray-100">{card.title}</p>

      <div className="flex items-center gap-4 mt-3 text-gray-500 dark:text-gray-400 text-sm">
        {isValidDueDate && (
            <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                <span>{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
        )}
        {checklistItemsCount > 0 && (
            <div className={`flex items-center gap-1 ${completedChecklistItemsCount === checklistItemsCount ? 'text-green-500' : ''}`}>
                <CheckSquareIcon className="w-4 h-4" />
                <span>{completedChecklistItemsCount}/{checklistItemsCount}</span>
            </div>
        )}
        {card.comments.length > 0 && (
            <div className="flex items-center gap-1">
                <MessageSquareIcon className="w-4 h-4" />
                <span>{card.comments.length}</span>
            </div>
        )}
        {card.attachments.length > 0 && (
            <div className="flex items-center gap-1">
                <PaperclipIcon className="w-4 h-4" />
                <span>{card.attachments.length}</span>
            </div>
        )}
      </div>
    </div>
  );
};