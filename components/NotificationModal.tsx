
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, Notification } from '../types';
import { XIcon, BellIcon, ClockIcon, AlarmClockIcon, CalendarIcon, LayoutDashboardIcon } from './icons';

const formatRelativeTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
};

const NotificationIcon: React.FC<{type: Notification['type']}> = ({ type }) => {
    const commonClasses = "w-4 h-4 text-white";
    switch(type) {
        case 'pomodoro': return <div className="p-1.5 bg-red-500 rounded-full"><AlarmClockIcon className={commonClasses} /></div>;
        case 'dueDate': return <div className="p-1.5 bg-yellow-500 rounded-full"><CalendarIcon className={commonClasses} /></div>;
        case 'schedule': return <div className="p-1.5 bg-blue-500 rounded-full"><ClockIcon className={commonClasses} /></div>;
        case 'boardActivity': return <div className="p-1.5 bg-purple-500 rounded-full"><LayoutDashboardIcon className={commonClasses} /></div>;
        default: return <div className="p-1.5 bg-gray-500 rounded-full"><BellIcon className={commonClasses} /></div>;
    }
};

export const NotificationModal: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const sortedNotifications = state.notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const closeModal = () => dispatch({ type: ActionType.CLOSE_NOTIFICATIONS_MODAL });

    const handleNotificationClick = (notification: Notification) => {
        dispatch({ type: ActionType.MARK_NOTIFICATION_READ, payload: { notificationId: notification.id } });
        
        if ((notification.type === 'dueDate' || notification.type === 'boardActivity') && notification.relatedId && notification.listId) {
            dispatch({
                type: ActionType.OPEN_CARD_MODAL,
                payload: { cardId: notification.relatedId, listId: notification.listId }
            });
        } else if (notification.type === 'schedule') {
            dispatch({ type: ActionType.SET_VIEW_MODE, payload: 'planner' });
        }
        
        closeModal();
    };
    
    const handleMarkAllRead = () => {
        dispatch({ type: ActionType.MARK_ALL_NOTIFICATIONS_READ });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center sm:items-start sm:justify-end z-50 p-4" onMouseDown={closeModal}>
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <BellIcon className="w-6 h-6 text-primary-500" />
                        <h2 className="text-xl font-bold">Notifications</h2>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={handleMarkAllRead} className="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:text-gray-400 disabled:no-underline" disabled={state.notifications.every(n => n.isRead)}>
                            Mark all as read
                        </button>
                        <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>
                
                <main className="overflow-y-auto flex-1">
                    {sortedNotifications.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedNotifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    className={`flex items-start gap-4 p-4 cursor-pointer transition-colors ${notification.isRead ? 'opacity-60' : 'bg-primary-50 dark:bg-primary-900/20'} hover:bg-gray-200 dark:hover:bg-gray-700/50`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <NotificationIcon type={notification.type} />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{notification.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
                                    </div>
                                    {!notification.isRead && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-16">
                            <BellIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                            <h3 className="text-lg font-semibold">No notifications yet</h3>
                            <p className="text-sm">Important updates will appear here.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
