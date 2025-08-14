import React, { useState, useMemo, useEffect } from 'react';
import { XIcon, BrainCircuitIcon, CoffeeIcon, CouchIcon, PlayIcon, PauseIcon, RotateCcwIcon, SkipForwardIcon, ClockIcon, ClipboardCheckIcon, BarChartIcon, SettingsIcon, PlusIcon, Trash2Icon } from './icons';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType, PomodoroMode } from '../types';

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const ModeButton: React.FC<{ onClick: () => void; isActive?: boolean; children: React.ReactNode; }> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 backdrop-blur-sm
        ${isActive ? 'bg-white text-gray-800 shadow-md' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}
    >
        {children}
    </button>
);

const NavButton: React.FC<{ onClick: () => void; isActive?: boolean; children: React.ReactNode; }> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-colors duration-200 ${isActive ? 'text-white bg-white/20' : 'text-white/60 hover:bg-white/10'}`}
    >
        {children}
    </button>
);

// --- Individual Views ---

const TimerView = () => {
    const { state, dispatch } = useAppContext();
    const { pomodoro } = state;
    const [taskInput, setTaskInput] = useState(pomodoro.currentTaskText);
    const [isConfirmingSkip, setIsConfirmingSkip] = useState(false);

    const radius = 110;
    const circumference = 2 * Math.PI * radius;
    const progress = pomodoro.initialTime > 0 ? ((pomodoro.initialTime - pomodoro.timeRemaining) / pomodoro.initialTime) : 0;
    const offset = circumference - (progress * circumference);

    const skipTimer = () => {
        if (pomodoro.isActive) {
            setIsConfirmingSkip(true);
        } else {
            // If timer is not active, just skip without confirmation
            dispatch({ type: ActionType.SET_NEXT_POMODORO_MODE });
        }
    };
    
    const handleConfirmSkip = () => {
        dispatch({ type: ActionType.SET_NEXT_POMODORO_MODE });
        setIsConfirmingSkip(false);
    };

    const handleCancelSkip = () => {
        setIsConfirmingSkip(false);
    };


    const handleTaskUpdate = () => {
        dispatch({ type: ActionType.SET_POMODORO_CURRENT_TASK, payload: taskInput });
    };
    
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-white">
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                {pomodoro.isActive && <div className="absolute w-72 h-72 border-2 border-white/20 rounded-full animate-pulse" />}
                <svg width="240" height="240" className="transform -rotate-90">
                    <circle cx="120" cy="120" r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth="12" fill="none" />
                    <circle cx="120" cy="120" r={radius} className="stroke-white"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        fill="none" strokeWidth="12" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
                <div className="absolute text-5xl font-bold font-mono tracking-wider">
                    {formatTime(pomodoro.timeRemaining)}
                </div>
            </div>
            
            <input 
                type="text" 
                placeholder="What are you focusing on?"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onBlur={handleTaskUpdate}
                onKeyDown={(e) => {if (e.key === 'Enter') (e.target as HTMLInputElement).blur()}}
                className="w-full max-w-xs text-center bg-transparent border-b-2 border-white/20 py-2 text-lg placeholder-white/50 focus:outline-none focus:border-white/60 transition-colors"
            />
            
            <div className="flex flex-col items-center justify-center mt-8 h-20">
                {isConfirmingSkip ? (
                    <div className="text-center fade-in">
                        <p className="font-semibold mb-3">Skip to the next session?</p>
                        <div className="flex gap-4">
                            <button onClick={handleCancelSkip} className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-semibold transition-colors">Cancel</button>
                            <button onClick={handleConfirmSkip} className="px-6 py-2 bg-white text-primary-800 rounded-full text-sm font-bold shadow-lg transition-colors">Yes, skip</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <button onClick={() => dispatch({type: ActionType.RESET_POMODORO_TIMER})} className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full" title="Reset Timer"><RotateCcwIcon className="w-6 h-6"/></button>
                        <button 
                            onClick={() => dispatch({type: ActionType.TOGGLE_POMODORO_TIMER})}
                            className="w-20 h-20 bg-white text-primary-800 rounded-full flex items-center justify-center text-xl font-bold shadow-lg transform hover:scale-105 transition-transform"
                            title={pomodoro.isActive ? "Pause Timer" : "Start Timer"}
                        >
                            {pomodoro.isActive ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 ml-1"/>}
                        </button>
                        <button onClick={skipTimer} className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full" title="Skip Session"><SkipForwardIcon className="w-6 h-6"/></button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TasksView = () => {
    const { state, dispatch } = useAppContext();
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            dispatch({ type: ActionType.ADD_POMODORO_TASK, payload: { text: newTaskText.trim() } });
            setNewTaskText('');
        }
    };
    
    return (
        <div className="flex-1 flex flex-col p-4 text-white">
            <h3 className="text-xl font-bold mb-4 px-2">Focus Tasks</h3>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                 {state.pomodoroTasks.map(task => (
                     <div key={task.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between group">
                        <div onClick={() => dispatch({ type: ActionType.SET_POMODORO_CURRENT_TASK, payload: task.text })} className="flex items-center space-x-3 flex-1 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={task.isCompleted} 
                                onChange={() => dispatch({ type: ActionType.TOGGLE_POMODORO_TASK, payload: { taskId: task.id } })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 rounded-md text-primary-400 bg-transparent border-white/40 focus:ring-primary-400 focus:ring-offset-0"
                            />
                            <span className={`flex-1 ${task.isCompleted ? 'line-through opacity-60' : ''}`}>{task.text}</span>
                        </div>
                        <button onClick={() => dispatch({ type: ActionType.DELETE_POMODORO_TASK, payload: { taskId: task.id }})} className="text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2Icon className="w-4 h-4" />
                        </button>
                    </div>
                 ))}
            </div>
             <form onSubmit={handleAddTask} className="mt-4">
                <input 
                    type="text" 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add a new task..." 
                    className="w-full bg-white/10 border-2 border-white/20 rounded-lg px-3 py-2 placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
                />
            </form>
        </div>
    );
};

const StatsView = () => {
    const { state } = useAppContext();
    const { pomodoro, pomodoroTasks } = state;
    
    return (
        <div className="flex-1 p-4 space-y-4 text-white">
             <h3 className="text-xl font-bold mb-2 px-2">Today's Progress</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-lg"><p className="text-sm opacity-70">Focus Sessions</p><p className="text-3xl font-bold">{pomodoro.todayPomodoros}</p></div>
                <div className="bg-white/10 p-4 rounded-lg"><p className="text-sm opacity-70">Focus Time</p><p className="text-3xl font-bold">{pomodoro.todayFocusTime}m</p></div>
                <div className="bg-white/10 p-4 rounded-lg col-span-2"><p className="text-sm opacity-70">Tasks Completed</p><p className="text-3xl font-bold">{pomodoroTasks.filter(t => t.isCompleted).length}</p></div>
             </div>
        </div>
    );
};
    
const SettingsView = () => {
    const { state, dispatch } = useAppContext();
    const { pomodoro } = state;
    
    const [settings, setSettings] = useState({
        pomodoroDuration: pomodoro.pomodoroDuration,
        shortBreakDuration: pomodoro.shortBreakDuration,
        longBreakDuration: pomodoro.longBreakDuration,
        autoStartBreaks: pomodoro.autoStartBreaks,
        autoStartPomodoros: pomodoro.autoStartPomodoros,
    });

    const handleSave = () => {
        dispatch({ type: ActionType.UPDATE_POMODORO_SETTINGS, payload: settings });
        alert("Settings saved!");
    };
    
    const SettingInput: React.FC<{label: string, value: number, onChange: (val: number) => void}> = ({label, value, onChange}) => (
        <div className="flex items-center justify-between">
            <label className="text-white/80">{label}</label>
            <input 
                type="number" 
                value={value} 
                onChange={e => onChange(Math.max(1, +e.target.value))} 
                min="1" 
                className="w-20 bg-white/10 border-2 border-white/20 rounded-lg px-3 py-1.5 text-center focus:outline-none focus:border-white/40" 
            />
        </div>
    );

    const SettingToggle: React.FC<{label: string, checked: boolean, onChange: (val: boolean) => void}> = ({label, checked, onChange}) => (
         <label className="flex items-center justify-between cursor-pointer">
            <span className="text-white/80">{label}</span>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-primary-500' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`} />
            </div>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="hidden"/>
        </label>
    );

    return (
         <div className="flex-1 p-4 space-y-6 text-white overflow-y-auto">
            <h3 className="text-xl font-bold px-2">Settings</h3>
            <div className="space-y-4 bg-white/10 p-4 rounded-lg">
                <h4 className="font-semibold text-white/90">Timer Durations (minutes)</h4>
                <SettingInput label="Pomodoro" value={settings.pomodoroDuration} onChange={v => setSettings({...settings, pomodoroDuration: v})} />
                <SettingInput label="Short Break" value={settings.shortBreakDuration} onChange={v => setSettings({...settings, shortBreakDuration: v})} />
                <SettingInput label="Long Break" value={settings.longBreakDuration} onChange={v => setSettings({...settings, longBreakDuration: v})} />
            </div>
            <div className="space-y-4 bg-white/10 p-4 rounded-lg">
                <h4 className="font-semibold text-white/90">Automation</h4>
                <SettingToggle label="Auto Start Breaks" checked={settings.autoStartBreaks} onChange={v => setSettings({...settings, autoStartBreaks: v})} />
                <SettingToggle label="Auto Start Pomodoros" checked={settings.autoStartPomodoros} onChange={v => setSettings({...settings, autoStartPomodoros: v})} />
            </div>
            <button onClick={handleSave} className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold">Save Settings</button>
         </div>
    );
};

// --- Main Component ---

export const PomodoroTimer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state, dispatch } = useAppContext();
    const { pomodoro } = state;
    const [activeView, setActiveView] = useState<'timer' | 'tasks' | 'stats' | 'settings'>('timer');

    const selectMode = (newMode: PomodoroMode) => {
        if (pomodoro.isActive && newMode !== pomodoro.mode && !window.confirm("The timer is running. Are you sure you want to switch? This will reset the current timer.")) return;
        dispatch({ type: ActionType.SET_POMODORO_MODE, payload: newMode });
    };

    const renderView = () => {
        switch (activeView) {
            case 'tasks': return <TasksView />;
            case 'stats': return <StatsView />;
            case 'settings': return <SettingsView />;
            case 'timer': default: return <TimerView />;
        }
    };
    
    return (
        <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-gradient-to-br from-primary-700 via-primary-800 to-black dark:from-gray-900 dark:to-black rounded-2xl shadow-2xl z-20 flex flex-col h-[40rem] max-h-[80vh]">
            <header className="p-3 flex justify-between items-center flex-shrink-0">
                <div className="flex space-x-2">
                    <ModeButton onClick={() => selectMode('pomodoro')} isActive={pomodoro.mode === 'pomodoro'}><BrainCircuitIcon className="w-4 h-4 inline mr-1.5"/>Focus</ModeButton>
                    <ModeButton onClick={() => selectMode('shortBreak')} isActive={pomodoro.mode === 'shortBreak'}><CoffeeIcon className="w-4 h-4 inline mr-1.5"/>Short Break</ModeButton>
                    <ModeButton onClick={() => selectMode('longBreak')} isActive={pomodoro.mode === 'longBreak'}><CouchIcon className="w-4 h-4 inline mr-1.5"/>Long Break</ModeButton>
                </div>
                <button onClick={onClose} className="p-2 rounded-full text-white/70 hover:bg-white/20"><XIcon className="w-5 h-5"/></button>
            </header>
            
            <main className="flex-1 flex flex-col overflow-hidden">
                {renderView()}
            </main>

            <footer className="p-1 border-t border-white/10 flex justify-around items-center flex-shrink-0 bg-black/20 rounded-b-2xl">
                 <NavButton onClick={() => setActiveView('timer')} isActive={activeView === 'timer'}>
                    <ClockIcon className="w-6 h-6"/> <span className="text-xs">Timer</span>
                 </NavButton>
                 <NavButton onClick={() => setActiveView('tasks')} isActive={activeView === 'tasks'}>
                    <ClipboardCheckIcon className="w-6 h-6"/> <span className="text-xs">Tasks</span>
                 </NavButton>
                 <NavButton onClick={() => setActiveView('stats')} isActive={activeView === 'stats'}>
                    <BarChartIcon className="w-6 h-6"/> <span className="text-xs">Stats</span>
                 </NavButton>
                 <NavButton onClick={() => setActiveView('settings')} isActive={activeView === 'settings'}>
                    <SettingsIcon className="w-6 h-6"/> <span className="text-xs">Settings</span>
                 </NavButton>
            </footer>
        </div>
    );
};