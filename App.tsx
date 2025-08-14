


import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { useAppContext } from './hooks/useAppContext';
import { CardModal } from './components/CardModal';
import { PlannerView } from './components/DailyToDoModal';
import { DailyTodo, ActionType, AppAction, BoardState, Card, PrimaryColor } from './types';
import { TrashModal } from './components/TrashModal';
import { pomodoroModeSettings } from './context/AppContext';
import { VerseSelectorModal } from './components/VerseSelectorModal';
import { NotificationModal } from './components/NotificationModal';
import { NotesView } from './components/NotesView';
import { PasswordProtection } from './components/PasswordProtection';
import { MindMap } from './components/MindMap';
import { TimelineView } from './components/TimelineView';
import { FinanceView } from './components/FinanceView';
import { QuranView } from './components/QuranView';
import { HabitTrackerView } from './components/HabitTrackerView';
import { HabitDetailModal } from './components/HabitDetailModal';
import { DashboardView } from './components/DashboardView';
import { BookmarksView } from './components/BookmarksView';

const timeToSeconds = (isoString: string): number => {
    const date = new Date(isoString);
    return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
};

// A visual timeline component to track the current time and scheduled tasks.
const TimeTracker: React.FC<{ todos: DailyTodo[]; width: number; dispatch: React.Dispatch<AppAction> }> = ({ todos, width, dispatch }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineAreaRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);

    // Drag-to-create state
    const [isDragging, setIsDragging] = useState(false);
    const [selectionArea, setSelectionArea] = useState<{ start: number; end: number } | null>(null);
    const [newTaskInfo, setNewTaskInfo] = useState<{ top: number; startTime: Date; endTime: Date; height: number; } | null>(null);
    
    const [newTaskText, setNewTaskText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const scheduledTodos = useMemo(() => todos.filter(todo => {
        if (!todo.startTime || !todo.endTime) return false;
        const startTime = new Date(todo.startTime);
        const endTime = new Date(todo.endTime);
        return !isNaN(startTime.getTime()) && !isNaN(endTime.getTime());
    }), [todos]);

    // Update time every second
    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    // Scroll to the current time on initial render
    useEffect(() => {
        if (containerRef.current && indicatorRef.current) {
            const containerHeight = containerRef.current.clientHeight;
            // Position indicator in the middle of the viewport for better context
            const scrollPosition = indicatorRef.current.offsetTop - (containerHeight / 2);
            containerRef.current.scrollTo({ top: scrollPosition, behavior: 'auto' });
        }
    }, []); // Only runs once on mount

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourHeight = 60; // 60px per hour
    const totalHeight = hours.length * hourHeight;

    const secondsInDay = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
    const indicatorTopPosition = (secondsInDay / 86400) * totalHeight;

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent starting drag when clicking on a task or the input field
        if (e.target !== timelineAreaRef.current) {
            return;
        }
        e.preventDefault();
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const startY = e.clientY - rect.top + e.currentTarget.scrollTop;
        setSelectionArea({ start: startY, end: startY });
        setNewTaskInfo(null); // Clear previous input form if any
    };

    useEffect(() => {
        const timelineArea = timelineAreaRef.current;
        if (!timelineArea) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !selectionArea || !timelineArea) return;
            const rect = timelineArea.getBoundingClientRect();
            const currentY = e.clientY - rect.top + timelineArea.scrollTop;
            setSelectionArea({ ...selectionArea, end: Math.max(0, Math.min(totalHeight, currentY)) });
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!isDragging || !selectionArea) {
                setIsDragging(false);
                return;
            }
        
            setIsDragging(false);
            
            let startPixel = Math.min(selectionArea.start, selectionArea.end);
            let endPixel = Math.max(selectionArea.start, selectionArea.end);
            let height = endPixel - startPixel;
            
            // If it was a click (very small drag), create a default 30-min event from the start point.
            if (height < 5) {
                const thirtyMinInPixels = (30 / (24 * 60)) * totalHeight;
                endPixel = startPixel + thirtyMinInPixels;
                height = thirtyMinInPixels;
            }
        
            // Calculate times
            const startSeconds = (startPixel / totalHeight) * 86400;
            const endSeconds = (endPixel / totalHeight) * 86400;
        
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startTime = new Date(today.getTime() + startSeconds * 1000);
            const endTime = new Date(today.getTime() + endSeconds * 1000);
            
            setNewTaskInfo({ top: startPixel, startTime, endTime, height });
            setSelectionArea(null); // Hide selection area after mouse up
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp, { once: true });
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, selectionArea, totalHeight]);


    useEffect(() => {
        if (newTaskInfo && inputRef.current) {
            inputRef.current.focus();
        }
    }, [newTaskInfo]);

    const handleSaveNewTask = () => {
        if (newTaskText.trim() && newTaskInfo) {
            dispatch({
                type: ActionType.ADD_TODO,
                payload: {
                    text: newTaskText.trim(),
                    date: new Date().toISOString().split('T')[0],
                    startTime: newTaskInfo.startTime.toISOString(),
                    endTime: newTaskInfo.endTime.toISOString(),
                    isRecurring: false,
                }
            });
        }
        setNewTaskText('');
        setNewTaskInfo(null);
    };

    return (
        <aside 
            ref={containerRef} 
            style={{ width: `${width}rem` }}
            className="h-full bg-gray-50 dark:bg-gray-800/50 border-l border-gray-200 dark:border-gray-700 overflow-y-auto relative select-none"
        >
            <div ref={timelineAreaRef} className="relative" style={{ height: `${totalHeight}px` }} onMouseDown={handleMouseDown}>
                {/* Hour markers */}
                {hours.map(hour => (
                    <div key={hour} className="h-[60px] flex items-start text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 relative">
                        <span className="w-full pt-1 pr-2 text-right">
                           {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </span>
                         {/* Faint half-hour line */}
                        <div className="absolute top-1/2 left-3 right-0 h-px bg-gray-200/70 dark:bg-gray-700/50"></div>
                    </div>
                ))}
                
                {/* Scheduled Todos */}
                {scheduledTodos.map(todo => {
                    const startSeconds = timeToSeconds(todo.startTime!);
                    const endSeconds = timeToSeconds(todo.endTime!);
                    if (endSeconds <= startSeconds) return null; // Ignore invalid events

                    const top = (startSeconds / 86400) * totalHeight;
                    const height = ((endSeconds - startSeconds) / 86400) * totalHeight;
                    
                    const taskBaseClasses = "absolute left-2 right-2 p-1.5 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg hover:brightness-110 flex items-start cursor-pointer";
                    const standardTaskClasses = "bg-gradient-to-br from-primary-400/70 to-primary-500/70 dark:from-primary-500/60 dark:to-primary-600/60 border-l-4 border-primary-500 dark:border-primary-400";
                    const recurringTaskClasses = "bg-primary-400/50 dark:bg-primary-500/40 border-l-4 border-primary-500 dark:border-primary-400 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.1)_4px,rgba(255,255,255,0.1)_8px)]";


                    return (
                        <div
                            key={todo.id}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => dispatch({ type: ActionType.SET_VIEW_MODE, payload: 'planner' })}
                            className={`${taskBaseClasses} ${todo.isRecurring ? recurringTaskClasses : standardTaskClasses}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            title={`${todo.text} (${new Date(todo.startTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(todo.endTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`}
                        >
                            <p className="text-xs font-semibold text-white truncate">{todo.text}</p>
                        </div>
                    );
                })}

                {/* Selection Area rendering */}
                {selectionArea && (
                    <div 
                        className="absolute left-2 right-2 bg-primary-500/30 border-2 border-dashed border-primary-500 rounded-lg z-10 pointer-events-none"
                        style={{
                            top: `${Math.min(selectionArea.start, selectionArea.end)}px`,
                            height: `${Math.abs(selectionArea.end - selectionArea.start)}px`,
                        }}
                    />
                )}

                {/* Current Time Indicator */}
                <div 
                    ref={indicatorRef}
                    className="absolute w-full left-0 flex items-center z-20 pointer-events-none"
                    style={{ top: `${indicatorTopPosition}px` }}
                    aria-label={`Current time: ${currentTime.toLocaleTimeString()}`}
                >
                    <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 flex-shrink-0 shadow-lg z-10"></div>
                    <div className="flex-1 h-0.5 bg-red-500"></div>
                </div>

                {/* Inline task creation form */}
                {newTaskInfo && (
                    <div className="absolute left-2 right-2 rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-300 dark:border-gray-600 z-30"
                         style={{ top: `${newTaskInfo.top}px`, height: `${newTaskInfo.height}px` }}
                         onMouseDown={e => e.stopPropagation()} // Prevent starting a new drag from the input
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onBlur={handleSaveNewTask}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveNewTask(); if (e.key === 'Escape') setNewTaskInfo(null); }}
                            className="w-full h-full text-xs px-2 bg-transparent focus:outline-none placeholder:text-gray-500"
                            placeholder="New task title..."
                        />
                    </div>
                )}
            </div>
        </aside>
    );
};

const getTodosForToday = (allTodos: DailyTodo[]): DailyTodo[] => {
    const today = new Date();
    const todayYMD = today.toISOString().split('T')[0];

    return allTodos.filter(todo => todo.isRecurring || todo.date === todayYMD);
}

const formatPomodoroTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const App: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { pomodoro, boards, activeBoardId, appViewScale } = state;
  const activeBoard = boards[activeBoardId] || null;

  const [isTimeTrackerOpen, setIsTimeTrackerOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalTitle = useRef(document.title);
  
  const primaryColorOptions: PrimaryColor[] = ['blue', 'green', 'rose', 'orange', 'violet', 'slate', 'cyan', 'pink', 'emerald', 'sky', 'amber', 'lime'];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Handle theme (light/dark/khata/gradient)
    root.classList.remove('dark', 'theme-khata', 'theme-gradient');
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else if (state.theme === 'khata') {
        root.classList.add('theme-khata');
    } else if (state.theme === 'gradient') {
        root.classList.add('theme-gradient');
    }

    // Handle primary color
    root.classList.forEach(className => {
        if (className.startsWith('theme-color-')) {
            root.classList.remove(className);
        }
    });
    root.classList.add(`theme-color-${state.primaryColor}`);

  }, [state.theme, state.primaryColor]);
  
  // Effect for automatic color changing
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (state.isAutoColorChangeEnabled) {
      intervalId = window.setInterval(() => {
        const availableColors = primaryColorOptions.filter(c => c !== state.primaryColor);
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        const randomColor = availableColors[randomIndex];
        dispatch({ type: ActionType.SET_PRIMARY_COLOR, payload: randomColor });
      }, state.autoColorChangeInterval * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.isAutoColorChangeEnabled, state.autoColorChangeInterval, state.primaryColor, dispatch]);

  // Initialize audio once
  useEffect(() => {
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
  }, []);

  // Effect for timer logic
  useEffect(() => {
      let timerId: number | null = null;

      if (pomodoro.isActive && pomodoro.timeRemaining > 0) {
          timerId = window.setInterval(() => {
              dispatch({ type: ActionType.UPDATE_POMODORO_TIME });
          }, 1000);
      } else if (pomodoro.isActive && pomodoro.timeRemaining <= 0) {
          audioRef.current?.play().catch(e => console.error("Audio error:", e));
          
          const message = pomodoro.currentTaskText
            ? `Your ${pomodoroModeSettings[pomodoro.mode].label} session for "${pomodoro.currentTaskText}" is complete!`
            : `Your ${pomodoroModeSettings[pomodoro.mode].label} session is complete!`;
          
          dispatch({
            type: ActionType.ADD_NOTIFICATION,
            payload: {
                type: 'pomodoro',
                message
            }
          });

          dispatch({ type: ActionType.SET_NEXT_POMODORO_MODE });
      }

      return () => {
          if (timerId) clearInterval(timerId);
      };
  }, [pomodoro.isActive, pomodoro.timeRemaining, pomodoro.mode, pomodoro.currentTaskText, dispatch]);

  // Effect for document title
  useEffect(() => {
      if (pomodoro.isActive) {
          document.title = `${formatPomodoroTime(pomodoro.timeRemaining)} - ${pomodoroModeSettings[pomodoro.mode].label} | ${originalTitle.current}`;
      } else {
          document.title = originalTitle.current;
      }
  }, [pomodoro.isActive, pomodoro.timeRemaining, pomodoro.mode]);

  useEffect(() => {
    // Purge old trashed items on app load
    dispatch({ type: ActionType.PURGE_OLD_TRASHED_CARDS });
  }, [dispatch]);

  const todaysTodos = getTodosForToday(state.dailyTodos);

  // Effect for generating time-based notifications
  useEffect(() => {
    if (!activeBoard) return;
    const cardToListMap = Object.fromEntries(
        (activeBoard.listOrder || [])
            .map(listId => activeBoard.lists[listId])
            .filter(Boolean)
            .flatMap(list => (list.cardIds || []).map(cardId => [cardId, list.id]))
    );
      
    const checkNotifications = () => {
        const today = new Date();
        const todayYMD = today.toISOString().split('T')[0];
        
        // Due Date Notifications
        Object.values(activeBoard.cards).forEach((card: Card) => {
            if (card.dueDate) {
                const dueDate = new Date(card.dueDate);
                if (isNaN(dueDate.getTime())) return; // Skip if date is invalid

                const dueDateYMD = dueDate.toISOString().split('T')[0];
                const notificationType = dueDate < today && dueDateYMD !== todayYMD ? 'overdue' : (dueDateYMD === todayYMD ? 'due_today' : null);

                if (notificationType) {
                    const message = notificationType === 'overdue' ? `Task "${card.title}" is overdue.` : `Task "${card.title}" is due today.`;
                    const existingNotif = state.notifications.find(n => n.relatedId === card.id && n.message === message);
                    if (!existingNotif) {
                        const listId = cardToListMap[card.id];
                        if (listId) {
                            dispatch({
                                type: ActionType.ADD_NOTIFICATION,
                                payload: { type: 'dueDate', message, relatedId: card.id, listId }
                            });
                        }
                    }
                }
            }
        });

        // Schedule Notifications
        const fiveMinutesFromNow = new Date(today.getTime() + 5 * 60 * 1000);
        todaysTodos.forEach(todo => {
            if (!todo.startTime) return;
            const startTime = new Date(todo.startTime);
            if (isNaN(startTime.getTime())) return;
            
            if(startTime > today && startTime <= fiveMinutesFromNow) {
                const existingNotif = state.notifications.find(n => n.relatedId === todo.id);
                if (!existingNotif) {
                    dispatch({
                        type: ActionType.ADD_NOTIFICATION,
                        payload: {
                            type: 'schedule',
                            message: `Upcoming: "${todo.text}" starts in 5 minutes.`,
                            relatedId: todo.id,
                        }
                    });
                }
            }
        });
    };

    checkNotifications(); // Check once on load
    const intervalId = setInterval(checkNotifications, 60000); // And every minute after

    return () => clearInterval(intervalId);
  }, [activeBoard, todaysTodos, dispatch, state.notifications]); // Rerun if these change

    const generateSalatTasksForToday = useCallback(() => {
        if (!state.salatTimes || Object.keys(state.salatTimes).length === 0) {
            return;
        }

        const prayerTasks: { [key: string]: number } = {
            Tahajjud: 10, Fajr: 15, Dhuhr: 20, Asr: 12, Maghrib: 15, Isha: 30,
        };
        const prayerNameMapping: { [key: string]: string } = {
            Dhuhr: "Zahar", Asr: "Asar", Maghrib: "Magrib",
        };

        const todayYMD = new Date().toISOString().split('T')[0];

        const existingSalatPrayers = new Set(
            state.dailyTodos
                .filter(todo => todo.salatPrayer)
                .map(todo => todo.salatPrayer)
        );

        Object.entries(prayerTasks).forEach(([prayerKey, duration]) => {
            if (existingSalatPrayers.has(prayerKey)) {
                return; // Skip if a task for this prayer already exists
            }
            
            const prayerDisplayName = prayerNameMapping[prayerKey] || prayerKey;
            const taskTitle = `[Salat] ${prayerDisplayName}`;
            
            const prayerTimeStr = state.salatTimes[prayerKey === 'Tahajjud' ? 'Fajr' : prayerKey];
            if (!prayerTimeStr) return;

            const [hours, minutes] = prayerTimeStr.split(':').map(Number);
            
            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0, 0);

            let startTime: Date;
            let endTime: Date;

            if (prayerKey === 'Tahajjud') {
                startTime = new Date(prayerDate.getTime() - duration * 60 * 1000);
                endTime = prayerDate;
            } else {
                startTime = prayerDate;
                endTime = new Date(prayerDate.getTime() + duration * 60 * 1000);
            }

            dispatch({
                type: ActionType.ADD_TODO,
                payload: {
                    text: taskTitle,
                    date: todayYMD,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    isRecurring: true,
                    salatPrayer: prayerKey,
                }
            });
        });
    }, [state.salatTimes, state.dailyTodos, dispatch]);
    
    useEffect(() => {
        let timeoutId: number;
    
        const scheduleNextRun = () => {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const msUntilMidnight = tomorrow.getTime() - now.getTime();
            
            timeoutId = window.setTimeout(() => {
                generateSalatTasksForToday();
                scheduleNextRun(); // Reschedule for the next day
            }, msUntilMidnight + 1000); // Add a second to be safely in the next day
        };
    
        // Run once on initial load
        generateSalatTasksForToday();
        
        // Schedule the first daily run
        scheduleNextRun();
    
        // Cleanup on unmount
        return () => clearTimeout(timeoutId);
      }, [generateSalatTasksForToday]);


    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        const newWidthInPixels = window.innerWidth - e.clientX;
        // root font-size is 16px.
        const newWidthInRem = newWidthInPixels / 16;
        const constrainedWidth = Math.max(5, Math.min(25, newWidthInRem));
        dispatch({ type: ActionType.SET_TIME_TRACKER_WIDTH, payload: constrainedWidth });
    }, [dispatch]);

    const handleResizeMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);
    
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMouseMove);
            document.addEventListener('mouseup', handleResizeMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleResizeMouseMove);
            document.removeEventListener('mouseup', handleResizeMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
    }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);


  if (!state.isAuthenticated) {
    return <PasswordProtection />;
  }
  
  const isCompactView = !isMobile && appViewScale === 0.75;

  const renderCurrentView = () => {
    switch(state.viewMode) {
        case 'dashboard':
            return <DashboardView />;
        case 'board':
            return (
                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 overflow-x-auto overflow-y-hidden">
                        <Board />
                    </main>
                    {/* Desktop Time Tracker */}
                    <div className="hidden md:flex">
                        <div 
                            className="w-1.5 cursor-col-resize bg-gray-200 dark:bg-gray-700 hover:bg-primary-300 dark:hover:bg-primary-700 transition-colors flex-shrink-0"
                            onMouseDown={handleResizeMouseDown}
                        />
                        <TimeTracker todos={todaysTodos} width={state.timeTrackerWidth} dispatch={dispatch} />
                    </div>
                </div>
            );
        case 'planner':
            return <PlannerView />;
        case 'whiteboard':
            return <MindMap />;
        case 'timeline':
            return <TimelineView />;
        case 'finance':
            return <FinanceView />;
        case 'quran':
            return <QuranView />;
        case 'notes':
            return <NotesView />;
        case 'habits':
            return <HabitTrackerView />;
        case 'bookmarks':
            return <BookmarksView />;
        default:
            return <div className="flex-1 flex items-center justify-center">Unknown view</div>;
    }
  };

  return (
    <div className={`${(state.theme === 'khata' || state.theme === 'gradient') ? 'bg-transparent' : 'bg-gray-100 dark:bg-gray-900'} text-gray-900 dark:text-gray-100 h-screen w-screen overflow-hidden flex flex-col font-sans`}>
      <Header setIsTimeTrackerOpen={setIsTimeTrackerOpen} />

      <div className="flex-1 overflow-auto">
        <div 
          style={{
            width: isCompactView ? `${100 / 0.75}%` : '100%',
            height: isCompactView ? `${100 / 0.75}%` : '100%',
            transform: `scale(${isCompactView ? 0.75 : 1})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          {renderCurrentView()}
        </div>
      </div>

      {/* Mobile Time Tracker (Overlay) */}
      {isTimeTrackerOpen && (
        <>
            <div 
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                onClick={() => setIsTimeTrackerOpen(false)}
                aria-hidden="true"
            ></div>
            <div className="fixed top-0 right-0 h-full z-30 md:hidden shadow-2xl">
                <TimeTracker todos={todaysTodos} width={state.timeTrackerWidth} dispatch={dispatch} />
            </div>
        </>
      )}

      {state.activeCardId && <CardModal />}
      {state.isTrashOpen && <TrashModal />}
      {state.isVerseSelectorOpen && <VerseSelectorModal />}
      {state.isNotificationsOpen && <NotificationModal />}
      {state.isHabitDetailOpen && <HabitDetailModal />}
    </div>
  );
};

export default App;
