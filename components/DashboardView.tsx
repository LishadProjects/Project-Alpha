import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, Card, DailyTodo, Habit, List, Note } from '../types';
import { AlarmClockIcon, BookOpenIcon, CalendarIcon, CheckCircle2Icon, ClipboardCheckIcon, DumbbellIcon, LeafIcon, NotebookIcon, PauseIcon, PlayIcon, WaterBottleIcon } from './icons';
import { pomodoroModeSettings } from '../context/AppContext';

const toYMD = (date: Date) => date.toISOString().split('T')[0];

interface FormattedVerse {
    key: string;
    arabic: string;
}
interface RandomVerseResponse { verse: { verse_key: string; text_uthmani: string; } }

const GreetingAndVerseWidget: React.FC = () => {
    const { state } = useAppContext();
    const [time, setTime] = React.useState(new Date());
    const [verse, setVerse] = useState<FormattedVerse | null>(null);

    React.useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const fetchVerse = async () => {
            try {
                const cachedData = localStorage.getItem('quranVerseOfTheDay');
                const today = new Date().toISOString().split('T')[0];
                if (cachedData) {
                    const { date, verseData } = JSON.parse(cachedData);
                    if (date === today && verseData) {
                        setVerse(verseData);
                        return;
                    }
                }
                const response = await fetch(`https://api.quran.com/api/v4/verses/random?fields=text_uthmani`);
                if (!response.ok) throw new Error('Failed to fetch verse');
                const data: RandomVerseResponse = await response.json();
                const formattedVerse = { key: data.verse.verse_key, arabic: data.verse.text_uthmani };
                setVerse(formattedVerse);
                localStorage.setItem('quranVerseOfTheDay', JSON.stringify({ date: today, verseData: formattedVerse }));
            } catch (err) {
                console.error("Failed to fetch Quran verse:", err);
                setVerse({ key: "2:286", arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا" }); // Fallback
            }
        };
        fetchVerse();
    }, []);

    const getGreetingStyles = () => {
        const hour = time.getHours();
        if (hour < 12) return { msg: "Good Morning", grad: "from-primary-400 to-primary-600" };
        if (hour < 18) return { msg: "Good Afternoon", grad: "from-primary-500 to-primary-700" };
        return { msg: "Good Evening", grad: "from-primary-600 to-primary-800" };
    };

    const { msg, grad } = getGreetingStyles();

    return (
        <div style={{'--widget-index': 0} as React.CSSProperties} className={`dashboard-widget bg-gradient-to-br ${grad} p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between min-h-[180px]`}>
            <div>
                <h1 className="text-4xl font-bold">{msg}</h1>
                <p className="opacity-80 mt-1">{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            {verse && (
                <div className="text-right mt-4" dir="rtl">
                    <p className="text-2xl font-quran opacity-90">{verse.arabic}</p>
                    <p className="text-sm font-sans opacity-70 mt-1">({verse.key})</p>
                </div>
            )}
        </div>
    );
};

const WidgetCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    viewAllAction?: { label: string; onClick: () => void };
    fullHeight?: boolean;
    style?: React.CSSProperties;
}> = ({ title, icon, children, className, viewAllAction, fullHeight = false, style }) => (
    <div style={style} className={`dashboard-widget bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm ${fullHeight ? 'flex flex-col' : ''} ${className || ''}`}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-gray-200">
                {icon} {title}
            </h2>
            {viewAllAction && (
                <button onClick={viewAllAction.onClick} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                    {viewAllAction.label}
                </button>
            )}
        </div>
        <div className={fullHeight ? 'flex-1 min-h-0' : ''}>
            {children}
        </div>
    </div>
);


const TodaysFocusWidget: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const todayYMD = toYMD(new Date());

    const todaysTodos = useMemo(() => {
        return state.dailyTodos
            .filter(todo => todo.isRecurring || todo.date === todayYMD)
            .sort((a, b) => {
                const aHasTime = a.startTime && !isNaN(new Date(a.startTime).getTime());
                const bHasTime = b.startTime && !isNaN(new Date(b.startTime).getTime());
                if (aHasTime && bHasTime) return new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime();
                if (aHasTime) return -1;
                if (bHasTime) return 1;
                return 0;
            });
    }, [state.dailyTodos, todayYMD]);

    const handleToggleTodo = (todo: DailyTodo) => {
        dispatch({ type: ActionType.TOGGLE_TODO, payload: { todoId: todo.id, date: todayYMD } });
    };

    return (
        <WidgetCard
            title="Today's Focus"
            icon={<ClipboardCheckIcon className="w-6 h-6 text-primary-500" />}
            viewAllAction={{ label: 'View Planner', onClick: () => dispatch({ type: ActionType.SET_VIEW_MODE, payload: 'planner' }) }}
            fullHeight
            style={{'--widget-index': 1} as React.CSSProperties}
        >
            <div className="flex-1 overflow-y-auto pr-2">
                {todaysTodos.length > 0 ? (
                    <div className="space-y-3">
                        {todaysTodos.map(todo => {
                            const isCompleted = todo.isRecurring ? todo.completedOn?.[todayYMD] : todo.isCompleted;
                            return (
                                <div key={todo.id} onClick={() => handleToggleTodo(todo)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all ${isCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-500'}`}>
                                        {isCompleted && <CheckCircle2Icon className="w-5 h-5 text-white" />}
                                    </div>
                                    <p className={`font-medium truncate ${isCompleted ? 'line-through text-gray-500' : ''}`}>{todo.text}</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <CheckCircle2Icon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        <p className="mt-2 font-semibold">All clear for today!</p>
                    </div>
                )}
            </div>
        </WidgetCard>
    );
};

const iconMap: { [key: string]: React.FC<{ className?: string }> } = {
    DumbbellIcon, BookOpenIcon, LeafIcon, WaterBottleIcon,
};

const HabitProgressWidget: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const todayYMD = toYMD(new Date());

    const handleToggleHabit = (habit: Habit) => {
        dispatch({ type: ActionType.TOGGLE_HABIT_COMPLETION, payload: { habitId: habit.id, date: todayYMD } });
    };
    
    const habitsToShow = state.habits.filter(h => !h.isArchived).slice(0, 4);

    return (
        <WidgetCard
            title="Today's Habits"
            icon={<DumbbellIcon className="w-6 h-6 text-primary-500" />}
            viewAllAction={{ label: 'View All', onClick: () => dispatch({ type: ActionType.SET_VIEW_MODE, payload: 'habits' }) }}
             style={{'--widget-index': 3} as React.CSSProperties}
       >
            {habitsToShow.length > 0 ? (
                <div className="space-y-4">
                    {habitsToShow.map(habit => {
                        const Icon = iconMap[habit.icon] || DumbbellIcon;
                        const isCompleted = habit.completions.some(c => c.date === todayYMD);
                        return (
                            <div key={habit.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-6 h-6 ${habit.color}`} />
                                    <span className="font-medium">{habit.name}</span>
                                </div>
                                <button onClick={() => handleToggleHabit(habit)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${isCompleted ? `${habit.color.replace('text', 'bg')} text-white` : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                    <CheckCircle2Icon className="w-5 h-5"/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4">No habits set up yet.</p>
            )}
        </WidgetCard>
    );
};

const PomodoroWidget: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { pomodoro, pomodoroTasks, activePomodoroTaskId } = state;
    const activeTask = pomodoroTasks.find(t => t.id === activePomodoroTaskId);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <WidgetCard
            title="Focus Session"
            icon={<AlarmClockIcon className="w-6 h-6 text-primary-500" />}
            style={{'--widget-index': 2} as React.CSSProperties}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className={`font-semibold ${pomodoroModeSettings[pomodoro.mode].color}`}>{pomodoroModeSettings[pomodoro.mode].label}</p>
                    <p className="text-4xl font-mono font-bold mt-1">{formatTime(pomodoro.timeRemaining)}</p>
                    <p className="text-sm text-gray-500 truncate h-5 mt-1">{activeTask?.text || "No active task"}</p>
                </div>
                <button
                    onClick={() => dispatch({ type: ActionType.TOGGLE_POMODORO_TIMER })}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white ${pomodoroModeSettings[pomodoro.mode].bgColor} shadow-lg hover:brightness-110 transition-all`}
                >
                    {pomodoro.isActive ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 ml-1" />}
                </button>
            </div>
        </WidgetCard>
    );
};

const UpcomingDeadlinesWidget: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const activeBoard = state.boards[state.activeBoardId];

    const upcomingCards = useMemo(() => {
        if (!activeBoard) return [];
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return Object.values(activeBoard.cards)
            .filter((card: Card) => {
                if (!card.dueDate) return false;
                const dueDate = new Date(card.dueDate);
                return dueDate >= now && dueDate <= sevenDaysFromNow;
            })
            .sort((a: Card, b: Card) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    }, [activeBoard]);

    const getListForCard = (cardId: string) => {
        for (const list of Object.values(activeBoard?.lists || {})) {
            if ((list as List).cardIds.includes(cardId)) return (list as List);
        }
        return null;
    };
    
    const openCard = (cardId: string) => {
        const list = getListForCard(cardId);
        if(list) dispatch({ type: ActionType.OPEN_CARD_MODAL, payload: { cardId, listId: list.id } });
    }

    return (
        <WidgetCard
            title="Upcoming Deadlines"
            icon={<CalendarIcon className="w-6 h-6 text-primary-500" />}
            viewAllAction={{ label: 'View Board', onClick: () => dispatch({ type: ActionType.SET_VIEW_MODE, payload: 'board' }) }}
             style={{'--widget-index': 4} as React.CSSProperties}
       >
            {upcomingCards.length > 0 ? (
                <div className="space-y-3">
                    {upcomingCards.slice(0, 4).map(card => (
                        <div key={card.id} onClick={() => openCard(card.id)} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <p className="font-semibold truncate">{card.title}</p>
                            <p className="text-sm font-medium text-red-500 dark:text-red-400">Due: {new Date(card.dueDate!).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-8">No deadlines in the next 7 days.</p>
            )}
        </WidgetCard>
    );
};

const RecentNotesWidget: React.FC = () => {
    const { state, dispatch } = useAppContext();
    
    const recentNotes = useMemo(() => {
        return Object.values(state.notes)
            .sort((a: Note, b: Note) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 3);
    }, [state.notes]);
    
    const openNote = (noteId: string, notebookId: string) => {
        dispatch({ type: ActionType.VIEW_NOTE, payload: { noteId, notebookId } });
    };

    return (
        <WidgetCard
            title="Recent Notes"
            icon={<NotebookIcon className="w-6 h-6 text-primary-500" />}
            viewAllAction={{ label: 'View All', onClick: () => dispatch({ type: ActionType.SET_VIEW_MODE, payload: 'notes' }) }}
            style={{'--widget-index': 5} as React.CSSProperties}
        >
            {recentNotes.length > 0 ? (
                <div className="space-y-3">
                    {recentNotes.map(note => (
                        <div key={note.id} onClick={() => openNote(note.id, note.notebookId)} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <p className="font-semibold truncate">{note.title || "Untitled Note"}</p>
                            <p className="text-sm text-gray-500 truncate">{note.content.replace(/#+\s/g, '').substring(0, 100) || "No content"}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-8">No recent notes.</p>
            )}
        </WidgetCard>
    );
};

export const DashboardView: React.FC = () => {
    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 dark:bg-gray-900">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <GreetingAndVerseWidget />
                    <TodaysFocusWidget />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <PomodoroWidget />
                    <HabitProgressWidget />
                    <UpcomingDeadlinesWidget />
                    <RecentNotesWidget />
                </div>
            </div>
        </div>
    );
};