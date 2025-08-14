import React, { createContext, useReducer, Dispatch, ReactNode } from 'react';
import { AppState, AppAction, ActionType, Card, List, DailyTodo, TrashedCard, PomodoroMode, Label, Notification, Note, Theme, PrimaryColor, ViewMode, TimelineEvent, Account, Transaction, Loan, LoanPayment, Investment, ProfitEntry, Notebook, MindMapData, TrashedNote, Habit, BoardState, PomodoroTask, BookmarkFolder, PomodoroState, Tag, MindMapText } from '../types';

// Pomodoro Constants & Settings
export const pomodoroModeSettings: { [key in PomodoroMode]: { label: string; color: string; bgColor: string } } = {
    pomodoro: { label: 'Pomodoro', color: 'text-red-500', bgColor: 'bg-red-500' },
    shortBreak: { label: 'Short Break', color: 'text-blue-500', bgColor: 'bg-blue-500' },
    longBreak: { label: 'Long Break', color: 'text-green-500', bgColor: 'bg-green-500' },
};

const createDefaultBoard = (): BoardState => {
    const initialLabels = {
      'label-1': { id: 'label-1', text: 'Feature', color: 'bg-blue-500' },
      'label-2': { id: 'label-2', text: 'Bug', color: 'bg-red-500' },
      'label-3': { id: 'label-3', text: 'Design', color: 'bg-purple-500' },
    };
    const initialCards: { [key: string]: Card } = {
      'card-1': { id: 'card-1', title: 'Setup project structure', description: 'Initialize React, TypeScript, and Tailwind.', labelIds: ['label-1'], checklists: [], comments: [], attachments: [] },
      'card-2': { id: 'card-2', title: 'Develop Kanban UI', description: 'Create Board, List, and Card components.', labelIds: ['label-1', 'label-3'], checklists: [], comments: [], attachments: [], dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
      'card-3': { id: 'card-3', title: 'Implement Drag and Drop', description: '', labelIds: [], checklists: [], comments: [], attachments: [] },
    };
    const initialLists: { [key: string]: List } = {
      'list-1': { id: 'list-1', title: 'To Do', cardIds: ['card-1', 'card-2', 'card-3'], isCollapsed: false },
      'list-2': { id: 'list-2', title: 'In Progress', cardIds: [], isCollapsed: false },
      'list-3': { id: 'list-3', title: 'Done', cardIds: [], isCollapsed: false },
    };
    return {
        id: 'board-1',
        title: 'Project Alpha',
        lists: initialLists,
        cards: initialCards,
        labels: initialLabels,
        listOrder: ['list-1', 'list-2', 'list-3'],
        trashedCards: {},
    };
};


const toYMD = (date: Date) => date.toISOString().split('T')[0];
const getTodayAt = (hour: number, minute: number) => new Date(new Date().setHours(hour, minute, 0, 0)).toISOString();
const todayYMD = toYMD(new Date());

const initialTodos: DailyTodo[] = [
    { id: 'todo-1', text: 'Daily Stand-up Meeting', isCompleted: false, date: todayYMD, startTime: getTodayAt(9, 0), endTime: getTodayAt(9, 30), isRecurring: true, completedOn: {} },
    { id: 'todo-2', text: 'Follow up with the design team', isCompleted: true, date: todayYMD, startTime: getTodayAt(10, 0), endTime: getTodayAt(11, 0), isRecurring: false },
    { id: 'todo-3', text: 'Prepare for the weekly sync', isCompleted: false, date: todayYMD, startTime: getTodayAt(14, 0), endTime: getTodayAt(15, 30), isRecurring: false },
    { id: 'todo-4', text: 'Review PRs', isCompleted: false, date: todayYMD, isRecurring: false },
];

const now = new Date().toISOString();
const defaultNotebookId1 = 'notebook-1';
const defaultNotebookId2 = 'notebook-2';
const defaultNotebooks: { [key: string]: Notebook } = {
    [defaultNotebookId1]: { id: defaultNotebookId1, name: 'First Notebook', createdAt: now },
    [defaultNotebookId2]: { id: defaultNotebookId2, name: 'Work', createdAt: now },
};
const defaultTags: { [id: string]: Tag } = {
    'tag-1': { id: 'tag-1', name: 'welcome', color: 'bg-blue-500' },
    'tag-2': { id: 'tag-2', name: 'getting-started', color: 'bg-green-500' },
    'tag-3': { id: 'tag-3', name: 'reference', color: 'bg-yellow-500' },
    'tag-4': { id: 'tag-4', name: 'markdown', color: 'bg-gray-500' },
    'tag-5': { id: 'tag-5', name: 'work', color: 'bg-red-500' },
    'tag-6': { id: 'tag-6', name: 'meeting', color: 'bg-purple-500' },
    'tag-7': { id: 'tag-7', name: 'q2', color: 'bg-indigo-500' },
};
const defaultNotes: { [key: string]: Note } = {
    'note-1': { id: 'note-1', notebookId: defaultNotebookId1, title: 'Welcome to your new notes!', content: '# Welcome to Zenith Notes!\n\nThis is your first note. You can edit this text, use markdown for formatting, and create new notes and notebooks to organize your thoughts.\n\n- Create lists\n- Use **bold** or *italic* text\n- Add headings and more!\n- [ ] This is a sample to-do item.\n\n```javascript\nfunction greet() {\n  console.log("Hello, World!");\n}\n```', tagIds: ['tag-1', 'tag-2'], createdAt: now, updatedAt: now, pinned: true },
    'note-2': { id: 'note-2', notebookId: defaultNotebookId1, title: 'Markdown Cheatsheet', content: '## Basic Formatting\n\n- **Bold Text**: `**Bold Text**`\n- *Italic Text*: `*Italic Text*`\n- # H1, ## H2, ### H3\n- `[Link Text](https://example.com)`\n\n## Table Example\n\n| Feature    | Support |\n|------------|---------|\n| Tables     |   ✅    |\n| Code Blocks|   ✅    |', tagIds: ['tag-3', 'tag-4'], createdAt: now, updatedAt: now, pinned: false },
    'note-3': { id: 'note-3', notebookId: defaultNotebookId2, title: 'Q2 Meeting Prep', content: '# Q2 Strategy Meeting\n\n## Agenda\n\n- [x] Review Q1 sales data\n- [ ] Prepare presentation slides\n- [ ] Finalize marketing budget', tagIds: ['tag-5', 'tag-6', 'tag-7'], createdAt: now, updatedAt: now, pinned: false },
};
const defaultHabits: Habit[] = [
    { id: 'habit-1', name: 'Read 10 pages', icon: 'BookOpenIcon', color: 'text-blue-500', goal: 5, goalUnit: 'week', completions: [], isArchived: false, createdAt: now, notes: {} },
    { id: 'habit-2', name: 'Workout 30 mins', icon: 'DumbbellIcon', color: 'text-rose-500', goal: 3, goalUnit: 'week', completions: [], isArchived: false, createdAt: now, notes: {} },
    { id: 'habit-3', name: 'Drink 8 glasses of water', icon: 'WaterBottleIcon', color: 'text-cyan-500', goal: 7, goalUnit: 'week', completions: [], isArchived: false, createdAt: now, notes: {} },
];

const createDefaultMindMap = (): MindMapData => {
    const defaultTextId = 'item-1';
    const defaultTextItem: MindMapText = {
        id: defaultTextId,
        type: 'text',
        x: 100,
        y: 100,
        width: 250,
        height: 100,
        text: 'Welcome to your whiteboard! \nDouble-click to edit.',
        style: {
            fontSize: 16,
            fontFamily: 'sans-serif',
            color: '#1f2937',
            background: '#a5d8ff',
            bold: false,
            italic: false,
            align: 'center',
        }
    };
    const initialItems = { [defaultTextId]: defaultTextItem };
    const initialDisplayOrder = [defaultTextId];
    return {
        id: 'mindmap-1',
        name: 'My Whiteboard',
        items: initialItems,
        displayOrder: initialDisplayOrder,
        history: [{ items: initialItems, displayOrder: initialDisplayOrder }],
        historyIndex: 0,
        updatedAt: new Date().toISOString()
    };
}

const getInitialState = (): AppState => {
    const defaultBoard = createDefaultBoard();
    const defaultMindMap = createDefaultMindMap();

    const defaultState: AppState = {
        isAuthenticated: false,
        password: '0',
        boards: { [defaultBoard.id]: defaultBoard },
        activeBoardId: defaultBoard.id,
        dailyTodos: initialTodos,
        pomodoro: {
            mode: 'pomodoro',
            timeRemaining: 25 * 60,
            initialTime: 25 * 60,
            isActive: false,
            isPopoverOpen: false,
            currentTaskText: '',
            pomodorosCompleted: 0,
            todayPomodoros: 0,
            todayFocusTime: 0,
            pomodoroDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            enableSound: true,
            enableNotifications: false,
            compactView: false,
        },
        pomodoroTasks: [],
        activePomodoroTaskId: null,
        isTrashOpen: false,
        theme: 'light',
        primaryColor: 'blue',
        isAutoColorChangeEnabled: false,
        autoColorChangeInterval: 60,
        timeTrackerWidth: 12, // in rem, default w-48
        appViewScale: 1,
        activeCardId: null,
        dragging: { cardId: null, listId: null },
        isVerseSelectorOpen: false,
        selectedVerse: null,
        currentVerseIndex: 0,
        notifications: [],
        isNotificationsOpen: false,
        salatLocation: { city: 'Raozan', country: 'Bangladesh' },
        salatTimes: {},
        notebooks: defaultNotebooks,
        notes: defaultNotes,
        tags: defaultTags,
        trashedNotes: {},
        notebookOrder: [defaultNotebookId1, defaultNotebookId2],
        noteToView: null,
        viewMode: 'dashboard',
        timelineEvents: [],
        accounts: [],
        transactions: [],
        loans: [],
        investments: [],
        quranProgress: {},
        mindMaps: { [defaultMindMap.id]: defaultMindMap },
        activeMindMapId: defaultMindMap.id,
        habits: defaultHabits,
        archivedHabits: [],
        isHabitDetailOpen: false,
        activeHabitId: null,
        bookmarkFolders: [],
    };
    
    // Load preferences
    try {
        const storedPassword = localStorage.getItem('appPassword');
        if (storedPassword) defaultState.password = storedPassword;
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme && ['light', 'dark', 'khata', 'gradient'].includes(storedTheme)) defaultState.theme = storedTheme as Theme;
        const storedPrimaryColor = localStorage.getItem('primaryColor');
        if (storedPrimaryColor && ['blue', 'green', 'rose', 'orange', 'violet', 'slate', 'cyan', 'pink', 'emerald', 'sky', 'amber', 'lime'].includes(storedPrimaryColor)) defaultState.primaryColor = storedPrimaryColor as PrimaryColor;
        const storedWidth = localStorage.getItem('timeTrackerWidth');
        if (storedWidth) defaultState.timeTrackerWidth = JSON.parse(storedWidth);
        const storedBoardScale = localStorage.getItem('appViewScale');
        if (storedBoardScale) defaultState.appViewScale = JSON.parse(storedBoardScale);
        const storedTodos = localStorage.getItem('dailyTodos');
        if(storedTodos) defaultState.dailyTodos = JSON.parse(storedTodos);
        const storedSalatLocation = localStorage.getItem('salatLocation');
        if (storedSalatLocation) defaultState.salatLocation = JSON.parse(storedSalatLocation);
        const storedAutoColor = localStorage.getItem('isAutoColorChangeEnabled');
        if (storedAutoColor) defaultState.isAutoColorChangeEnabled = JSON.parse(storedAutoColor);
        const storedAutoColorInterval = localStorage.getItem('autoColorChangeInterval');
        if (storedAutoColorInterval) defaultState.autoColorChangeInterval = JSON.parse(storedAutoColorInterval);

    } catch (e) { console.error('Could not load preferences', e); }

    // Load Board Data
    try {
        const storedBoards = localStorage.getItem('boards');
        if (storedBoards) defaultState.boards = JSON.parse(storedBoards);
        const storedActiveBoardId = localStorage.getItem('activeBoardId');
        if (storedActiveBoardId && defaultState.boards[storedActiveBoardId]) {
            defaultState.activeBoardId = storedActiveBoardId;
        } else if (Object.keys(defaultState.boards).length > 0) {
            defaultState.activeBoardId = Object.keys(defaultState.boards)[0];
        } else {
            const newBoard = createDefaultBoard();
            defaultState.boards = { [newBoard.id]: newBoard };
            defaultState.activeBoardId = newBoard.id;
        }
    } catch (e) { console.error("Could not parse boards from localStorage", e); }
    
    // Load other data...
    try {
        const storedPomodoro = localStorage.getItem('pomodoro');
        if (storedPomodoro) {
             const savedPomodoro = JSON.parse(storedPomodoro);
             const pomodoroDuration = savedPomodoro.pomodoroDuration || 25;
             const shortBreakDuration = savedPomodoro.shortBreakDuration || 5;
             const longBreakDuration = savedPomodoro.longBreakDuration || 15;
             const mode = savedPomodoro.mode || 'pomodoro';
             
             let initialTime;
             if (mode === 'pomodoro') initialTime = pomodoroDuration * 60;
             else if (mode === 'shortBreak') initialTime = shortBreakDuration * 60;
             else initialTime = longBreakDuration * 60;

             defaultState.pomodoro = {
                 ...defaultState.pomodoro,
                 ...savedPomodoro,
                 mode,
                 timeRemaining: initialTime,
                 initialTime: initialTime,
             };
        }
        const storedPomoTasks = localStorage.getItem('pomodoroTasks');
        if(storedPomoTasks) defaultState.pomodoroTasks = JSON.parse(storedPomoTasks);
        const storedActivePomoId = localStorage.getItem('activePomodoroTaskId');
        if(storedActivePomoId) defaultState.activePomodoroTaskId = JSON.parse(storedActivePomoId);

        const storedVerse = localStorage.getItem('selectedVerse');
        if (storedVerse) defaultState.selectedVerse = JSON.parse(storedVerse);
        const storedNotifications = localStorage.getItem('notifications');
        if (storedNotifications) defaultState.notifications = JSON.parse(storedNotifications);
        const storedNotebooks = localStorage.getItem('notebooks');
        if (storedNotebooks) defaultState.notebooks = JSON.parse(storedNotebooks);
        const storedNotebookOrder = localStorage.getItem('notebookOrder');
        if (storedNotebookOrder) defaultState.notebookOrder = JSON.parse(storedNotebookOrder);
        const storedNotes = localStorage.getItem('notes');
        if (storedNotes) defaultState.notes = JSON.parse(storedNotes);
        const storedTags = localStorage.getItem('tags');
        if (storedTags) defaultState.tags = JSON.parse(storedTags);
        const storedTrashedNotes = localStorage.getItem('trashedNotes');
        if (storedTrashedNotes) defaultState.trashedNotes = JSON.parse(storedTrashedNotes);
        const storedTimelineEvents = localStorage.getItem('timelineEvents');
        if (storedTimelineEvents) defaultState.timelineEvents = JSON.parse(storedTimelineEvents);
        const storedAccounts = localStorage.getItem('accounts');
        if (storedAccounts) defaultState.accounts = JSON.parse(storedAccounts);
        const storedTransactions = localStorage.getItem('transactions');
        if (storedTransactions) defaultState.transactions = JSON.parse(storedTransactions);
        const storedLoans = localStorage.getItem('loans');
        if (storedLoans) defaultState.loans = JSON.parse(storedLoans);
        const storedInvestments = localStorage.getItem('investments');
        if (storedInvestments) defaultState.investments = JSON.parse(storedInvestments);
        const storedQuranProgress = localStorage.getItem('quranProgress');
        if (storedQuranProgress) defaultState.quranProgress = JSON.parse(storedQuranProgress);
        const storedMindMaps = localStorage.getItem('mindMaps');
        if (storedMindMaps) defaultState.mindMaps = JSON.parse(storedMindMaps);
        if (Object.keys(defaultState.mindMaps).length > 0) defaultState.activeMindMapId = Object.keys(defaultState.mindMaps)[0];
        const storedHabits = localStorage.getItem('habits');
        if (storedHabits) defaultState.habits = JSON.parse(storedHabits);
        const storedArchivedHabits = localStorage.getItem('archivedHabits');
        if (storedArchivedHabits) defaultState.archivedHabits = JSON.parse(storedArchivedHabits);
        const storedBookmarks = localStorage.getItem('bookmarkFolders');
        if (storedBookmarks) defaultState.bookmarkFolders = JSON.parse(storedBookmarks);
    } catch (e) { console.error("Could not parse data from localStorage", e); }

    return defaultState;
};

const initialState = getInitialState();

const saveAllSettings = (state: AppState) => {
    try {
        localStorage.setItem('appPassword', state.password);
        localStorage.setItem('theme', state.theme);
        localStorage.setItem('primaryColor', state.primaryColor);
        localStorage.setItem('isAutoColorChangeEnabled', JSON.stringify(state.isAutoColorChangeEnabled));
        localStorage.setItem('autoColorChangeInterval', JSON.stringify(state.autoColorChangeInterval));
        localStorage.setItem('timeTrackerWidth', JSON.stringify(state.timeTrackerWidth));
        localStorage.setItem('appViewScale', JSON.stringify(state.appViewScale));
        localStorage.setItem('dailyTodos', JSON.stringify(state.dailyTodos));
        localStorage.setItem('boards', JSON.stringify(state.boards));
        localStorage.setItem('activeBoardId', state.activeBoardId);
        localStorage.setItem('pomodoro', JSON.stringify(state.pomodoro));
        localStorage.setItem('pomodoroTasks', JSON.stringify(state.pomodoroTasks));
        localStorage.setItem('activePomodoroTaskId', JSON.stringify(state.activePomodoroTaskId));
        if (state.selectedVerse) {
            localStorage.setItem('selectedVerse', JSON.stringify(state.selectedVerse));
        } else {
            localStorage.removeItem('selectedVerse');
        }
        localStorage.setItem('notifications', JSON.stringify(state.notifications));
        localStorage.setItem('salatLocation', JSON.stringify(state.salatLocation));
        localStorage.setItem('notebooks', JSON.stringify(state.notebooks));
        localStorage.setItem('notebookOrder', JSON.stringify(state.notebookOrder));
        localStorage.setItem('notes', JSON.stringify(state.notes));
        localStorage.setItem('tags', JSON.stringify(state.tags));
        localStorage.setItem('trashedNotes', JSON.stringify(state.trashedNotes));
        localStorage.setItem('timelineEvents', JSON.stringify(state.timelineEvents));
        localStorage.setItem('accounts', JSON.stringify(state.accounts));
        localStorage.setItem('transactions', JSON.stringify(state.transactions));
        localStorage.setItem('loans', JSON.stringify(state.loans));
        localStorage.setItem('investments', JSON.stringify(state.investments));
        localStorage.setItem('quranProgress', JSON.stringify(state.quranProgress));
        localStorage.setItem('mindMaps', JSON.stringify(state.mindMaps));
        localStorage.setItem('habits', JSON.stringify(state.habits));
        localStorage.setItem('archivedHabits', JSON.stringify(state.archivedHabits));
        localStorage.setItem('bookmarkFolders', JSON.stringify(state.bookmarkFolders));
        console.log('All settings saved to localStorage.');
    } catch (e) {
        console.error('Failed to save all settings to localStorage', e);
        alert('There was an error saving your settings.');
    }
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case ActionType.AUTHENTICATE:
      return { ...state, isAuthenticated: true };
    case ActionType.SET_PASSWORD:
      localStorage.setItem('appPassword', action.payload);
      return { ...state, password: action.payload };
    case ActionType.SET_THEME:
      localStorage.setItem('theme', action.payload);
      return { ...state, theme: action.payload };
    case ActionType.SET_PRIMARY_COLOR:
      localStorage.setItem('primaryColor', action.payload);
      return { ...state, primaryColor: action.payload };
    case ActionType.SET_TIME_TRACKER_WIDTH:
        localStorage.setItem('timeTrackerWidth', JSON.stringify(action.payload));
        return { ...state, timeTrackerWidth: action.payload };
    case ActionType.SET_APP_VIEW_SCALE:
        localStorage.setItem('appViewScale', JSON.stringify(action.payload));
        return { ...state, appViewScale: action.payload };
    case ActionType.SET_VIEW_MODE:
        return { ...state, viewMode: action.payload };
    case ActionType.OPEN_CARD_MODAL:
      return { ...state, activeCardId: action.payload };
    case ActionType.CLOSE_CARD_MODAL:
      return { ...state, activeCardId: null };
    case ActionType.SET_DRAGGING_CARD:
      return { ...state, dragging: { cardId: action.payload.cardId, listId: action.payload.listId } };
    case ActionType.SET_DRAGGING_LIST:
      return { ...state, dragging: { cardId: null, listId: action.payload.listId } };
    case ActionType.CLEAR_DRAGGING:
      return { ...state, dragging: { cardId: null, listId: null } };
      
    // --- BOARD SPECIFIC ACTIONS (Operating on Active Board) ---
    case ActionType.ADD_BOARD: {
        const newId = `board-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const newBoard: BoardState = {
            id: newId,
            title: action.payload.title,
            lists: {},
            cards: {},
            labels: {},
            listOrder: [],
            trashedCards: {},
        };
        const newBoards = { ...state.boards, [newId]: newBoard };
        localStorage.setItem('boards', JSON.stringify(newBoards));
        localStorage.setItem('activeBoardId', newId);
        return { ...state, boards: newBoards, activeBoardId: newId };
    }
    case ActionType.SWITCH_BOARD: {
        if (!state.boards[action.payload.boardId]) return state;
        localStorage.setItem('activeBoardId', action.payload.boardId);
        return { ...state, activeBoardId: action.payload.boardId };
    }
    case ActionType.DELETE_BOARD: {
        const { boardId } = action.payload;
        if (Object.keys(state.boards).length <= 1) {
            alert("You cannot delete the last board.");
            return state;
        }
        const { [boardId]: _, ...remainingBoards } = state.boards;
        let newActiveBoardId = state.activeBoardId;
        if (state.activeBoardId === boardId) {
            newActiveBoardId = Object.keys(remainingBoards)[0];
        }
        localStorage.setItem('boards', JSON.stringify(remainingBoards));
        localStorage.setItem('activeBoardId', newActiveBoardId);
        return { ...state, boards: remainingBoards, activeBoardId: newActiveBoardId };
    }

    // --- Refactored Board Actions ---
    case ActionType.UPDATE_CARD:
    case ActionType.MOVE_CARD:
    case ActionType.MOVE_LIST:
    case ActionType.ADD_CARD:
    case ActionType.DELETE_CARD:
    case ActionType.RESTORE_CARD:
    case ActionType.PERMANENTLY_DELETE_CARD:
    case ActionType.EMPTY_TRASH:
    case ActionType.PURGE_OLD_TRASHED_CARDS:
    case ActionType.ADD_LIST:
    case ActionType.UPDATE_BOARD_TITLE:
    case ActionType.UPDATE_LIST_TITLE:
    case ActionType.TOGGLE_LIST_COLLAPSED:
    case ActionType.ADD_LABEL:
    case ActionType.UPDATE_LABEL:
    case ActionType.DELETE_LABEL: {
        const { activeBoardId, boards } = state;
        if (!activeBoardId || !boards[activeBoardId]) return state;

        const activeBoard = boards[activeBoardId];
        let newBoard = { ...activeBoard };
        let newNotifications = [...state.notifications];

        switch(action.type) {
            case ActionType.UPDATE_CARD: {
              const { cardId, updates } = action.payload;
              newBoard.cards = { ...newBoard.cards, [cardId]: { ...newBoard.cards[cardId], ...updates } };
              break;
            }
            case ActionType.MOVE_CARD: {
                const { cardId, sourceListId, destListId, destIndex } = action.payload;
                
                const card = newBoard.cards[cardId];
                const sourceListInfo = newBoard.lists[sourceListId];
                const destListInfo = newBoard.lists[destListId];
                if (!card || !sourceListInfo || !destListInfo) break;

                // Create notification BEFORE state change
                if (sourceListId !== destListId) {
                    const message = `Card "${card.title}" was moved from "${sourceListInfo.title}" to "${destListInfo.title}".`;
                    newNotifications.unshift({
                        id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        type: 'boardActivity', message, relatedId: cardId, listId: destListId,
                        createdAt: new Date().toISOString(), isRead: false
                    });
                }
                
                // Immutable update
                if (sourceListId === destListId) {
                    const list = newBoard.lists[sourceListId];
                    const newCardIds = [...list.cardIds];
                    const cardIndex = newCardIds.indexOf(cardId);
                    if (cardIndex > -1) {
                        const [removed] = newCardIds.splice(cardIndex, 1);
                        newCardIds.splice(destIndex, 0, removed);
                        newBoard.lists = { ...newBoard.lists, [sourceListId]: { ...list, cardIds: newCardIds } };
                    }
                } else {
                    const sourceList = newBoard.lists[sourceListId];
                    const newSourceCardIds = sourceList.cardIds.filter(id => id !== cardId);
                    newBoard.lists = { ...newBoard.lists, [sourceListId]: { ...sourceList, cardIds: newSourceCardIds } };
                    
                    const destList = newBoard.lists[destListId];
                    const newDestCardIds = [...destList.cardIds];
                    newDestCardIds.splice(destIndex, 0, cardId);
                    newBoard.lists = { ...newBoard.lists, [destListId]: { ...destList, cardIds: newDestCardIds } };
                }
                break;
            }
            case ActionType.MOVE_LIST: {
                const { listId, destIndex } = action.payload;
                const sourceIndex = newBoard.listOrder.indexOf(listId);
                if (sourceIndex === -1) break;
                const newListOrder = [...newBoard.listOrder];
                const [removed] = newListOrder.splice(sourceIndex, 1);
                newListOrder.splice(destIndex, 0, removed);
                newBoard.listOrder = newListOrder;
                break;
            }
            case ActionType.ADD_CARD: {
                const { listId, card } = action.payload;
                newBoard.cards = { ...newBoard.cards, [card.id]: card };
                const list = newBoard.lists[listId];
                newBoard.lists = { ...newBoard.lists, [listId]: { ...list, cardIds: [...list.cardIds, card.id] } };
                break;
            }
            case ActionType.DELETE_CARD: {
                const { cardId, listId } = action.payload;
                const cardToDelete = newBoard.cards[cardId];
                if (!cardToDelete || !newBoard.lists[listId]) break;
                const sourceList = { ...newBoard.lists[listId] };
                sourceList.cardIds = sourceList.cardIds.filter(id => id !== cardId);
                newBoard.lists[listId] = sourceList;
                const { [cardId]: _, ...remainingCards } = newBoard.cards;
                newBoard.cards = remainingCards;
                const trashedCard: TrashedCard = { ...cardToDelete, deletedAt: new Date().toISOString(), originalListId: listId };
                newBoard.trashedCards = { ...newBoard.trashedCards, [cardId]: trashedCard };
                break;
            }
            case ActionType.RESTORE_CARD: {
                const { cardId } = action.payload;
                const trashedCard = newBoard.trashedCards[cardId];
                if (!trashedCard) break;
                const { deletedAt, originalListId, ...originalCard } = trashedCard;
                const { [cardId]: _, ...remainingTrashed } = newBoard.trashedCards;
                newBoard.trashedCards = remainingTrashed;
                newBoard.cards = { ...newBoard.cards, [cardId]: originalCard };
                if (newBoard.lists[originalListId]) {
                    const destList = { ...newBoard.lists[originalListId] };
                    destList.cardIds.push(cardId);
                    newBoard.lists[originalListId] = destList;
                } else {
                    const firstListId = newBoard.listOrder[0];
                    if (firstListId) {
                        const destList = { ...newBoard.lists[firstListId] };
                        destList.cardIds.push(cardId);
                        newBoard.lists[firstListId] = destList;
                        // Add notification for clarity
                        const message = `Card "${originalCard.title}" restored to "${destList.title}" because its original list was deleted.`;
                        newNotifications.unshift({
                            id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                            type: 'boardActivity', message, relatedId: cardId, listId: firstListId,
                            createdAt: new Date().toISOString(), isRead: false
                        });
                    }
                }
                break;
            }
            case ActionType.PERMANENTLY_DELETE_CARD: {
                const { cardId } = action.payload;
                const { [cardId]: _, ...remainingTrashed } = newBoard.trashedCards;
                newBoard.trashedCards = remainingTrashed;
                break;
            }
            case ActionType.EMPTY_TRASH: {
                newBoard.trashedCards = {};
                const newState = { 
                    ...state, 
                    boards: { ...state.boards, [activeBoardId]: newBoard },
                    trashedNotes: {},
                    archivedHabits: [],
                };
                localStorage.setItem('boards', JSON.stringify(newState.boards));
                localStorage.setItem('trashedNotes', JSON.stringify(newState.trashedNotes));
                localStorage.setItem('archivedHabits', JSON.stringify(newState.archivedHabits));
                return newState;
            }
            case ActionType.PURGE_OLD_TRASHED_CARDS: {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const remainingTrashed: { [key: string]: TrashedCard } = {};
                for (const cardId in newBoard.trashedCards) {
                    const trashedCard = newBoard.trashedCards[cardId];
                    if (new Date(trashedCard.deletedAt) > thirtyDaysAgo) {
                        remainingTrashed[cardId] = trashedCard;
                    }
                }
                newBoard.trashedCards = remainingTrashed;
                break;
            }
            case ActionType.ADD_LIST: {
                const { list } = action.payload;
                newBoard.lists = { ...newBoard.lists, [list.id]: list };
                newBoard.listOrder = [...newBoard.listOrder, list.id];
                break;
            }
            case ActionType.UPDATE_BOARD_TITLE: {
                newBoard.title = action.payload;
                break;
            }
            case ActionType.UPDATE_LIST_TITLE: {
                const { listId, newTitle } = action.payload;
                const list = newBoard.lists[listId];
                newBoard.lists = { ...newBoard.lists, [listId]: { ...list, title: newTitle } };
                break;
            }
            case ActionType.TOGGLE_LIST_COLLAPSED: {
                const { listId } = action.payload;
                const list = newBoard.lists[listId];
                newBoard.lists = { ...newBoard.lists, [listId]: { ...list, isCollapsed: !list.isCollapsed } };
                break;
            }
            case ActionType.ADD_LABEL: {
              const { text, color } = action.payload;
              const newLabelId = `label-${Date.now()}-${Math.random().toString(16).slice(2)}`;
              newBoard.labels = { ...newBoard.labels, [newLabelId]: { id: newLabelId, text, color } };
              break;
            }
            case ActionType.UPDATE_LABEL: {
              const { labelId, updates } = action.payload;
              newBoard.labels = { ...newBoard.labels, [labelId]: { ...newBoard.labels[labelId], ...updates } };
              break;
            }
            case ActionType.DELETE_LABEL: {
              const { labelId } = action.payload;
              const { [labelId]: _, ...remainingLabels } = newBoard.labels;
              newBoard.labels = remainingLabels;
              const updatedCards = { ...newBoard.cards };
              Object.keys(updatedCards).forEach(cardId => {
                const card = updatedCards[cardId];
                const newLabelIds = card.labelIds.filter(id => id !== labelId);
                if (newLabelIds.length !== card.labelIds.length) {
                  updatedCards[cardId] = { ...card, labelIds: newLabelIds };
                }
              });
              newBoard.cards = updatedCards;
              break;
            }
        }

        const newBoards = { ...boards, [activeBoardId]: newBoard };
        localStorage.setItem('boards', JSON.stringify(newBoards));
        localStorage.setItem('notifications', JSON.stringify(newNotifications));
        
        // Close card modal if a card was deleted to avoid errors
        if (action.type === ActionType.DELETE_CARD && state.activeCardId?.cardId === action.payload.cardId) {
             return { ...state, boards: newBoards, notifications: newNotifications, activeCardId: null };
        }

        return { ...state, boards: newBoards, notifications: newNotifications };
    }
    
    // Trash Modal
    case ActionType.OPEN_TRASH_MODAL:
        return { ...state, isTrashOpen: true };
    case ActionType.CLOSE_TRASH_MODAL:
        return { ...state, isTrashOpen: false };

    // Daily To-Do Reducers
    case ActionType.ADD_TODO: {
        const newTodo: DailyTodo = {
            id: `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...action.payload,
            isCompleted: false,
            completedOn: action.payload.isRecurring ? {} : undefined,
        };
        const newTodos = [...state.dailyTodos, newTodo];
        localStorage.setItem('dailyTodos', JSON.stringify(newTodos));
        return { ...state, dailyTodos: newTodos };
    }
    case ActionType.UPDATE_TODO: {
        const newTodos = state.dailyTodos.map(todo =>
            todo.id === action.payload.todoId ? { ...todo, ...action.payload.updates } : todo
        );
        localStorage.setItem('dailyTodos', JSON.stringify(newTodos));
        return { ...state, dailyTodos: newTodos };
    }
    case ActionType.TOGGLE_TODO: {
        const { todoId, date } = action.payload;
        const newTodos = state.dailyTodos.map(todo => {
            if (todo.id !== todoId) return todo;
            if (todo.isRecurring) {
                const newCompletedOn = { ...(todo.completedOn || {}) };
                newCompletedOn[date] = !newCompletedOn[date];
                return { ...todo, completedOn: newCompletedOn };
            } else {
                return { ...todo, isCompleted: !todo.isCompleted };
            }
        });
        localStorage.setItem('dailyTodos', JSON.stringify(newTodos));
        return { ...state, dailyTodos: newTodos };
    }
    case ActionType.DELETE_TODO: {
        const newTodos = state.dailyTodos.filter(todo => todo.id !== action.payload);
        localStorage.setItem('dailyTodos', JSON.stringify(newTodos));
        return { ...state, dailyTodos: newTodos };
    }
    case ActionType.REORDER_TODOS: {
        const { date, orderedIds } = action.payload;
        const todosForDate = state.dailyTodos
            .filter(t => t.isRecurring || t.date === date)
            .sort((a,b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));

        const otherTodos = state.dailyTodos.filter(t => !t.isRecurring && t.date !== date);
        const recurringTodosNotInList = state.dailyTodos.filter(t => t.isRecurring && !orderedIds.includes(t.id));
        
        const newDailyTodos = [...otherTodos, ...recurringTodosNotInList, ...todosForDate];
        localStorage.setItem('dailyTodos', JSON.stringify(newDailyTodos));
        return { ...state, dailyTodos: newDailyTodos };
    }
    case ActionType.CLEAR_COMPLETED_TODOS: {
        const { date } = action.payload;
        const newTodos = state.dailyTodos.filter(todo => {
            const isCompletedToday = todo.isRecurring ? !!todo.completedOn?.[date] : todo.isCompleted;
            // Keep if recurring, or if not completed on the specified date
            return todo.isRecurring || (todo.date !== date) || !isCompletedToday;
        });
        localStorage.setItem('dailyTodos', JSON.stringify(newTodos));
        return { ...state, dailyTodos: newTodos };
    }
    
    // Pomodoro Actions
    case ActionType.TOGGLE_POMODORO_TIMER: {
      const newState = { ...state };
      newState.pomodoro = { ...state.pomodoro, isActive: !state.pomodoro.isActive };
      localStorage.setItem('pomodoro', JSON.stringify(newState.pomodoro));
      return newState;
    }
    case ActionType.RESET_POMODORO_TIMER: {
        const { pomodoroDuration, shortBreakDuration, longBreakDuration, mode } = state.pomodoro;
        let time;
        if (mode === 'pomodoro') time = pomodoroDuration * 60;
        else if (mode === 'shortBreak') time = shortBreakDuration * 60;
        else time = longBreakDuration * 60;

      const newPomodoro = { 
          ...state.pomodoro, 
          isActive: false,
          timeRemaining: time,
          initialTime: time,
      };
      localStorage.setItem('pomodoro', JSON.stringify(newPomodoro));
      return { ...state, pomodoro: newPomodoro };
    }
    case ActionType.SET_POMODORO_MODE: {
        const newMode = action.payload;
        const { pomodoroDuration, shortBreakDuration, longBreakDuration } = state.pomodoro;
        let newTime;
        if (newMode === 'pomodoro') newTime = pomodoroDuration * 60;
        else if (newMode === 'shortBreak') newTime = shortBreakDuration * 60;
        else newTime = longBreakDuration * 60;

        const newPomodoro = {
            ...state.pomodoro,
            mode: newMode,
            timeRemaining: newTime,
            initialTime: newTime,
            isActive: false,
        };
        localStorage.setItem('pomodoro', JSON.stringify(newPomodoro));
        return { ...state, pomodoro: newPomodoro };
    }
    case ActionType.SET_NEXT_POMODORO_MODE: {
        const { mode, pomodorosCompleted, autoStartBreaks, autoStartPomodoros, pomodoroDuration, shortBreakDuration, longBreakDuration } = state.pomodoro;
        let newMode: PomodoroMode = 'pomodoro';
        let newCompleted = pomodorosCompleted;
        let newTodayPomodoros = state.pomodoro.todayPomodoros;
        let newTodayFocusTime = state.pomodoro.todayFocusTime;

        let shouldAutoStart = false;

        if (mode === 'pomodoro') {
            newCompleted++;
            newTodayPomodoros++;
            newTodayFocusTime += pomodoroDuration;

            if (state.activePomodoroTaskId) {
                const activeTask = state.pomodoroTasks.find(t => t.id === state.activePomodoroTaskId);
                if (activeTask && !activeTask.isCompleted) {
                     // In a simplified model, we just mark the active task as completed
                     // A more complex model could increment a counter on the task
                }
            }
            newMode = newCompleted % 4 === 0 ? 'longBreak' : 'shortBreak';
            shouldAutoStart = autoStartBreaks;
        } else {
            newMode = 'pomodoro';
            shouldAutoStart = autoStartPomodoros;
        }
        
        let newTime;
        if (newMode === 'pomodoro') newTime = pomodoroDuration * 60;
        else if (newMode === 'shortBreak') newTime = shortBreakDuration * 60;
        else newTime = longBreakDuration * 60;

        const newPomodoro = {
            ...state.pomodoro,
            mode: newMode,
            timeRemaining: newTime,
            initialTime: newTime,
            isActive: shouldAutoStart,
            pomodorosCompleted: newCompleted,
            todayPomodoros: newTodayPomodoros,
            todayFocusTime: newTodayFocusTime,
        };
        
        localStorage.setItem('pomodoro', JSON.stringify(newPomodoro));

        return {
            ...state,
            pomodoro: newPomodoro,
        };
    }
    case ActionType.UPDATE_POMODORO_TIME:
      if (!state.pomodoro.isActive) return state;
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          timeRemaining: state.pomodoro.timeRemaining > 0 ? state.pomodoro.timeRemaining - 1 : 0,
        }
      };
    case ActionType.TOGGLE_POMODORO_POPOVER:
      return { ...state, pomodoro: { ...state.pomodoro, isPopoverOpen: !state.pomodoro.isPopoverOpen } };
    case ActionType.CLOSE_POMODORO_POPOVER:
        return { ...state, pomodoro: { ...state.pomodoro, isPopoverOpen: false } };
    case ActionType.UPDATE_POMODORO_SETTINGS: {
        const newPomodoro: PomodoroState = { ...state.pomodoro, ...action.payload };
        // If timer is not running, update the time display to reflect new settings
        if (!newPomodoro.isActive) {
            const { mode, pomodoroDuration, shortBreakDuration, longBreakDuration } = newPomodoro;
            let time;
            if (mode === 'pomodoro') time = pomodoroDuration * 60;
            else if (mode === 'shortBreak') time = shortBreakDuration * 60;
            else time = longBreakDuration * 60;
            newPomodoro.timeRemaining = time;
            newPomodoro.initialTime = time;
        }
        localStorage.setItem('pomodoro', JSON.stringify(newPomodoro));
        return { ...state, pomodoro: newPomodoro };
    }
    case ActionType.TOGGLE_POMODORO_COMPACT_VIEW: {
        const newPomodoro = { ...state.pomodoro, compactView: !state.pomodoro.compactView };
        localStorage.setItem('pomodoro', JSON.stringify(newPomodoro));
        return { ...state, pomodoro: newPomodoro };
    }
    case ActionType.SET_POMODORO_CURRENT_TASK:
        return {
            ...state,
            pomodoro: { ...state.pomodoro, currentTaskText: action.payload }
        };
    case ActionType.ADD_POMODORO_TASK: {
        const newTask: PomodoroTask = {
            id: `pomo-task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            text: action.payload.text,
            isCompleted: false,
        };
        const newTasks = [...state.pomodoroTasks, newTask];
        localStorage.setItem('pomodoroTasks', JSON.stringify(newTasks));
        return { ...state, pomodoroTasks: newTasks };
    }
     case ActionType.TOGGLE_POMODORO_TASK: {
        const newTasks = state.pomodoroTasks.map(t => t.id === action.payload.taskId ? {...t, isCompleted: !t.isCompleted} : t);
        localStorage.setItem('pomodoroTasks', JSON.stringify(newTasks));
        return { ...state, pomodoroTasks: newTasks };
    }
    case ActionType.DELETE_POMODORO_TASK: {
        const newTasks = state.pomodoroTasks.filter(t => t.id !== action.payload.taskId);
        let newActiveId = state.activePomodoroTaskId;
        if (state.activePomodoroTaskId === action.payload.taskId) {
            newActiveId = null;
        }
        localStorage.setItem('pomodoroTasks', JSON.stringify(newTasks));
        localStorage.setItem('activePomodoroTaskId', JSON.stringify(newActiveId));
        return { ...state, pomodoroTasks: newTasks, activePomodoroTaskId: newActiveId };
    }
    case ActionType.SET_ACTIVE_POMODORO_TASK: {
        localStorage.setItem('activePomodoroTaskId', JSON.stringify(action.payload.taskId));
        return { ...state, activePomodoroTaskId: action.payload.taskId };
    }
    
    // Verse Actions
    case ActionType.OPEN_VERSE_SELECTOR:
        return { ...state, isVerseSelectorOpen: true };
    case ActionType.CLOSE_VERSE_SELECTOR:
        return { ...state, isVerseSelectorOpen: false };
    case ActionType.SET_SELECTED_VERSE:
        if (action.payload) {
            localStorage.setItem('selectedVerse', JSON.stringify(action.payload));
        } else {
            localStorage.removeItem('selectedVerse');
        }
        return { ...state, selectedVerse: action.payload, isVerseSelectorOpen: false, currentVerseIndex: 0 };
    case ActionType.SET_VERSE_INDEX:
        return { ...state, currentVerseIndex: action.payload };
    
    // Salat Clock Actions
    case ActionType.SET_SALAT_LOCATION:
        localStorage.setItem('salatLocation', JSON.stringify(action.payload));
        return { ...state, salatLocation: action.payload, salatTimes: {} }; // Reset times to trigger refetch
    case ActionType.SET_SALAT_TIMES:
        return { ...state, salatTimes: action.payload };

    // Notification Actions
    case ActionType.ADD_NOTIFICATION: {
        const newNotification: Notification = {
            id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...action.payload,
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        const newNotifications = [newNotification, ...state.notifications];
        localStorage.setItem('notifications', JSON.stringify(newNotifications));
        return { ...state, notifications: newNotifications };
    }
    case ActionType.MARK_NOTIFICATION_READ: {
        const newNotifications = state.notifications.map(n => 
            n.id === action.payload.notificationId ? { ...n, isRead: true } : n
        );
        localStorage.setItem('notifications', JSON.stringify(newNotifications));
        return { ...state, notifications: newNotifications };
    }
    case ActionType.MARK_ALL_NOTIFICATIONS_READ: {
        const newNotifications = state.notifications.map(n => ({ ...n, isRead: true }));
        localStorage.setItem('notifications', JSON.stringify(newNotifications));
        return { ...state, notifications: newNotifications };
    }
    case ActionType.OPEN_NOTIFICATIONS_MODAL:
        return { ...state, isNotificationsOpen: true };
    case ActionType.CLOSE_NOTIFICATIONS_MODAL:
        return { ...state, isNotificationsOpen: false };
    
    // Notes Actions
    case ActionType.ADD_NOTEBOOK: {
      const newId = `notebook-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const newNotebook: Notebook = { id: newId, name: action.payload.name, createdAt: new Date().toISOString() };
      const newState = {
        ...state,
        notebooks: { ...state.notebooks, [newId]: newNotebook },
        notebookOrder: [...state.notebookOrder, newId],
      };
      localStorage.setItem('notebooks', JSON.stringify(newState.notebooks));
      localStorage.setItem('notebookOrder', JSON.stringify(newState.notebookOrder));
      return newState;
    }
    case ActionType.UPDATE_NOTEBOOK: {
      const { id, name } = action.payload;
      const newState = {
        ...state,
        notebooks: { ...state.notebooks, [id]: { ...state.notebooks[id], name } },
      };
      localStorage.setItem('notebooks', JSON.stringify(newState.notebooks));
      return newState;
    }
    case ActionType.DELETE_NOTEBOOK: {
      const { id } = action.payload;
      const { [id]: _, ...remainingNotebooks } = state.notebooks;
      const remainingNotebookOrder = state.notebookOrder.filter(nbId => nbId !== id);
      
      const notesToDelete = Object.values(state.notes).filter(note => note.notebookId === id);
      const remainingNotes = { ...state.notes };
      const newTrashedNotes = { ...state.trashedNotes };
      const now = new Date().toISOString();

      notesToDelete.forEach(note => {
          delete remainingNotes[note.id];
          newTrashedNotes[note.id] = { ...note, deletedAt: now };
      });

      const newState = {
        ...state,
        notebooks: remainingNotebooks,
        notebookOrder: remainingNotebookOrder,
        notes: remainingNotes,
        trashedNotes: newTrashedNotes,
        noteToView: state.noteToView?.notebookId === id ? null : state.noteToView,
      };
      localStorage.setItem('notebooks', JSON.stringify(newState.notebooks));
      localStorage.setItem('notebookOrder', JSON.stringify(newState.notebookOrder));
      localStorage.setItem('notes', JSON.stringify(newState.notes));
      localStorage.setItem('trashedNotes', JSON.stringify(newState.trashedNotes));
      return newState;
    }
    case ActionType.ADD_NOTE: {
      const { notebookId, title } = action.payload;
      if (!state.notebooks[notebookId]) return state;
      
      const now = new Date().toISOString();
      const newId = `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const newNote: Note = {
        id: newId,
        notebookId,
        title: title || 'New Note',
        content: '',
        tagIds: [],
        createdAt: now,
        updatedAt: now,
        pinned: false,
      };

      const newState = {
        ...state,
        notes: { ...state.notes, [newId]: newNote },
      };
      localStorage.setItem('notes', JSON.stringify(newState.notes));
      return newState;
    }
    case ActionType.UPDATE_NOTE: {
      const { noteId, updates } = action.payload;
      if (!state.notes[noteId]) return state;
      
      const updatedNote: Note = {
        ...state.notes[noteId],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      const newState = {
        ...state,
        notes: { ...state.notes, [noteId]: updatedNote },
      };
      localStorage.setItem('notes', JSON.stringify(newState.notes));
      return newState;
    }
    case ActionType.TOGGLE_NOTE_PIN: {
      const { noteId } = action.payload;
      if (!state.notes[noteId]) return state;
      const note = state.notes[noteId];
      const newState = {
          ...state,
          notes: {
              ...state.notes,
              [noteId]: { ...note, pinned: !note.pinned }
          },
      };
      localStorage.setItem('notes', JSON.stringify(newState.notes));
      return newState;
    }
    case ActionType.ADD_AI_TAGS_TO_NOTE: {
        const { noteId, tagNames } = action.payload;
        if (!state.notes[noteId]) return state;

        let newTags = { ...state.tags };
        const newTagIdsForNote = new Set<string>(state.notes[noteId].tagIds);

        tagNames.forEach(tagName => {
            const normalizedTagName = tagName.toLowerCase();
            let existingTag = Object.values(newTags).find(t => t.name === normalizedTagName);
            if (existingTag) {
                newTagIdsForNote.add(existingTag.id);
            } else {
                const newId = `tag-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-600'];
                const newColor = colors[Object.keys(newTags).length % colors.length];
                const newTag: Tag = { id: newId, name: normalizedTagName, color: newColor };
                newTags[newId] = newTag;
                newTagIdsForNote.add(newId);
            }
        });

        const updatedNote = { ...state.notes[noteId], tagIds: Array.from(newTagIdsForNote) };
        const newState = {
            ...state,
            tags: newTags,
            notes: { ...state.notes, [noteId]: updatedNote },
        };
        localStorage.setItem('tags', JSON.stringify(newState.tags));
        localStorage.setItem('notes', JSON.stringify(newState.notes));
        return newState;
    }
    case ActionType.DELETE_NOTE: {
        const { noteId } = action.payload;
        const noteToDelete = state.notes[noteId];
        if (!noteToDelete) return state;
  
        const { [noteId]: _, ...remainingNotes } = state.notes;
        const trashedNote: TrashedNote = {
            ...noteToDelete,
            deletedAt: new Date().toISOString(),
        };
        
        const newState = {
          ...state,
          notes: remainingNotes,
          trashedNotes: { ...state.trashedNotes, [noteId]: trashedNote },
          noteToView: state.noteToView?.noteId === noteId ? null : state.noteToView,
        };
        localStorage.setItem('notes', JSON.stringify(newState.notes));
        localStorage.setItem('trashedNotes', JSON.stringify(newState.trashedNotes));
        return newState;
    }
    case ActionType.RESTORE_NOTE: {
        const { noteId } = action.payload;
        const noteToRestore = state.trashedNotes[noteId];
        if (!noteToRestore) return state;

        const { deletedAt, ...originalNote } = noteToRestore;
        const { [noteId]: __, ...remainingTrashedNotes } = state.trashedNotes;

        const newState = {
            ...state,
            notes: { ...state.notes, [noteId]: originalNote },
            trashedNotes: remainingTrashedNotes,
        };

        localStorage.setItem('notes', JSON.stringify(newState.notes));
        localStorage.setItem('trashedNotes', JSON.stringify(newState.trashedNotes));
        return newState;
    }
    case ActionType.PERMANENTLY_DELETE_NOTE: {
        const { noteId } = action.payload;
        const { [noteId]: _, ...remainingTrashedNotes } = state.trashedNotes;
        const newState = {
            ...state,
            trashedNotes: remainingTrashedNotes,
        };
        localStorage.setItem('trashedNotes', JSON.stringify(newState.trashedNotes));
        return newState;
    }
    case ActionType.VIEW_NOTE:
        return { ...state, viewMode: 'notes', noteToView: action.payload };
    case ActionType.CLEAR_NOTE_TO_VIEW:
        return { ...state, noteToView: null };
    
    // Tag Actions
    case ActionType.ADD_TAG: {
        const { name } = action.payload;
        const normalizedName = name.trim().toLowerCase();
        if(!normalizedName) return state;

        const existingTag = Object.values(state.tags).find(t => t.name.toLowerCase() === normalizedName);
        if (existingTag) return state;

        const newId = `tag-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-600'];
        const newColor = colors[Object.keys(state.tags).length % colors.length];

        const newTag: Tag = { id: newId, name: normalizedName, color: newColor };
        const newState = {
            ...state,
            tags: { ...state.tags, [newId]: newTag },
        };
        localStorage.setItem('tags', JSON.stringify(newState.tags));
        return newState;
    }
    case ActionType.UPDATE_TAG: {
        const { id, name } = action.payload;
        if (!state.tags[id]) return state;

        const newState = {
            ...state,
            tags: { ...state.tags, [id]: { ...state.tags[id], name } },
        };
        localStorage.setItem('tags', JSON.stringify(newState.tags));
        return newState;
    }
    case ActionType.DELETE_TAG: {
        const { id } = action.payload;
        if (!state.tags[id]) return state;

        const { [id]: _, ...remainingTags } = state.tags;
        
        const updatedNotes = { ...state.notes };
        Object.keys(updatedNotes).forEach(noteId => {
            const note = updatedNotes[noteId];
            const newTagIds = note.tagIds.filter(tagId => tagId !== id);
            if (newTagIds.length !== note.tagIds.length) {
                updatedNotes[noteId] = { ...note, tagIds: newTagIds };
            }
        });

        const newState = {
            ...state,
            tags: remainingTags,
            notes: updatedNotes,
        };
        localStorage.setItem('tags', JSON.stringify(newState.tags));
        localStorage.setItem('notes', JSON.stringify(newState.notes));
        return newState;
    }


    // Timeline Event Actions
    case ActionType.ADD_TIMELINE_EVENT: {
      const newEvent: TimelineEvent = {
        id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...action.payload,
      };
      const newEvents = [...state.timelineEvents, newEvent];
      localStorage.setItem('timelineEvents', JSON.stringify(newEvents));
      return { ...state, timelineEvents: newEvents };
    }
    case ActionType.UPDATE_TIMELINE_EVENT: {
      const newEvents = state.timelineEvents.map(event =>
        event.id === action.payload.id ? action.payload : event
      );
      localStorage.setItem('timelineEvents', JSON.stringify(newEvents));
      return { ...state, timelineEvents: newEvents };
    }
    case ActionType.DELETE_TIMELINE_EVENT: {
      const newEvents = state.timelineEvents.filter(
        event => event.id !== action.payload.id
      );
      localStorage.setItem('timelineEvents', JSON.stringify(newEvents));
      return { ...state, timelineEvents: newEvents };
    }
    
    // Finance Actions
    case ActionType.ADD_ACCOUNT: {
      const newAccount: Account = {
        id: `acc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...action.payload,
        currentBalance: action.payload.initialBalance,
      };
      const newAccounts = [...state.accounts, newAccount];
      localStorage.setItem('accounts', JSON.stringify(newAccounts));
      return { ...state, accounts: newAccounts };
    }
    case ActionType.DELETE_ACCOUNT: {
        if (!window.confirm("Are you sure? Deleting an account will not delete its transactions, which may cause accounting errors.")) return state;
        const newAccounts = state.accounts.filter(acc => acc.id !== action.payload.id);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        return { ...state, accounts: newAccounts };
    }
    case ActionType.ADD_TRANSACTION: {
        const newTransaction: Transaction = {
            id: `trn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...action.payload,
        };
        const newTransactions = [...state.transactions, newTransaction];
        const newAccounts = state.accounts.map(acc => {
            if (acc.id === newTransaction.accountId) {
                const newBalance = newTransaction.type === 'income'
                    ? acc.currentBalance + newTransaction.amount
                    : acc.currentBalance - newTransaction.amount;
                return { ...acc, currentBalance: newBalance };
            }
            return acc;
        });
        localStorage.setItem('transactions', JSON.stringify(newTransactions));
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        return { ...state, transactions: newTransactions, accounts: newAccounts };
    }
    case ActionType.DELETE_TRANSACTION: {
        const transactionToDelete = state.transactions.find(t => t.id === action.payload.id);
        if (!transactionToDelete) return state;

        const newTransactions = state.transactions.filter(t => t.id !== action.payload.id);
        const newAccounts = state.accounts.map(acc => {
            if (acc.id === transactionToDelete.accountId) {
                const newBalance = transactionToDelete.type === 'income'
                    ? acc.currentBalance - transactionToDelete.amount
                    : acc.currentBalance + transactionToDelete.amount;
                return { ...acc, currentBalance: newBalance };
            }
            return acc;
        });
        localStorage.setItem('transactions', JSON.stringify(newTransactions));
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        return { ...state, transactions: newTransactions, accounts: newAccounts };
    }
    case ActionType.ADD_LOAN: {
        const newLoan: Loan = {
            id: `loan-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...action.payload,
            paidAmount: 0,
            payments: [],
        };
        const newLoans = [...state.loans, newLoan];
        localStorage.setItem('loans', JSON.stringify(newLoans));
        return { ...state, loans: newLoans };
    }
    case ActionType.UPDATE_LOAN: {
        const { loanId, updates } = action.payload;
        const newLoans = state.loans.map(loan => {
            if (loan.id === loanId) {
                return { ...loan, ...updates };
            }
            return loan;
        });
        localStorage.setItem('loans', JSON.stringify(newLoans));
        return { ...state, loans: newLoans };
    }
    case ActionType.DELETE_LOAN: {
        if (!window.confirm("Are you sure you want to delete this loan? This action will not affect any payment transactions already recorded.")) return state;
        const newLoans = state.loans.filter(l => l.id !== action.payload.id);
        localStorage.setItem('loans', JSON.stringify(newLoans));
        return { ...state, loans: newLoans };
    }
    case ActionType.RECORD_LOAN_PAYMENT: {
        const { loanId, amount, date, accountId } = action.payload;
        
        const loanToUpdate = state.loans.find(loan => loan.id === loanId);
        if (!loanToUpdate) return state;

        // 1. Create the new payment record
        const newPayment: LoanPayment = { id: `payment-${Date.now()}-${Math.random().toString(16).slice(2)}`, date, amount };

        // 2. Update the loan
        const newLoans = state.loans.map(loan =>
            loan.id === loanId
                ? {
                    ...loan,
                    paidAmount: loan.paidAmount + amount,
                    payments: [...loan.payments, newPayment],
                }
                : loan
        );

        // 3. Create the corresponding transaction
        const newTransaction: Transaction = {
            id: `trn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            accountId: accountId,
            type: loanToUpdate.type === 'borrowed' ? 'expense' : 'income',
            category: loanToUpdate.type === 'borrowed' ? 'Loan Repayment' : 'Loan Collection',
            amount: amount,
            description: `Payment for loan with ${loanToUpdate.person}`,
            date: date,
        };
        const newTransactions = [...state.transactions, newTransaction];

        // 4. Update the account balance
        const newAccounts = state.accounts.map(acc => {
            if (acc.id === accountId) {
                const newBalance = newTransaction.type === 'income'
                    ? acc.currentBalance + amount
                    : acc.currentBalance - amount;
                return { ...acc, currentBalance: newBalance };
            }
            return acc;
        });

        // 5. Update state and save
        const newState = { ...state, loans: newLoans, transactions: newTransactions, accounts: newAccounts };
        localStorage.setItem('loans', JSON.stringify(newState.loans));
        localStorage.setItem('transactions', JSON.stringify(newState.transactions));
        localStorage.setItem('accounts', JSON.stringify(newState.accounts));
        return newState;
    }
    case ActionType.ADD_INVESTMENT: {
        const newInvestment: Investment = {
            id: `inv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...action.payload,
            profits: [],
        };
        const newInvestments = [...state.investments, newInvestment];
        localStorage.setItem('investments', JSON.stringify(newInvestments));
        return { ...state, investments: newInvestments };
    }
    case ActionType.DELETE_INVESTMENT: {
        const newInvestments = state.investments.filter(i => i.id !== action.payload.id);
        localStorage.setItem('investments', JSON.stringify(newInvestments));
        return { ...state, investments: newInvestments };
    }
    case ActionType.RECORD_PROFIT: {
        const { investmentId, amount, date, accountId } = action.payload;
        
        const investmentToUpdate = state.investments.find(inv => inv.id === investmentId);
        if (!investmentToUpdate) return state;
        
        // 1. Create the new profit record
        const newProfit: ProfitEntry = { id: `profit-${Date.now()}-${Math.random().toString(16).slice(2)}`, date, amount };

        // 2. Update the investment
        const newInvestments = state.investments.map(inv =>
            inv.id === investmentId
                ? {
                    ...inv,
                    profits: [...inv.profits, newProfit],
                }
                : inv
        );
        
        // 3. Create the corresponding transaction for the profit
        const newTransaction: Transaction = {
            id: `trn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            accountId,
            type: 'income',
            category: 'Investment Profit',
            amount,
            description: `Profit from ${investmentToUpdate.name}`,
            date,
        };
        const newTransactions = [...state.transactions, newTransaction];

        // 4. Update the account balance
        const newAccounts = state.accounts.map(acc => {
            if (acc.id === accountId) {
                return { ...acc, currentBalance: acc.currentBalance + amount };
            }
            return acc;
        });
        
        // 5. Update state and save
        const newState = { ...state, investments: newInvestments, transactions: newTransactions, accounts: newAccounts };
        localStorage.setItem('investments', JSON.stringify(newState.investments));
        localStorage.setItem('transactions', JSON.stringify(newState.transactions));
        localStorage.setItem('accounts', JSON.stringify(newState.accounts));
        return newState;
    }

    // Quran Memorization
    case ActionType.SET_QURAN_PROGRESS: {
        const { surahNumber, memorizedAyahs } = action.payload;
        const newSurahProgress: { [ayahNumber: string]: boolean } = {};
        memorizedAyahs.forEach(ayah => {
            newSurahProgress[ayah] = true;
        });

        const newQuranProgress = {
            ...state.quranProgress,
            [surahNumber]: newSurahProgress,
        };
        localStorage.setItem('quranProgress', JSON.stringify(newQuranProgress));
        return { ...state, quranProgress: newQuranProgress };
    }

    // Mind Map
    case ActionType.ADD_MINDMAP: {
        const { name } = action.payload;
        const newId = `mindmap-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const newMindMap = createDefaultMindMap();
        newMindMap.id = newId;
        newMindMap.name = name;

        const newMindMaps = { ...state.mindMaps, [newId]: newMindMap };
        localStorage.setItem('mindMaps', JSON.stringify(newMindMaps));
        return { ...state, mindMaps: newMindMaps, activeMindMapId: newId };
    }
    case ActionType.UPDATE_MINDMAP: {
        const { id, updates } = action.payload;
        const newMindMaps = { ...state.mindMaps };
        const mindMap = newMindMaps[id];
        if (mindMap) {
            const newMindMap = {
                ...mindMap,
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            // If items were updated, manage the history stack
            if (updates.items && updates.displayOrder) {
                const newHistoryEntry = {
                    items: updates.items,
                    displayOrder: updates.displayOrder,
                };
                // Truncate future history if we are in the middle of an undo stack
                const truncatedHistory = mindMap.history.slice(0, mindMap.historyIndex + 1);
                newMindMap.history = [...truncatedHistory, newHistoryEntry];
                newMindMap.historyIndex = newMindMap.history.length - 1;
            }
            
            newMindMaps[id] = newMindMap;
        }
        localStorage.setItem('mindMaps', JSON.stringify(newMindMaps));
        return { ...state, mindMaps: newMindMaps };
    }
    case ActionType.DELETE_MINDMAP: {
        const { id } = action.payload;
        const { [id]: _, ...remainingMindMaps } = state.mindMaps;
        localStorage.setItem('mindMaps', JSON.stringify(remainingMindMaps));
        const newActiveId = state.activeMindMapId === id ? Object.keys(remainingMindMaps)[0] || null : state.activeMindMapId;
        return { ...state, mindMaps: remainingMindMaps, activeMindMapId: newActiveId };
    }
    case ActionType.UNDO_MINDMAP: {
        const { id } = action.payload;
        const newMindMaps = { ...state.mindMaps };
        const mindMap = newMindMaps[id];
        if (mindMap && mindMap.historyIndex > 0) {
            const newHistoryIndex = mindMap.historyIndex - 1;
            newMindMaps[id] = {
                ...mindMap,
                historyIndex: newHistoryIndex,
                items: mindMap.history[newHistoryIndex].items,
                displayOrder: mindMap.history[newHistoryIndex].displayOrder,
            };
            localStorage.setItem('mindMaps', JSON.stringify(newMindMaps));
            return { ...state, mindMaps: newMindMaps };
        }
        return state;
    }
    case ActionType.REDO_MINDMAP: {
        const { id } = action.payload;
        const newMindMaps = { ...state.mindMaps };
        const mindMap = newMindMaps[id];
        if (mindMap && mindMap.historyIndex < mindMap.history.length - 1) {
            const newHistoryIndex = mindMap.historyIndex + 1;
            newMindMaps[id] = {
                ...mindMap,
                historyIndex: newHistoryIndex,
                items: mindMap.history[newHistoryIndex].items,
                displayOrder: mindMap.history[newHistoryIndex].displayOrder,
            };
            localStorage.setItem('mindMaps', JSON.stringify(newMindMaps));
            return { ...state, mindMaps: newMindMaps };
        }
        return state;
    }
    
    // Habit Tracker Actions
    case ActionType.ADD_HABIT: {
        const newHabit: Habit = {
            id: `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ...action.payload,
            completions: [],
            isArchived: false,
            createdAt: new Date().toISOString(),
            notes: {},
        };
        const newHabits = [...state.habits, newHabit];
        localStorage.setItem('habits', JSON.stringify(newHabits));
        return { ...state, habits: newHabits };
    }
    case ActionType.UPDATE_HABIT: {
        const { habitId, updates } = action.payload;
        const newHabits = state.habits.map(h => h.id === habitId ? { ...h, ...updates } : h);
        localStorage.setItem('habits', JSON.stringify(newHabits));
        return { ...state, habits: newHabits };
    }
    case ActionType.ARCHIVE_HABIT: {
        const { habitId } = action.payload;
        const habitToArchive = state.habits.find(h => h.id === habitId);
        if (!habitToArchive) return state;
        const newHabits = state.habits.filter(h => h.id !== habitId);
        const newArchivedHabits = [...(state.archivedHabits || []), { ...habitToArchive, isArchived: true }];
        localStorage.setItem('habits', JSON.stringify(newHabits));
        localStorage.setItem('archivedHabits', JSON.stringify(newArchivedHabits));
        return { ...state, habits: newHabits, archivedHabits: newArchivedHabits };
    }
    case ActionType.RESTORE_HABIT: {
        const { habitId } = action.payload;
        const habitToRestore = state.archivedHabits.find(h => h.id === habitId);
        if (!habitToRestore) return state;
        const newArchivedHabits = state.archivedHabits.filter(h => h.id !== habitId);
        const newHabits = [...state.habits, { ...habitToRestore, isArchived: false }];
        localStorage.setItem('habits', JSON.stringify(newHabits));
        localStorage.setItem('archivedHabits', JSON.stringify(newArchivedHabits));
        return { ...state, habits: newHabits, archivedHabits: newArchivedHabits };
    }
    case ActionType.PERMANENTLY_DELETE_HABIT: {
        const { habitId } = action.payload;
        const newArchivedHabits = state.archivedHabits.filter(h => h.id !== habitId);
        localStorage.setItem('archivedHabits', JSON.stringify(newArchivedHabits));
        return { ...state, archivedHabits: newArchivedHabits };
    }
    case ActionType.TOGGLE_HABIT_COMPLETION: {
        const { habitId, date } = action.payload;
        const newHabits = state.habits.map(habit => {
            if (habit.id === habitId) {
                const completionIndex = habit.completions.findIndex(c => c.date === date);
                const newCompletions = [...habit.completions];
                if (completionIndex > -1) {
                    newCompletions.splice(completionIndex, 1);
                } else {
                    newCompletions.push({ date });
                }
                return { ...habit, completions: newCompletions };
            }
            return habit;
        });
        localStorage.setItem('habits', JSON.stringify(newHabits));
        return { ...state, habits: newHabits };
    }
    case ActionType.OPEN_HABIT_DETAIL:
        return { ...state, isHabitDetailOpen: true, activeHabitId: action.payload.habitId };
    case ActionType.CLOSE_HABIT_DETAIL:
        return { ...state, isHabitDetailOpen: false, activeHabitId: null };
    case ActionType.ADD_HABIT_NOTE: {
        const { habitId, date, text } = action.payload;
        const newHabits = state.habits.map(habit => {
            if (habit.id === habitId) {
                const newNotes = { ...(habit.notes || {}) };
                if (text.trim()) {
                    newNotes[date] = text.trim();
                } else {
                    delete newNotes[date];
                }
                return { ...habit, notes: newNotes };
            }
            return habit;
        });
        localStorage.setItem('habits', JSON.stringify(newHabits));
        return { ...state, habits: newHabits };
    }

    // Bookmark Actions
    case ActionType.ADD_BOOKMARK_FOLDER: {
        const newFolder: BookmarkFolder = {
            id: `bmf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title: action.payload.title,
            bookmarks: [],
        };
        const newFolders = [...state.bookmarkFolders, newFolder];
        localStorage.setItem('bookmarkFolders', JSON.stringify(newFolders));
        return { ...state, bookmarkFolders: newFolders };
    }
    case ActionType.UPDATE_BOOKMARK_FOLDER: {
        const newFolders = state.bookmarkFolders.map(f =>
            f.id === action.payload.folderId ? { ...f, title: action.payload.title } : f
        );
        localStorage.setItem('bookmarkFolders', JSON.stringify(newFolders));
        return { ...state, bookmarkFolders: newFolders };
    }
    case ActionType.DELETE_BOOKMARK_FOLDER: {
        const newFolders = state.bookmarkFolders.filter(f => f.id !== action.payload.folderId);
        localStorage.setItem('bookmarkFolders', JSON.stringify(newFolders));
        return { ...state, bookmarkFolders: newFolders };
    }
    case ActionType.ADD_BOOKMARK: {
        const newFolders = state.bookmarkFolders.map(f => {
            if (f.id === action.payload.folderId) {
                return { ...f, bookmarks: [...f.bookmarks, action.payload.bookmark] };
            }
            return f;
        });
        localStorage.setItem('bookmarkFolders', JSON.stringify(newFolders));
        return { ...state, bookmarkFolders: newFolders };
    }
    case ActionType.UPDATE_BOOKMARK: {
        const newFolders = state.bookmarkFolders.map(f => {
            if (f.id === action.payload.folderId) {
                return {
                    ...f,
                    bookmarks: f.bookmarks.map(b =>
                        b.id === action.payload.bookmarkId ? { ...b, ...action.payload.updates } : b
                    )
                };
            }
            return f;
        });
        localStorage.setItem('bookmarkFolders', JSON.stringify(newFolders));
        return { ...state, bookmarkFolders: newFolders };
    }
    case ActionType.DELETE_BOOKMARK: {
        const newFolders = state.bookmarkFolders.map(f => {
            if (f.id === action.payload.folderId) {
                return { ...f, bookmarks: f.bookmarks.filter(b => b.id !== action.payload.bookmarkId) };
            }
            return f;
        });
        localStorage.setItem('bookmarkFolders', JSON.stringify(newFolders));
        return { ...state, bookmarkFolders: newFolders };
    }
    case ActionType.REORDER_BOOKMARKS: {
        const { folderId, draggedId, targetId } = action.payload;
        const newFolders = [...state.bookmarkFolders];
        const folderIndex = newFolders.findIndex(f => f.id === folderId);
        if (folderIndex === -1) return state;

        const folder = { ...newFolders[folderIndex] };
        const bookmarks = [...folder.bookmarks];
        const draggedIndex = bookmarks.findIndex(b => b.id === draggedId);
        if (draggedIndex === -1) return state;

        const [draggedItem] = bookmarks.splice(draggedIndex, 1);
        
        if (targetId === null) {
            bookmarks.push(draggedItem);
        } else {
            const targetIndex = bookmarks.findIndex(b => b.id === targetId);
            bookmarks.splice(targetIndex, 0, draggedItem);
        }
        
        folder.bookmarks = bookmarks;
        newFolders[folderIndex] = folder;

        localStorage.setItem('bookmarkFolders', JSON.stringify(newFolders));
        return { ...state, bookmarkFolders: newFolders };
    }
    
    // Settings Actions
    case ActionType.SAVE_SETTINGS: {
        saveAllSettings(state);
        alert('Settings have been saved successfully!');
        return state;
    }
    case ActionType.RESET_SETTINGS: {
        // Confirmation should be handled in the UI component before dispatching
        localStorage.clear();
        window.location.reload();
        return getInitialState(); // Return a fresh state
    }
    case ActionType.TOGGLE_AUTO_COLOR_CHANGE: {
        const newState = { ...state, isAutoColorChangeEnabled: !state.isAutoColorChangeEnabled };
        localStorage.setItem('isAutoColorChangeEnabled', JSON.stringify(newState.isAutoColorChangeEnabled));
        return newState;
    }
    case ActionType.SET_AUTO_COLOR_CHANGE_INTERVAL: {
        const newState = { ...state, autoColorChangeInterval: action.payload };
        localStorage.setItem('autoColorChangeInterval', JSON.stringify(newState.autoColorChangeInterval));
        return newState;
    }

    default:
      return state;
  }
};

export const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> }>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};