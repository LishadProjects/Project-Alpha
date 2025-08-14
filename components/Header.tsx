


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, BoardState, PrimaryColor, ViewMode } from '../types';
import { SunIcon, MoonIcon, EditIcon, MoreVerticalIcon, Trash2Icon, ClipboardCheckIcon, AlarmClockIcon, ClockIcon, BookOpenIcon, BellIcon, NotebookIcon, LayoutDashboardIcon, Share2Icon, CalendarRangeIcon, WalletIcon, FlagIcon, PlayIcon, PauseIcon, RepeatIcon, LayoutGridIcon, PlusIcon, CheckIcon, ChevronDownIcon, HomeIcon, BookmarkIcon, RotateCcwIcon, BrainCircuitIcon, LandmarkIcon, PaletteIcon } from './icons';
import { PomodoroTimer } from './PomodoroTimer';
import { pomodoroModeSettings } from '../context/AppContext';
import { SalatClock } from './SalatClock';

const formatPomodoroTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const primaryColorOptions: { name: PrimaryColor; bgClass: string }[] = [
    { name: 'blue', bgClass: 'bg-[#3b82f6]' },
    { name: 'green', bgClass: 'bg-[#22c55e]' },
    { name: 'rose', bgClass: 'bg-[#f43f5e]' },
    { name: 'orange', bgClass: 'bg-[#f97316]' },
    { name: 'violet', bgClass: 'bg-[#8b5cf6]' },
    { name: 'slate', bgClass: 'bg-[#64748b]' },
    { name: 'cyan', bgClass: 'bg-[#06b6d4]' },
    { name: 'pink', bgClass: 'bg-[#ec4899]' },
    { name: 'emerald', bgClass: 'bg-[#10b981]' },
    { name: 'sky', bgClass: 'bg-[#0ea5e9]' },
    { name: 'amber', bgClass: 'bg-[#f59e0b]' },
    { name: 'lime', bgClass: 'bg-[#84cc16]' },
];

const AnimatedClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const currentHour = time.getHours();
    const ampm = currentHour >= 12 ? 'PM' : 'AM';
    let hours = currentHour % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const displayHours = String(hours).padStart(2, '0');
    
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');

    return (
        <div className="flex items-center gap-1 font-mono text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 tracking-wider tabular-nums">
            <span className="px-2 py-1 rounded-md bg-gray-200/50 dark:bg-gray-700/50">{displayHours}</span>
            <span className="blinking-colon mx-0.5">:</span>
            <span className="px-2 py-1 rounded-md bg-gray-200/50 dark:bg-gray-700/50">{minutes}</span>
            <span className="blinking-colon mx-0.5">:</span>
            <span key={seconds} className="px-2 py-1 rounded-md bg-gray-200/50 dark:bg-gray-700/50 second-flipper">
                {seconds}
            </span>
            <span className="text-sm font-semibold ml-2">{ampm}</span>
        </div>
    );
};

const BoardSwitcher: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const switcherRef = useRef<HTMLDivElement>(null);
    const activeBoard = state.boards[state.activeBoardId];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsCreating(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitchBoard = (boardId: string) => {
        dispatch({ type: ActionType.SWITCH_BOARD, payload: { boardId } });
        setIsOpen(false);
    };

    const handleAddBoard = (e: React.FormEvent) => {
        e.preventDefault();
        if (newBoardTitle.trim()) {
            dispatch({ type: ActionType.ADD_BOARD, payload: { title: newBoardTitle.trim() } });
            setNewBoardTitle('');
            setIsCreating(false);
            setIsOpen(false);
        }
    };

    const handleDeleteBoard = (boardId: string, boardTitle: string) => {
        if (window.confirm(`Are you sure you want to delete the board "${boardTitle}"? This action cannot be undone.`)) {
            dispatch({ type: ActionType.DELETE_BOARD, payload: { boardId } });
        }
    };

    return (
        <div className="relative" ref={switcherRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <LayoutGridIcon className="w-5 h-5" />
                <span className="font-semibold">{activeBoard?.title}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-700">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="px-2 font-semibold text-sm">Your Boards</h4>
                    </div>
                    <div className="p-2 max-h-60 overflow-y-auto">
                        {Object.values(state.boards).map((board: BoardState) => (
                            <div key={board.id} className="group flex items-center justify-between w-full text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <button onClick={() => handleSwitchBoard(board.id)} className="flex-1 flex items-center gap-3 px-3 py-1.5 text-sm">
                                    <span className="font-medium">{board.title}</span>
                                    {board.id === state.activeBoardId && <CheckIcon className="w-4 h-4 text-primary-500" />}
                                </button>
                                {Object.keys(state.boards).length > 1 && board.id !== state.activeBoardId && (
                                  <button
                                      onClick={() => handleDeleteBoard(board.id, board.title)}
                                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 mr-1 opacity-0 group-hover:opacity-100"
                                  >
                                      <Trash2Icon className="w-4 h-4" />
                                  </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        {isCreating ? (
                            <form onSubmit={handleAddBoard}>
                                <input
                                    type="text"
                                    value={newBoardTitle}
                                    onChange={e => setNewBoardTitle(e.target.value)}
                                    placeholder="New board title..."
                                    autoFocus
                                    className="w-full px-2 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                                <div className="flex items-center justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => setIsCreating(false)} className="px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md">Cancel</button>
                                    <button type="submit" className="px-2 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700">Create</button>
                                </div>
                            </form>
                        ) : (
                            <button onClick={() => setIsCreating(true)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <PlusIcon className="w-4 h-4" /> Create new board
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const viewOptions: { view: ViewMode; icon: React.FC<{ className?: string }>; label: string }[] = [
    { view: 'dashboard', icon: HomeIcon, label: 'Dashboard' },
    { view: 'board', icon: LayoutDashboardIcon, label: 'Board' },
    { view: 'planner', icon: ClipboardCheckIcon, label: 'Planner' },
    { view: 'notes', icon: NotebookIcon, label: 'Notes' },
    { view: 'bookmarks', icon: BookmarkIcon, label: 'Bookmarks' },
    { view: 'whiteboard', icon: EditIcon, label: 'Whiteboard' },
    { view: 'timeline', icon: CalendarRangeIcon, label: 'Timeline' },
    { view: 'habits', icon: RepeatIcon, label: 'Habits' },
    { view: 'quran', icon: FlagIcon, label: 'Quran' },
    { view: 'finance', icon: WalletIcon, label: 'Finance' },
];

const ViewSwitcherDropdown: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const switcherRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleSelectView = (view: ViewMode) => {
        dispatch({ type: ActionType.SET_VIEW_MODE, payload: view });
        setIsOpen(false);
    };

    const activeView = viewOptions.find(v => v.view === state.viewMode) || viewOptions[0];
    const ActiveIcon = activeView.icon;

    return (
        <div className="relative" ref={switcherRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <ActiveIcon className="w-5 h-5" />
                <span className="font-semibold hidden sm:inline">{activeView.label}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-700">
                    <div className="p-2 space-y-1">
                        {viewOptions.map(({ view, icon: Icon, label }) => (
                            <button 
                                key={view} 
                                onClick={() => handleSelectView(view)} 
                                className={`w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-md text-sm ${state.viewMode === view ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


export const Header: React.FC<{ setIsTimeTrackerOpen: (isOpen: boolean) => void }> = ({ setIsTimeTrackerOpen }) => {
  const { state, dispatch } = useAppContext();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pomodoroRef = useRef<HTMLDivElement>(null);

  const activeBoard = state.boards[state.activeBoardId];
  const unreadNotificationsCount = state.notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (activeBoard) {
        setEditedTitle(activeBoard.title);
    }
  }, [activeBoard]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
      if (pomodoroRef.current && !pomodoroRef.current.contains(event.target as Node)) dispatch({ type: ActionType.CLOSE_POMODORO_POPOVER });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  const openTrashModal = () => {
    dispatch({ type: ActionType.OPEN_TRASH_MODAL });
    setIsMenuOpen(false);
  };

  const handleTitleSave = () => {
    if (activeBoard && editedTitle.trim() && editedTitle.trim() !== activeBoard.title) {
      dispatch({ type: ActionType.UPDATE_BOARD_TITLE, payload: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const viewTitle = useMemo(() => {
    switch (state.viewMode) {
      case 'dashboard': return 'Dashboard';
      case 'board': return activeBoard?.title || 'Board';
      case 'planner': return 'Weekly Planner';
      case 'whiteboard': return 'Whiteboard';
      case 'timeline': return 'Timeline';
      case 'finance': return 'Financial Overview';
      case 'quran': return 'Quran Memorization';
      case 'notes': return 'Notes';
      case 'habits': return 'Habit Tracker';
      case 'bookmarks': return 'Bookmarks';
      default: return 'Project Alpha';
    }
  }, [state.viewMode, activeBoard]);

  return (
    <header className="relative z-10 px-2 sm:px-4 py-3 grid grid-cols-2 sm:grid-cols-3 items-center border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <div className="flex justify-start items-center gap-2 sm:group px-1">
        {state.viewMode === 'board' ? <BoardSwitcher /> : 
            <h1 className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400 truncate">{viewTitle}</h1>
        }
        {isEditingTitle && state.viewMode === 'board' && (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            autoFocus
            className="text-lg sm:text-xl font-bold bg-transparent border-b-2 border-primary-500 focus:outline-none text-primary-600 dark:text-primary-400 w-full text-left"
          />
        )}
        {state.viewMode === 'board' && !isEditingTitle && (
            <button onClick={() => setIsEditingTitle(true)} className="p-1 rounded-full sm:opacity-0 sm:group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity flex-shrink-0">
            <EditIcon className="w-5 h-5" />
            </button>
        )}
      </div>

      <div className="hidden sm:flex justify-center">
        {state.pomodoro.compactView ? (
            <div className="flex items-center gap-4">
                <AnimatedClock />
                <div
                    onClick={() => dispatch({ type: ActionType.TOGGLE_POMODORO_POPOVER })}
                    className="flex items-center gap-1 cursor-pointer p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Open Pomodoro Timer"
                >
                    <AlarmClockIcon className={`w-4 h-4 transition-colors ${pomodoroModeSettings[state.pomodoro.mode].color}`} />
                    <span className="font-mono text-base font-bold text-gray-800 dark:text-gray-200 tracking-wider tabular-nums">
                        {formatPomodoroTime(state.pomodoro.timeRemaining)}
                    </span>
                </div>
            </div>
        ) : (
            <div className="flex items-center gap-2 sm:gap-4 bg-white/60 dark:bg-gray-900/50 px-2 sm:px-4 py-1.5 rounded-xl shadow-lg shadow-black/5 ring-1 ring-black/5 dark:ring-white/10">
                <div className={`hidden sm:flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600 ${state.pomodoro.isActive ? 'opacity-100' : 'opacity-70'}`}>
                    <button
                        onClick={() => dispatch({ type: ActionType.TOGGLE_POMODORO_TIMER })}
                        className="p-1 rounded-full hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition-colors"
                        aria-label={state.pomodoro.isActive ? 'Pause timer' : 'Start timer'}
                    >
                        {state.pomodoro.isActive 
                            ? <PauseIcon className="w-4 h-4" /> 
                            : <PlayIcon className="w-4 h-4 ml-0.5" />}
                    </button>
                    <AlarmClockIcon className={`w-4 h-4 transition-colors ${pomodoroModeSettings[state.pomodoro.mode].color}`} />
                    <span className="font-mono text-base font-bold text-gray-800 dark:text-gray-200 tracking-wider tabular-nums">
                        {formatPomodoroTime(state.pomodoro.timeRemaining)}
                    </span>
                </div>
                <AnimatedClock />
                {state.pomodoro.currentTaskText && (
                    <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-gray-300 dark:border-gray-600 ml-4">
                        <BrainCircuitIcon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Focusing on:</p>
                            <p className="font-semibold text-sm truncate max-w-xs">{state.pomodoro.currentTaskText}</p>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="flex items-center gap-0 sm:gap-2 justify-self-end">
        {state.viewMode !== 'dashboard' && (
            <button
                onClick={() => dispatch({ type: ActionType.SET_VIEW_MODE, payload: 'dashboard' })}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Go to Dashboard"
                aria-label="Go to Dashboard"
            >
                <HomeIcon className="w-5 h-5" />
            </button>
        )}
        <ViewSwitcherDropdown />
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden sm:block"></div>
        
        <button onClick={() => setIsTimeTrackerOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors md:hidden"><ClockIcon className="w-5 h-5" /></button>
        
        <SalatClock />

        <div className="relative" ref={pomodoroRef}>
            <button onClick={() => dispatch({ type: ActionType.TOGGLE_POMODORO_POPOVER })} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><AlarmClockIcon className="w-5 h-5" /></button>
            {state.pomodoro.isPopoverOpen && <PomodoroTimer onClose={() => dispatch({ type: ActionType.CLOSE_POMODORO_POPOVER })} />}
        </div>
        
        <button onClick={() => dispatch({ type: ActionType.OPEN_NOTIFICATIONS_MODAL })} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><BellIcon className="w-5 h-5" />
          {unreadNotificationsCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadNotificationsCount}</span>}
        </button>

        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><MoreVerticalIcon className="w-5 h-5" /></button>
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-700">
                    <div className="p-2">
                        <h4 className="px-2 pt-1 pb-2 font-semibold">Theme</h4>
                        <div className="flex justify-around p-1 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                            <button onClick={() => dispatch({ type: ActionType.SET_THEME, payload: 'light' })} className={`w-8 h-8 rounded-full flex items-center justify-center ${state.theme === 'light' ? 'ring-2 ring-primary-500' : ''}`}><SunIcon className="w-5 h-5"/></button>
                            <button onClick={() => dispatch({ type: ActionType.SET_THEME, payload: 'dark' })} className={`w-8 h-8 rounded-full flex items-center justify-center ${state.theme === 'dark' ? 'ring-2 ring-primary-500' : ''}`}><MoonIcon className="w-5 h-5"/></button>
                            <button onClick={() => dispatch({ type: ActionType.SET_THEME, payload: 'khata' })} className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold font-serif ${state.theme === 'khata' ? 'ring-2 ring-primary-500' : ''}`}>খ</button>
                            <button onClick={() => dispatch({ type: ActionType.SET_THEME, payload: 'gradient' })} className={`w-8 h-8 rounded-full flex items-center justify-center ${state.theme === 'gradient' ? 'ring-2 ring-primary-500' : ''}`}><PaletteIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                     <div className="p-2">
                        <div className="flex justify-between items-center px-2">
                          <h4 className="pt-1 pb-2 font-semibold">Color</h4>
                          <button
                            onClick={() => {
                                const availableColors = primaryColorOptions.map(c => c.name).filter(c => c !== state.primaryColor);
                                const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
                                dispatch({ type: ActionType.SET_PRIMARY_COLOR, payload: randomColor });
                            }}
                            className="p-1 text-gray-500 hover:text-primary-500" title="Select Random Color"
                          >
                            <PaletteIcon className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-6 gap-2 px-1">
                            {primaryColorOptions.map(color => (
                                <button key={color.name} onClick={() => dispatch({ type: ActionType.SET_PRIMARY_COLOR, payload: color.name })} className={`w-8 h-8 rounded-full ${color.bgClass} ${state.primaryColor === color.name ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-primary-500' : ''}`}></button>
                            ))}
                        </div>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                     <div className="p-2">
                        <div className="flex justify-between items-center px-2 py-1.5">
                            <label htmlFor="auto-color-toggle" className="font-semibold text-sm">Auto Random Color</label>
                            <button
                                id="auto-color-toggle"
                                onClick={() => dispatch({ type: ActionType.TOGGLE_AUTO_COLOR_CHANGE })}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${state.isAutoColorChangeEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span
                                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${state.isAutoColorChangeEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                        {state.isAutoColorChangeEnabled && (
                            <div className="px-2 pt-2 space-y-1">
                                <label htmlFor="auto-color-interval" className="text-xs text-gray-500 dark:text-gray-400">
                                    Change every {state.autoColorChangeInterval} seconds
                                </label>
                                <input
                                    id="auto-color-interval"
                                    type="range"
                                    min="1"
                                    max="180"
                                    step="1"
                                    value={state.autoColorChangeInterval}
                                    onChange={(e) => dispatch({ type: ActionType.SET_AUTO_COLOR_CHANGE_INTERVAL, payload: parseInt(e.target.value, 10) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
                                />
                            </div>
                        )}
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                     <div className="p-2">
                         <button onClick={() => { dispatch({ type: ActionType.OPEN_VERSE_SELECTOR }); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <BookOpenIcon className="w-5 h-5"/>
                            <span>Quran Verse</span>
                        </button>
                    </div>
                    
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                    <div className="p-2">
                         <div className="flex justify-between items-center px-2 py-1.5">
                            <label htmlFor="pomodoro-compact-toggle" className="font-semibold text-sm">Compact Clock</label>
                            <button
                                id="pomodoro-compact-toggle"
                                onClick={() => dispatch({ type: ActionType.TOGGLE_POMODORO_COMPACT_VIEW })}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${state.pomodoro.compactView ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span
                                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${state.pomodoro.compactView ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    </div>
                    <div className="p-2">
                            <div className="flex justify-between items-center px-2 py-1.5">
                            <label htmlFor="compact-view-toggle" className="font-semibold text-sm">Compact Board View</label>
                            <button
                                id="compact-view-toggle"
                                onClick={() => dispatch({ type: ActionType.SET_APP_VIEW_SCALE, payload: state.appViewScale === 1 ? 0.75 : 1 })}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${state.appViewScale === 0.75 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span
                                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${state.appViewScale === 0.75 ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                    <div className="p-2">
                         <button onClick={openTrashModal} className="w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Trash2Icon className="w-5 h-5"/>
                            <span>Trash</span>
                        </button>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                    <div className="p-2">
                        <h4 className="px-2 pt-1 pb-2 font-semibold text-sm text-gray-600 dark:text-gray-400">Application Settings</h4>
                        <button
                            onClick={() => { dispatch({ type: ActionType.SAVE_SETTINGS }); setIsMenuOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <CheckIcon className="w-5 h-5"/>
                            <span>Save All Settings</span>
                        </button>
                        <button
                            onClick={() => { dispatch({ type: ActionType.RESET_SETTINGS }); setIsMenuOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                            <RotateCcwIcon className="w-5 h-5"/>
                            <span>Reset to Default</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};
