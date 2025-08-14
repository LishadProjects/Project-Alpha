
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Card, ActionType, TimelineEvent, Note, DailyTodo } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, FlagIcon, Trash2Icon, XIcon, RotateCcwIcon, BookOpenIcon } from './icons';

type TimelineMode = 'month' | 'year';
type EditingEventState = {
    mode: 'add' | 'edit';
    date: string; // YYYY-MM-DD
    event?: TimelineEvent;
    position: { top: number; left: number };
};
type ContextMenuState = {
    x: number;
    y: number;
    event: TimelineEvent;
};

type TimelineItem = {
    id: string;
    title: string;
    date: Date;
    type: 'card' | 'todo';
    // Card specific
    listId?: string;
    labelIds?: string[];
    // Todo specific
    isRecurring?: boolean;
};
type ItemWithLane = TimelineItem & { lane: number };


const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TASK_HEIGHT = 36;
const LANE_GAP = 4;
const EVENT_AREA_HEIGHT = 120; // Increased height for vertical flags
const EVENT_COLORS = ['bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500'];

const toYMD = (date: Date): string => date.toISOString().split('T')[0];
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const layoutItems = (items: TimelineItem[]): ItemWithLane[] => {
    if (!items || items.length === 0) return [];

    const sortedItems = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
    const lanes: Date[] = [];

    return sortedItems.map(item => {
        let assignedLane = -1;
        
        for (let i = 0; i < lanes.length; i++) {
            if (item.date > lanes[i]) {
                lanes[i] = item.date;
                assignedLane = i;
                break;
            }
        }

        if (assignedLane === -1) {
            lanes.push(item.date);
            assignedLane = lanes.length - 1;
        }

        return { ...item, lane: assignedLane };
    });
};

const EventEditorPopover: React.FC<{
    state: EditingEventState;
    onClose: () => void;
    onSave: (title: string, color: string) => void;
    onDelete: (eventId: string, eventTitle: string) => void;
}> = ({ state, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState(state.event?.title || '');
    const [color, setColor] = useState(state.event?.color || EVENT_COLORS[0]);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSave(title.trim(), color);
        }
    };

    return (
        <div ref={ref} style={{ top: state.position.top, left: state.position.left }} className="absolute z-30 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">{state.mode === 'add' ? 'Add Event' : 'Edit Event'}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave}>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title..." autoFocus className="w-full p-2 rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <div className="flex justify-around my-3">
                    {EVENT_COLORS.map(c => <button key={c} type="button" onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-all ${c} ${color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-primary-500' : 'hover:opacity-80'}`} />)}
                </div>
                <div className="flex items-center justify-between">
                     <button type="submit" className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">Save</button>
                     {state.mode === 'edit' && state.event && (
                         <button type="button" onClick={() => onDelete(state.event!.id, state.event!.title)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"><Trash2Icon className="w-4 h-4" /></button>
                     )}
                </div>
            </form>
        </div>
    );
};

const TimelineEventContextMenu: React.FC<{
    menu: ContextMenuState;
    note?: Note;
    onClose: () => void;
    onOpenNote: (noteId: string, notebookId: string) => void;
}> = ({ menu, note, onClose, onOpenNote }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!note) return null;

    return (
        <div ref={ref} style={{ top: menu.y, left: menu.x }} className="fixed z-50 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-md p-1 border border-gray-200 dark:border-gray-700">
            <button onClick={() => { onOpenNote(note.id, note.notebookId); onClose(); }} className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <BookOpenIcon className="w-4 h-4" /> Open Note
            </button>
        </div>
    );
};

export const TimelineView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [timelineMode, setTimelineMode] = useState<TimelineMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLDivElement>(null);
    const [editingEvent, setEditingEvent] = useState<EditingEventState | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    
    const activeBoard = state.boards[state.activeBoardId];

    const cardToListMap = useMemo(() => {
        const map = new Map<string, string>();
        if (!activeBoard) return map;
        for (const listId of activeBoard.listOrder) {
            for (const cardId of activeBoard.lists[listId].cardIds) {
                map.set(cardId, listId);
            }
        }
        return map;
    }, [activeBoard]);
    
    const timelineItems = useMemo(() => {
        if (!activeBoard) return [];
        const cardItems = Object.values(activeBoard.cards)
            .filter((c: Card) => c.dueDate && cardToListMap.has(c.id))
            .map((c: Card): TimelineItem | null => {
                const date = new Date(c.dueDate as string);
                if (isNaN(date.getTime())) return null; // Filter out invalid dates
                return {
                    id: c.id,
                    title: c.title,
                    date: date,
                    type: 'card' as const,
                    listId: cardToListMap.get(c.id) as string,
                    labelIds: c.labelIds,
                };
            }).filter((item): item is TimelineItem => item !== null);

        const todoItems = state.dailyTodos
            .filter(t => t.startTime)
            .map((t): TimelineItem | null => {
                const date = new Date(t.startTime!);
                if (isNaN(date.getTime())) return null;
                return {
                    id: t.id,
                    title: t.text,
                    date: date,
                    type: 'todo' as const,
                    isRecurring: t.isRecurring,
                };
            }).filter((item): item is TimelineItem => item !== null);
        
        return [...cardItems, ...todoItems];
    }, [activeBoard, state.dailyTodos, cardToListMap]);

    const filteredTimelineItems = useMemo(() => {
        return timelineItems.filter(item => {
            const queryMatch = searchQuery ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
            const dateMatch = searchDate ? toYMD(item.date) === searchDate : true;
            return queryMatch && dateMatch;
        });
    }, [timelineItems, searchQuery, searchDate]);

    const filteredEvents = useMemo(() => {
        return state.timelineEvents.filter(event => {
            const queryMatch = searchQuery ? event.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
            const dateMatch = searchDate ? event.date === searchDate : true;
            return queryMatch && dateMatch;
        });
    }, [state.timelineEvents, searchQuery, searchDate]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, TimelineEvent[]>();
        filteredEvents.forEach(event => {
            const date = event.date;
            if (!map.has(date)) map.set(date, []);
            map.get(date)!.push(event);
        });
        return map;
    }, [filteredEvents]);

    const laidOutItems = useMemo(() => layoutItems(filteredTimelineItems), [filteredTimelineItems]);
    const totalLanes = useMemo(() => laidOutItems.length > 0 ? Math.max(...laidOutItems.map(t => t.lane)) + 1 : 0, [laidOutItems]);

    useEffect(() => {
        if (editingEvent?.event) {
            const eventExists = state.timelineEvents.some(e => e.id === editingEvent.event!.id);
            if (!eventExists) {
                setEditingEvent(null);
            }
        }
    }, [state.timelineEvents, editingEvent]);

    useEffect(() => {
        if (todayRef.current && timelineContainerRef.current) {
            const containerWidth = timelineContainerRef.current.clientWidth;
            const scrollPosition = todayRef.current.offsetLeft - (containerWidth / 2) + (todayRef.current.clientWidth / 2);
            timelineContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
    }, [timelineMode, currentDate]);
    
    useEffect(() => {
        if (searchDate) {
            setCurrentDate(new Date(searchDate));
        }
    }, [searchDate]);

    const handlePrev = () => {
        setCurrentDate(d => {
            const newDate = new Date(d);
            if (timelineMode === 'month') {
                newDate.setMonth(d.getMonth() - 1);
            } else {
                newDate.setFullYear(d.getFullYear() - 1);
            }
            return newDate;
        });
    };

    const handleNext = () => {
        setCurrentDate(d => {
            const newDate = new Date(d);
            if (timelineMode === 'month') {
                newDate.setMonth(d.getMonth() + 1);
            } else {
                newDate.setFullYear(d.getFullYear() + 1);
            }
            return newDate;
        });
    };

    const handleToday = () => {
        setSearchDate('');
        setCurrentDate(new Date());
    };
    
    const handleItemClick = (item: ItemWithLane) => {
        if (item.type === 'card' && item.listId) {
            dispatch({ type: ActionType.OPEN_CARD_MODAL, payload: { cardId: item.id, listId: item.listId } });
        } else if (item.type === 'todo') {
            dispatch({ type: ActionType.SET_VIEW_MODE, payload: 'planner' });
        }
    };

    const handleSaveEvent = (title: string, color: string) => {
        if (!editingEvent) return;
        if (editingEvent.mode === 'add') {
            dispatch({ type: ActionType.ADD_TIMELINE_EVENT, payload: { date: editingEvent.date, title, color } });
        } else if (editingEvent.event) {
            dispatch({ type: ActionType.UPDATE_TIMELINE_EVENT, payload: { ...editingEvent.event, title, color } });
        }
        setEditingEvent(null);
    };

    const handleDeleteEvent = useCallback((eventId: string, eventTitle: string) => {
        if (window.confirm(`Are you sure you want to delete the event "${eventTitle}"?`)) {
            dispatch({ type: ActionType.DELETE_TIMELINE_EVENT, payload: { id: eventId } });
        }
    }, [dispatch]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const isNote = Array.from(e.dataTransfer.types).includes('application/zenith-note-id');
        if (isNote) {
            e.dataTransfer.dropEffect = 'copy';
            setIsDragOver(true);
        }
    };
    
    const handleDragLeave = () => setIsDragOver(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, units: {date: Date}[], columnWidth: number) => {
        e.preventDefault();
        setIsDragOver(false);
        const noteId = e.dataTransfer.getData('application/zenith-note-id');
        if (!noteId || !state.notes[noteId]) return;

        const note = state.notes[noteId];
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const scrollLeft = e.currentTarget.parentElement?.scrollLeft || 0;
        const absoluteX = x + scrollLeft;
        const index = Math.floor(absoluteX / columnWidth);

        if (index >= 0 && index < units.length) {
            const date = units[index].date;
            const color = EVENT_COLORS[state.timelineEvents.length % EVENT_COLORS.length];
            dispatch({
                type: ActionType.ADD_TIMELINE_EVENT,
                payload: {
                    date: toYMD(date),
                    title: note.title,
                    color: color,
                    noteId: note.id,
                }
            });
        }
    };

    const handleEventContextMenu = (e: React.MouseEvent, event: TimelineEvent) => {
        if (event.noteId && state.notes[event.noteId]) {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, event });
        }
    };
    
    const handleOpenNote = (noteId: string, notebookId: string) => {
        dispatch({ type: ActionType.VIEW_NOTE, payload: { noteId, notebookId } });
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        const timeUnits = Array.from({ length: daysInMonth }, (_, i) => {
            const dayDate = new Date(year, month, i + 1);
            return {
                label: (i + 1).toString(),
                subLabel: DAY_NAMES[dayDate.getDay()],
                isToday: isCurrentMonth && today.getDate() === (i + 1),
                date: dayDate,
            };
        });
        
        const columnWidth = 60;

        return renderTimelineGrid(timeUnits, columnWidth);
    };

    const renderYearView = () => {
        const year = currentDate.getFullYear();
        const today = new Date();
        const isCurrentYear = today.getFullYear() === year;

        const timeUnits = MONTH_NAMES.map((name, i) => ({
            label: name.substring(0,3),
            subLabel: '',
            isToday: isCurrentYear && today.getMonth() === i,
            date: new Date(year, i, 1),
        }));

        const columnWidth = 100;

        return renderTimelineGrid(timeUnits, columnWidth);
    };
    
    const renderTimelineGrid = (units: { label: string; subLabel: string; isToday: boolean, date: Date }[], columnWidth: number) => {
        const totalGridHeight = totalLanes * (TASK_HEIGHT + LANE_GAP) + 60 + EVENT_AREA_HEIGHT;
        return (
            <div 
                className={`relative transition-colors ${isDragOver ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                style={{ width: `${units.length * columnWidth}px`, height: `${totalGridHeight}px` }}
                onDrop={(e) => handleDrop(e, units, columnWidth)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {/* Headers */}
                <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800 flex h-[60px] border-b border-gray-200 dark:border-gray-700">
                    {units.map((unit, index) => (
                        <div
                            key={index}
                            style={{ width: `${columnWidth}px` }}
                            className={`flex-shrink-0 text-center p-2 border-r border-gray-200 dark:border-gray-700 select-none cursor-pointer group transition-colors ${timelineMode === 'month' ? 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50' : ''}`}
                            onDoubleClick={(e) => {
                                 if (timelineMode === 'year') return;
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 setEditingEvent({
                                     mode: 'add',
                                     date: toYMD(unit.date),
                                     position: { top: rect.bottom, left: rect.left }
                                 });
                             }}
                             title={timelineMode === 'month' ? 'Double-click to add an event' : ''}
                        >
                           <div className={`text-xs font-semibold ${unit.isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>{unit.subLabel}</div>
                           <div className={`text-lg font-bold ${unit.isToday ? 'text-primary-600 dark:text-primary-400' : ''}`}>{unit.label}</div>
                        </div>
                    ))}
                </div>

                {/* Grid Lines */}
                <div className="absolute inset-0 z-0">
                    {units.map((_, index) => (
                        <div key={index} style={{ left: `${index * columnWidth}px` }} className="absolute top-0 w-px h-full bg-gray-200 dark:bg-gray-700"></div>
                    ))}
                </div>

                {/* Today Marker */}
                {units.find(u => u.isToday) && (
                     <div ref={todayRef} className="absolute top-0 h-full w-0.5 bg-red-500 z-10" style={{ left: `${units.findIndex(u => u.isToday) * columnWidth + columnWidth/2}px` }}></div>
                )}
                
                {/* Events */}
                <div className="absolute top-[60px] w-full z-10 pointer-events-none" style={{ height: `${EVENT_AREA_HEIGHT}px` }}>
                    {units.map((unit, index) => {
                        const ymd = toYMD(unit.date);
                        const eventsOnDay = timelineMode === 'month' ? eventsByDate.get(ymd) : undefined;
                        if (!eventsOnDay) return null;
                        
                        return eventsOnDay.map((event, eventIndex) => (
                             <div 
                                 key={event.id}
                                 className="absolute w-7 group pointer-events-auto"
                                 style={{ 
                                     left: `${index * columnWidth + 8 + (eventIndex * 28)}px`,
                                     top: '4px',
                                     height: `${EVENT_AREA_HEIGHT - 12}px`
                                 }}
                                 title={event.title}
                                 onContextMenu={(e) => handleEventContextMenu(e, event)}
                             >
                                <div 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setEditingEvent({
                                            mode: 'edit',
                                            event: event,
                                            date: ymd,
                                            position: { top: rect.bottom, left: rect.left }
                                        })
                                    }}
                                    className={`w-full h-full flex flex-col items-center pt-2 pb-1 px-1 rounded-t-md rounded-b-sm shadow-md transition-transform group-hover:scale-105 cursor-pointer ${event.color}`}
                                >
                                     <FlagIcon className="w-4 h-4 text-white flex-shrink-0 mb-1"/>
                                     <div className="flex-1 w-full overflow-hidden flex justify-center items-center [writing-mode:vertical-rl] transform rotate-180">
                                         <span className="text-white text-xs font-semibold whitespace-nowrap">{event.title}</span>
                                     </div>
                                </div>
                                <button
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         handleDeleteEvent(event.id, event.title);
                                     }}
                                     className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-red-400 z-10"
                                     aria-label="Delete event"
                                >
                                     <XIcon className="w-4 h-4" />
                                </button>
                             </div>
                        ))
                    })}
                </div>


                {/* Tasks and Todos */}
                <div className="relative z-10" style={{ marginTop: `${EVENT_AREA_HEIGHT}px` }}>
                    {laidOutItems.map(item => {
                        let itemIndex = -1;
                        if (timelineMode === 'month' && item.date.getFullYear() === currentDate.getFullYear() && item.date.getMonth() === currentDate.getMonth()) {
                           itemIndex = item.date.getDate() - 1;
                        } else if (timelineMode === 'year' && item.date.getFullYear() === currentDate.getFullYear()) {
                           itemIndex = item.date.getMonth();
                        }
                        
                        if(itemIndex === -1) return null;

                        const isCard = item.type === 'card';
                        const colorClass = isCard 
                            ? (activeBoard?.labels[item.labelIds![0]]?.color || 'bg-gray-500')
                            : 'bg-teal-500';

                        return (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={`absolute p-1.5 rounded-md cursor-pointer hover:z-20 transition-all duration-150 ease-in-out hover:ring-2 hover:ring-primary-500/80 ${colorClass}`}
                                style={{
                                    top: `${item.lane * (TASK_HEIGHT + LANE_GAP)}px`,
                                    left: `${itemIndex * columnWidth + 4}px`,
                                    width: `${columnWidth - 8}px`,
                                    height: `${TASK_HEIGHT}px`,
                                }}
                                title={item.title}
                            >
                                <div className="flex justify-between items-center h-full">
                                    <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                                    {item.isRecurring && <span title="Recurring task"><RotateCcwIcon className="w-3 h-3 text-white/70 flex-shrink-0" /></span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    };
    
    const displayDate = timelineMode === 'month' 
        ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
        : currentDate.getFullYear().toString();

    return (
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden" onContextMenu={(e) => { if(contextMenu) { e.preventDefault(); setContextMenu(null); } }}>
            {/* Header Controls */}
            <div className="flex-shrink-0 p-3 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-20">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronRightIcon className="w-5 h-5"/></button>
                    <button onClick={handleToday} className="px-3 py-1.5 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Today</button>
                    <h2 className="text-lg font-bold ml-4">{displayDate}</h2>
                </div>
                 <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search tasks & events..." 
                        className="px-3 py-1.5 text-sm rounded-md bg-gray-200 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-48"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <input 
                        type="date"
                        className="px-3 py-1.5 text-sm rounded-md bg-gray-200 dark:bg-gray-700"
                        value={searchDate}
                        onChange={e => setSearchDate(e.target.value)}
                    />
                    { (searchQuery || searchDate) && 
                        <button onClick={() => { setSearchQuery(''); setSearchDate(''); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    }
                </div>
                <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <button onClick={() => setTimelineMode('month')} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${timelineMode === 'month' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}>Month</button>
                    <button onClick={() => setTimelineMode('year')} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${timelineMode === 'year' ? 'bg-white dark:bg-gray-900 shadow-sm' : ''}`}>Year</button>
                </div>
            </div>

            {/* Timeline Body */}
            <div ref={timelineContainerRef} className="flex-1 overflow-auto">
                {timelineMode === 'month' ? renderMonthView() : renderYearView()}
            </div>
            
            {editingEvent && <EventEditorPopover state={editingEvent} onClose={() => setEditingEvent(null)} onSave={handleSaveEvent} onDelete={handleDeleteEvent} />}
            {contextMenu && (
                <TimelineEventContextMenu
                    menu={contextMenu}
                    note={contextMenu.event.noteId ? state.notes[contextMenu.event.noteId] : undefined}
                    onClose={() => setContextMenu(null)}
                    onOpenNote={handleOpenNote}
                />
            )}
        </div>
    );
};
