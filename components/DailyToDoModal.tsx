
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, DailyTodo } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, ClockIcon, BrainCircuitIcon, LoaderIcon, Trash2Icon, RepeatIcon, CheckIcon } from './icons';
import { prioritizeTasksWithAI } from '../services/geminiService';

const toYMD = (date: Date): string => date.toISOString().split('T')[0];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Calendar Panel Component ---
const CalendarPanel: React.FC<{
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}> = ({ selectedDate, onDateChange }) => {
    const { state } = useAppContext();
    const [viewDate, setViewDate] = useState(selectedDate);

    const tasksByDate = useMemo(() => {
        const map = new Set<string>();
        state.dailyTodos.forEach(todo => {
            if (todo.date) map.add(todo.date);
        });
        return map;
    }, [state.dailyTodos]);

    const changeMonth = (offset: number) => {
        setViewDate(d => new Date(d.getFullYear(), d.getMonth() + offset, 1));
    };

    const calendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push({ key: `pad-${i}`, day: null, date: null });
        for (let i = 1; i <= daysInMonth; i++) days.push({ key: `${year}-${month}-${i}`, day: i, date: new Date(year, month, i) });
        
        return days;
    }, [viewDate]);
    
    const selectedYMD = toYMD(selectedDate);
    const todayYMD = toYMD(new Date());

    return (
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-gray-800/50 p-4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <header className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5"/></button>
                <h2 className="font-bold text-lg text-center">{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5"/></button>
            </header>
            <div className="grid grid-cols-7 gap-y-2 text-center text-sm text-gray-500 dark:text-gray-400">
                {DAYS_OF_WEEK.map(day => <div key={day}>{day.charAt(0)}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-2 mt-2">
                {calendarGrid.map(({ key, day, date }) => {
                    if (!date || !day) return <div key={key}></div>;
                    const dateYMD = toYMD(date);
                    const isSelected = dateYMD === selectedYMD;
                    const isToday = dateYMD === todayYMD;
                    const hasTasks = tasksByDate.has(dateYMD);

                    return (
                        <div key={key} className="flex justify-center items-center">
                            <button
                                onClick={() => onDateChange(date)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-200
                                    ${isSelected ? 'bg-primary-500 text-white font-bold shadow-lg' : ''}
                                    ${!isSelected && isToday ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 font-bold' : ''}
                                    ${!isSelected && !isToday ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                                `}
                            >
                                {day}
                                {hasTasks && !isSelected && <div className="absolute bottom-1 w-1.5 h-1.5 bg-primary-400 rounded-full"></div>}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// --- Task Item Component with Editing ---
const TaskItem: React.FC<{ todo: DailyTodo; dateYMD: string; }> = ({ todo, dateYMD }) => {
    const { dispatch } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    
    // Editable state
    const [text, setText] = useState(todo.text);
    const [startTime, setStartTime] = useState(todo.startTime ? new Date(todo.startTime).toTimeString().substring(0,5) : '');
    const [endTime, setEndTime] = useState(todo.endTime ? new Date(todo.endTime).toTimeString().substring(0,5) : '');
    const [isRecurring, setIsRecurring] = useState(todo.isRecurring);

    const isCompleted = todo.isRecurring ? !!todo.completedOn?.[dateYMD] : todo.isCompleted;

    const handleToggle = () => {
        if(isEditing) return;
        dispatch({ type: ActionType.TOGGLE_TODO, payload: { todoId: todo.id, date: dateYMD } });
    };
    
    const handleDelete = () => dispatch({ type: ActionType.DELETE_TODO, payload: todo.id });

    const handleSave = () => {
        if (!text.trim()) {
            setText(todo.text); // Revert if empty
            setIsEditing(false);
            return;
        }

        const datePart = new Date(dateYMD + 'T00:00:00');
        const getISOString = (time: string) => {
            if (!time) return undefined;
            const [hours, minutes] = time.split(':');
            datePart.setHours(parseInt(hours), parseInt(minutes));
            return datePart.toISOString();
        };

        dispatch({
            type: ActionType.UPDATE_TODO,
            payload: {
                todoId: todo.id,
                updates: {
                    text: text.trim(),
                    startTime: getISOString(startTime),
                    endTime: getISOString(endTime),
                    isRecurring,
                }
            }
        });
        setIsEditing(false);
    };

    const timeDisplay = useMemo(() => {
        if (!todo.startTime) return null;
        const startDate = new Date(todo.startTime);
        if (isNaN(startDate.getTime())) return null;

        const start = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (!todo.endTime) return start;
        const endDate = new Date(todo.endTime);
        if (isNaN(endDate.getTime())) return start;

        const end = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${start} - ${end}`;
    }, [todo.startTime, todo.endTime]);

    return (
        <div className={`task-enter group bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-l-4 transition-all duration-300 ${isCompleted ? 'border-green-400 opacity-60' : 'border-transparent hover:border-primary-400'}`}>
            <div className="flex items-start gap-3">
                <input type="checkbox" checked={isCompleted} onChange={handleToggle} className="custom-checkbox flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0" onClick={() => !isEditing && setIsEditing(true)}>
                    {isEditing ? (
                        <input value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-transparent font-semibold focus:outline-none" autoFocus />
                    ) : (
                        <p className={`font-semibold cursor-pointer ${isCompleted ? 'line-through' : ''}`}>{todo.text}</p>
                    )}
                    {!isEditing && timeDisplay && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{timeDisplay}</p>}
                </div>
                {!isEditing && <button onClick={handleDelete} className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30"><Trash2Icon className="w-4 h-4 text-red-500"/></button>}
            </div>

            {isEditing && (
                <div className="mt-3 pl-8 space-y-3">
                    <div className="flex items-center gap-2">
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-1 text-sm rounded bg-gray-100 dark:bg-gray-700 w-28" />
                        <span>to</span>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-1 text-sm rounded bg-gray-100 dark:bg-gray-700 w-28" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="rounded text-primary-500 focus:ring-primary-500" />
                        Daily Task (Recurring)
                    </label>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSave} className="px-3 py-1 text-sm rounded bg-primary-600 text-white hover:bg-primary-700">Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Modern Time Selector Components ---
const TimeRangeSlider: React.FC<{
    startTime: string;
    setStartTime: (time: string) => void;
    endTime: string;
    setEndTime: (time: string) => void;
}> = ({ startTime, setStartTime, endTime, setEndTime }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

    const timeToPercentage = useCallback((time: string) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        return (totalMinutes / (24 * 60)) * 100;
    }, []);

    const percentageToTime = useCallback((percentage: number) => {
        const totalMinutes = Math.round((percentage / 100) * 1440);
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging || !sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        let percentage = ((e.clientX - rect.left) / rect.width) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        
        const newTime = percentageToTime(percentage);
        
        if (dragging === 'start') {
            if (!endTime || timeToPercentage(newTime) < timeToPercentage(endTime)) {
                setStartTime(newTime);
            }
        } else {
            if (!startTime || timeToPercentage(newTime) > timeToPercentage(startTime)) {
                setEndTime(newTime);
            }
        }
    }, [dragging, startTime, endTime, setStartTime, setEndTime, percentageToTime, timeToPercentage]);

    const handleMouseUp = useCallback(() => {
        setDragging(null);
    }, []);

    useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, handleMouseMove, handleMouseUp]);

    const startP = timeToPercentage(startTime);
    const endP = timeToPercentage(endTime);

    return (
        <div className="pt-2">
            <div ref={sliderRef} className="h-6 w-full flex items-center relative cursor-pointer group">
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full relative">
                    <div className="absolute inset-y-0 -left-1 -right-1 flex justify-between items-center">
                        {[...Array(5)].map((_, i) => (
                             <div key={i} className={`w-px h-2.5 ${[1,2,3].includes(i) ? 'bg-gray-300 dark:bg-gray-500' : 'bg-gray-400 dark:bg-gray-400'}`} />
                        ))}
                    </div>
                    {startTime && endTime && (
                        <div className="absolute h-1.5 bg-primary-500 rounded-full" style={{ left: `${startP}%`, width: `${Math.max(0, endP - startP)}%` }} />
                    )}
                    {startTime && (
                        <button
                            onMouseDown={(e) => { e.stopPropagation(); setDragging('start'); }}
                            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-md border-2 border-primary-500 cursor-grab focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-primary-500/50 transition-transform group-hover:scale-110"
                            style={{ left: `${startP}%` }}
                        />
                    )}
                    {endTime && (
                         <button
                            onMouseDown={(e) => { e.stopPropagation(); setDragging('end'); }}
                            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-md border-2 border-primary-500 cursor-grab focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-primary-500/50 transition-transform group-hover:scale-110"
                            style={{ left: `${endP}%` }}
                        />
                    )}
                </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
                <span>12AM</span><span>6AM</span><span>12PM</span><span>6PM</span><span>12AM</span>
            </div>
        </div>
    );
};

const TimeSelector: React.FC<{
    startTime: string;
    setStartTime: (time: string) => void;
    endTime: string;
    setEndTime: (time: string) => void;
}> = ({ startTime, setStartTime, endTime, setEndTime }) => {
    
    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartTime = e.target.value;
        setStartTime(newStartTime);
        if (!endTime || newStartTime > endTime) {
            const [h, m] = newStartTime.split(':').map(Number);
            const endDate = new Date();
            endDate.setHours(h + 1, m);
            setEndTime(`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
        }
    };
    
    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndTime = e.target.value;
        if (!startTime || newEndTime > startTime) {
            setEndTime(newEndTime);
        }
    };

    return (
        <div className="p-3 bg-white/80 dark:bg-gray-700/50 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <ClockIcon className="w-5 h-5 text-primary-500" />
                    Set Time Range
                </div>
                <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-md">
                    <input type="time" value={startTime} onChange={handleStartTimeChange} className="bg-transparent text-sm font-mono focus:outline-none p-1" />
                    <span className="text-gray-400">-</span>
                    <input type="time" value={endTime} onChange={handleEndTimeChange} className="bg-transparent text-sm font-mono focus:outline-none p-1" />
                </div>
            </div>
            <TimeRangeSlider startTime={startTime} setStartTime={setStartTime} endTime={endTime} setEndTime={setEndTime} />
        </div>
    );
};


// --- Agenda Panel for Selected Day ---
const AgendaPanel: React.FC<{ selectedDate: Date }> = ({ selectedDate }) => {
    const { state, dispatch } = useAppContext();
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [newTaskEndTime, setNewTaskEndTime] = useState('');
    const [isPrioritizing, setIsPrioritizing] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    
    const dateYMD = toYMD(selectedDate);
    
    const todosForDay = useMemo(() => {
        return state.dailyTodos
            .filter(t => t.isRecurring || t.date === dateYMD)
            .sort((a,b) => {
                if (!a.startTime) return 1;
                if (!b.startTime) return -1;
                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            });
    }, [state.dailyTodos, dateYMD]);
    
    const { scheduled, allDay } = useMemo(() => {
        return todosForDay.reduce((acc, todo) => {
            if (todo.startTime) acc.scheduled.push(todo);
            else acc.allDay.push(todo);
            return acc;
        }, { scheduled: [] as DailyTodo[], allDay: [] as DailyTodo[] });
    }, [todosForDay]);

    useEffect(() => {
        // Animate new tasks
        const listEl = listRef.current;
        if (listEl) {
            const lastChild = listEl.lastElementChild;
            if (lastChild) {
                const childCount = listEl.children.length;
                (lastChild as HTMLElement).style.setProperty('--task-index', `${childCount}`);
            }
        }
    }, [todosForDay]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;

        const datePart = new Date(dateYMD + 'T00:00:00');
        const getISOString = (time: string) => {
            if (!time) return undefined;
            const [hours, minutes] = time.split(':');
            datePart.setHours(parseInt(hours), parseInt(minutes));
            return datePart.toISOString();
        };

        dispatch({
            type: ActionType.ADD_TODO,
            payload: {
                text: newTaskText.trim(),
                date: dateYMD,
                startTime: getISOString(newTaskTime),
                endTime: getISOString(newTaskEndTime),
                isRecurring: false,
            }
        });

        setNewTaskText('');
        setNewTaskTime('');
        setNewTaskEndTime('');
    };

    const handlePrioritize = async () => {
        if (todosForDay.length < 2) return;
        setIsPrioritizing(true);
        try {
            const orderedIds = await prioritizeTasksWithAI(todosForDay);
            dispatch({ type: ActionType.REORDER_TODOS, payload: { date: dateYMD, orderedIds } });
        } catch (error) {
            alert('Failed to prioritize tasks with AI.');
        } finally {
            setIsPrioritizing(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h2 className="text-2xl font-bold">{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <button onClick={handlePrioritize} disabled={isPrioritizing || todosForDay.length < 2} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                    {isPrioritizing ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <BrainCircuitIcon className="w-5 h-5 text-primary-500" />}
                    <span className="font-semibold">Prioritize</span>
                </button>
            </header>

            <main ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {allDay.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">All-Day</h3>
                        <div className="space-y-3">
                            {allDay.map(todo => <TaskItem key={todo.id} todo={todo} dateYMD={dateYMD} />)}
                        </div>
                    </div>
                )}
                {scheduled.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">Schedule</h3>
                         <div className="space-y-3">
                            {scheduled.map(todo => <TaskItem key={todo.id} todo={todo} dateYMD={dateYMD} />)}
                        </div>
                    </div>
                )}
                 {todosForDay.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <CheckIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="mt-4 text-lg font-semibold">All Clear!</h3>
                        <p>No tasks for this day. Add one below.</p>
                    </div>
                )}
            </main>

            <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <form onSubmit={handleAddTask} className="space-y-3">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={newTaskText}
                            onChange={e => setNewTaskText(e.target.value)}
                            placeholder="Add a task for this day..."
                            className="flex-1 p-3 rounded-lg bg-white dark:bg-gray-700 border-2 border-transparent focus:border-primary-500 focus:outline-none transition"
                        />
                        <button type="submit" className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow flex-shrink-0">
                            <PlusIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <TimeSelector startTime={newTaskTime} setStartTime={setNewTaskTime} endTime={newTaskEndTime} setEndTime={setNewTaskEndTime} />
                </form>
            </footer>
        </div>
    );
};

// --- Main Planner View Component ---
export const PlannerView: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-50 dark:bg-gray-800">
            <CalendarPanel selectedDate={selectedDate} onDateChange={setSelectedDate} />
            <AgendaPanel selectedDate={selectedDate} />
        </div>
    );
};
