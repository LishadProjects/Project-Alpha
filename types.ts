

export interface Label {
  id: string;
  text: string;
  color: string;
}

export interface ChecklistItem {
  id:string;
  text: string;
  isCompleted: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Comment {
    id: string;
    author: string;
    text: string;
    timestamp: string;
}

export interface Attachment {
    id:string;
    name: string;
    url: string;
    type: 'image' | 'file';
    createdAt: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  coverImage?: string;
  labelIds: string[];
  checklists: Checklist[];
  comments: Comment[];
  attachments: Attachment[];
}

export interface TrashedCard extends Card {
  deletedAt: string;
  originalListId: string;
}

export interface TrashedNote extends Note {
    deletedAt: string;
}

export interface List {
  id: string;
  title: string;
  cardIds: string[];
  isCollapsed?: boolean;
}

export interface BoardState {
  id: string;
  title: string;
  lists: { [key: string]: List };
  cards: { [key: string]: Card };
  labels: { [key: string]: Label };
  listOrder: string[];
  trashedCards: { [key: string]: TrashedCard };
}

// Daily To-Do Type
export interface DailyTodo {
  id: string;
  text: string;
  isCompleted: boolean;
  date: string; // YYYY-MM-DD format
  startTime?: string; // Full ISO String, optional
  endTime?: string;   // Full ISO String, optional
  isRecurring: boolean;
  completedOn?: { [dateYMD: string]: boolean }; // YYYY-MM-DD format for keys
  salatPrayer?: string; // e.g., 'Fajr', 'Dhuhr'. Unique identifier for salat tasks.
}

export type PomodoroMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface PomodoroTask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface PomodoroState {
  mode: PomodoroMode;
  timeRemaining: number;
  isActive: boolean;
  isPopoverOpen: boolean;
  initialTime: number;
  currentTaskText: string;
  // New settings & stats from advanced timer
  pomodorosCompleted: number; // overall count
  todayPomodoros: number;
  todayFocusTime: number; // in minutes
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  enableSound: boolean;
  enableNotifications: boolean;
  compactView?: boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: 'pomodoro' | 'dueDate' | 'schedule' | 'boardActivity';
  relatedId?: string; // cardId or todoId
  listId?: string; // for cards, when type is 'dueDate'
  createdAt: string;
  isRead: boolean;
}

export interface Notebook {
  id: string;
  name: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  notebookId: string;
  title: string;
  content: string; // Markdown content
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD format
  title: string;
  color: string; // e.g., 'bg-red-500'
  noteId?: string;
}

// Financial Types
export interface Account {
  id: string;
  name: string;
  type: 'wallet' | 'bank' | 'mobile';
  initialBalance: number;
  currentBalance: number;
  creationDate: string; // YYYY-MM-DD format
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD format
}

export interface LoanPayment {
    id: string;
    date: string;
    amount: number;
}

export interface Loan {
  id: string;
  person: string;
  type: 'borrowed' | 'lent'; // borrowed from them, lent to them
  initialAmount: number;
  paidAmount: number;
  startDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  payments: LoanPayment[];
}

export interface ProfitEntry {
    id: string;
    date: string; // YYYY-MM-DD
    amount: number;
}

export interface Investment {
    id: string;
    name: string; // Company/Place
    initialAmount: number;
    startDate: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD, for fixed-term investments
    profitType: 'monthly' | 'yearly' | 'on-maturity';
    expectedReturnRate?: number; // Annual percentage
    profits: ProfitEntry[];
}

// --- Mind Map (Whiteboard) Types ---
export type MindMapItemType = 'text' | 'image' | 'path' | 'shape' | 'sticky-note';

export interface MindMapItem {
    id: string;
    type: MindMapItemType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
}

export interface MindMapText extends MindMapItem {
    type: 'text';
    text: string;
    style: {
        fontSize: number;
        fontFamily: string;
        color: string;
        background: string;
        bold: boolean;
        italic: boolean;
        align: 'left' | 'center' | 'right';
    };
}

export interface MindMapImage extends MindMapItem {
    type: 'image';
    src: string; // base64 data URL
}

export interface MindMapPath extends MindMapItem {
    type: 'path';
    d: string; // SVG path data string
    style: {
        stroke: string;
        strokeWidth: number;
        fill: string;
    };
}

export interface MindMapShape extends MindMapItem {
    type: 'shape';
    shapeType: 'rectangle' | 'ellipse';
    style: {
        fill: string;
        stroke: string;
        strokeWidth: number;
    };
}

export interface MindMapStickyNote extends MindMapItem {
    type: 'sticky-note';
    text: string;
    style: {
        background: string; // e.g., '#ffff99'
        fontSize: number;
        fontFamily: string;
        color: string;
        align: 'left' | 'center' | 'right';
        bold: boolean;
        italic: boolean;
    };
}

export type AnyMindMapItem = MindMapText | MindMapImage | MindMapPath | MindMapShape | MindMapStickyNote;

export interface MindMapData {
    id: string;
    name: string;
    items: { [id: string]: AnyMindMapItem };
    displayOrder: string[];
    history: { items: { [id: string]: AnyMindMapItem }; displayOrder: string[] }[];
    historyIndex: number;
    updatedAt: string;
}


// Habit Tracker Types
export interface HabitCompletion {
    date: string; // YYYY-MM-DD
}

export interface Habit {
    id: string;
    name: string;
    icon: string; // Icon name from a predefined list
    color: string; // e.g., 'bg-blue-500'
    goal: number; // e.g., 5
    goalUnit: 'week'; // For now, only support weekly goals
    completions: HabitCompletion[];
    isArchived: boolean;
    createdAt: string;
    notes?: { [dateYMD: string]: string };
}

// Bookmark Types
export interface Bookmark {
    id: string;
    title: string;
    url: string;
    faviconUrl: string;
}

export interface BookmarkFolder {
    id: string;
    title: string;
    bookmarks: Bookmark[];
}

export type Theme = 'light' | 'dark' | 'khata' | 'gradient';
export type PrimaryColor = 'blue' | 'green' | 'rose' | 'orange' | 'violet' | 'slate' | 'cyan' | 'pink' | 'emerald' | 'sky' | 'amber' | 'lime';
export type ViewMode = 'dashboard' | 'board' | 'whiteboard' | 'timeline' | 'finance' | 'quran' | 'notes' | 'habits' | 'bookmarks' | 'planner';
export type FinanceViewTab = 'overview' | 'transactions' | 'accounts' | 'loans' | 'investments' | 'reports';

export type AppState = {
  isAuthenticated: boolean;
  password: string;
  boards: { [id: string]: BoardState };
  activeBoardId: string;
  dailyTodos: DailyTodo[];
  pomodoro: PomodoroState;
  pomodoroTasks: PomodoroTask[];
  activePomodoroTaskId: string | null;
  isTrashOpen: boolean;
  theme: Theme;
  primaryColor: PrimaryColor;
  isAutoColorChangeEnabled: boolean;
  autoColorChangeInterval: number; // in seconds
  timeTrackerWidth: number; // in rem
  appViewScale: number; // e.g. 1 for 100%, 0.75 for 75%
  activeCardId: { cardId: string; listId: string; } | null;
  dragging: {
    cardId: string | null;
    listId: string | null;
  };
  selectedVerse: { surah: number; startAyah: number; endAyah: number } | null;
  isVerseSelectorOpen: boolean;
  currentVerseIndex: number;
  notifications: Notification[];
  isNotificationsOpen: boolean;
  // Salat Times
  salatLocation: { city: string; country: string; };
  salatTimes: { [key: string]: string; };
  // Notes State
  notebooks: { [key: string]: Notebook };
  notes: { [key: string]: Note };
  tags: { [id: string]: Tag };
  trashedNotes: { [key: string]: TrashedNote };
  notebookOrder: string[];
  noteToView: { notebookId: string; noteId: string } | null;
  viewMode: ViewMode;
  timelineEvents: TimelineEvent[];
  // Finance State
  accounts: Account[];
  transactions: Transaction[];
  loans: Loan[];
  investments: Investment[];
  // Quran Memorization State
  quranProgress: { [surahNumber: string]: { [ayahNumber: string]: boolean } };
  // Mind Map State
  mindMaps: { [id: string]: MindMapData };
  activeMindMapId: string | null;
  // Habit Tracker State
  habits: Habit[];
  archivedHabits: Habit[];
  isHabitDetailOpen: boolean;
  activeHabitId: string | null;
  // Bookmarks State
  bookmarkFolders: BookmarkFolder[];
};

export enum ActionType {
  AUTHENTICATE = 'AUTHENTICATE',
  SET_PASSWORD = 'SET_PASSWORD',
  SET_THEME = 'SET_THEME',
  SET_PRIMARY_COLOR = 'SET_PRIMARY_COLOR',
  SET_TIME_TRACKER_WIDTH = 'SET_TIME_TRACKER_WIDTH',
  SET_VIEW_MODE = 'SET_VIEW_MODE',

  // Board Actions
  ADD_BOARD = 'ADD_BOARD',
  SWITCH_BOARD = 'SWITCH_BOARD',
  UPDATE_BOARD_TITLE = 'UPDATE_BOARD_TITLE',
  DELETE_BOARD = 'DELETE_BOARD',
  MOVE_CARD = 'MOVE_CARD',
  MOVE_LIST = 'MOVE_LIST',
  OPEN_CARD_MODAL = 'OPEN_CARD_MODAL',
  CLOSE_CARD_MODAL = 'CLOSE_CARD_MODAL',
  UPDATE_CARD = 'UPDATE_CARD',
  SET_DRAGGING_CARD = 'SET_DRAGGING_CARD',
  SET_DRAGGING_LIST = 'SET_DRAGGING_LIST',
  CLEAR_DRAGGING = 'CLEAR_DRAGGING',
  ADD_CARD = 'ADD_CARD',
  DELETE_CARD = 'DELETE_CARD',
  RESTORE_CARD = 'RESTORE_CARD',
  PERMANENTLY_DELETE_CARD = 'PERMANENTLY_DELETE_CARD',
  EMPTY_TRASH = 'EMPTY_TRASH',
  PURGE_OLD_TRASHED_CARDS = 'PURGE_OLD_TRASHED_CARDS',
  ADD_LIST = 'ADD_LIST',
  UPDATE_LIST_TITLE = 'UPDATE_LIST_TITLE',
  TOGGLE_LIST_COLLAPSED = 'TOGGLE_LIST_COLLAPSED',
  SET_APP_VIEW_SCALE = 'SET_APP_VIEW_SCALE',
  
  // Label Actions
  ADD_LABEL = 'ADD_LABEL',
  UPDATE_LABEL = 'UPDATE_LABEL',
  DELETE_LABEL = 'DELETE_LABEL',

  // Daily To-Do Actions
  ADD_TODO = 'ADD_TODO',
  UPDATE_TODO = 'UPDATE_TODO',
  TOGGLE_TODO = 'TOGGLE_TODO',
  DELETE_TODO = 'DELETE_TODO',
  REORDER_TODOS = 'REORDER_TODOS',
  CLEAR_COMPLETED_TODOS = 'CLEAR_COMPLETED_TODOS',

  // Trash Modal Actions
  OPEN_TRASH_MODAL = 'OPEN_TRASH_MODAL',
  CLOSE_TRASH_MODAL = 'CLOSE_TRASH_MODAL',

  // Pomodoro Actions
  TOGGLE_POMODORO_TIMER = 'TOGGLE_POMODORO_TIMER',
  RESET_POMODORO_TIMER = 'RESET_POMODORO_TIMER',
  SET_POMODORO_MODE = 'SET_POMODORO_MODE',
  SET_NEXT_POMODORO_MODE = 'SET_NEXT_POMODORO_MODE',
  UPDATE_POMODORO_TIME = 'UPDATE_POMODORO_TIME',
  TOGGLE_POMODORO_POPOVER = 'TOGGLE_POMODORO_POPOVER',
  CLOSE_POMODORO_POPOVER = 'CLOSE_POMODORO_POPOVER',
  UPDATE_POMODORO_SETTINGS = 'UPDATE_POMODORO_SETTINGS',
  TOGGLE_POMODORO_COMPACT_VIEW = 'TOGGLE_POMODORO_COMPACT_VIEW',
  SET_POMODORO_CURRENT_TASK = 'SET_POMODORO_CURRENT_TASK',
  ADD_POMODORO_TASK = 'ADD_POMODORO_TASK',
  TOGGLE_POMODORO_TASK = 'TOGGLE_POMODORO_TASK',
  DELETE_POMODORO_TASK = 'DELETE_POMODORO_TASK',
  SET_ACTIVE_POMODORO_TASK = 'SET_ACTIVE_POMODORO_TASK',

  // Verse Actions
  OPEN_VERSE_SELECTOR = 'OPEN_VERSE_SELECTOR',
  CLOSE_VERSE_SELECTOR = 'CLOSE_VERSE_SELECTOR',
  SET_SELECTED_VERSE = 'SET_SELECTED_VERSE',
  SET_VERSE_INDEX = 'SET_VERSE_INDEX',

  // Salat Clock Actions
  SET_SALAT_LOCATION = 'SET_SALAT_LOCATION',
  SET_SALAT_TIMES = 'SET_SALAT_TIMES',

  // Notification Actions
  ADD_NOTIFICATION = 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ = 'MARK_NOTIFICATION_READ',
  MARK_ALL_NOTIFICATIONS_READ = 'MARK_ALL_NOTIFICATIONS_READ',
  OPEN_NOTIFICATIONS_MODAL = 'OPEN_NOTIFICATIONS_MODAL',
  CLOSE_NOTIFICATIONS_MODAL = 'CLOSE_NOTIFICATIONS_MODAL',

  // Notes Actions
  ADD_NOTEBOOK = 'ADD_NOTEBOOK',
  UPDATE_NOTEBOOK = 'UPDATE_NOTEBOOK',
  DELETE_NOTEBOOK = 'DELETE_NOTEBOOK',
  ADD_NOTE = 'ADD_NOTE',
  UPDATE_NOTE = 'UPDATE_NOTE',
  TOGGLE_NOTE_PIN = 'TOGGLE_NOTE_PIN',
  ADD_AI_TAGS_TO_NOTE = 'ADD_AI_TAGS_TO_NOTE',
  DELETE_NOTE = 'DELETE_NOTE',
  RESTORE_NOTE = 'RESTORE_NOTE',
  PERMANENTLY_DELETE_NOTE = 'PERMANENTLY_DELETE_NOTE',
  VIEW_NOTE = 'VIEW_NOTE',
  CLEAR_NOTE_TO_VIEW = 'CLEAR_NOTE_TO_VIEW',

  // Tag Actions
  ADD_TAG = 'ADD_TAG',
  UPDATE_TAG = 'UPDATE_TAG',
  DELETE_TAG = 'DELETE_TAG',

  // Timeline Event Actions
  ADD_TIMELINE_EVENT = 'ADD_TIMELINE_EVENT',
  UPDATE_TIMELINE_EVENT = 'UPDATE_TIMELINE_EVENT',
  DELETE_TIMELINE_EVENT = 'DELETE_TIMELINE_EVENT',

  // Finance Actions
  ADD_ACCOUNT = 'ADD_ACCOUNT',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  ADD_TRANSACTION = 'ADD_TRANSACTION',
  DELETE_TRANSACTION = 'DELETE_TRANSACTION',
  ADD_LOAN = 'ADD_LOAN',
  UPDATE_LOAN = 'UPDATE_LOAN',
  DELETE_LOAN = 'DELETE_LOAN',
  RECORD_LOAN_PAYMENT = 'RECORD_LOAN_PAYMENT',
  ADD_INVESTMENT = 'ADD_INVESTMENT',
  DELETE_INVESTMENT = 'DELETE_INVESTMENT',
  RECORD_PROFIT = 'RECORD_PROFIT',

  // Quran Memorization Actions
  SET_QURAN_PROGRESS = 'SET_QURAN_PROGRESS',

  // Mind Map Actions
  ADD_MINDMAP = 'ADD_MINDMAP',
  UPDATE_MINDMAP = 'UPDATE_MINDMAP',
  DELETE_MINDMAP = 'DELETE_MINDMAP',
  UNDO_MINDMAP = 'UNDO_MINDMAP',
  REDO_MINDMAP = 'REDO_MINDMAP',

  // Habit Tracker Actions
  ADD_HABIT = 'ADD_HABIT',
  UPDATE_HABIT = 'UPDATE_HABIT',
  ARCHIVE_HABIT = 'ARCHIVE_HABIT',
  RESTORE_HABIT = 'RESTORE_HABIT',
  PERMANENTLY_DELETE_HABIT = 'PERMANENTLY_DELETE_HABIT',
  TOGGLE_HABIT_COMPLETION = 'TOGGLE_HABIT_COMPLETION',
  OPEN_HABIT_DETAIL = 'OPEN_HABIT_DETAIL',
  CLOSE_HABIT_DETAIL = 'CLOSE_HABIT_DETAIL',
  ADD_HABIT_NOTE = 'ADD_HABIT_NOTE',
  
  // Bookmark Actions
  ADD_BOOKMARK_FOLDER = 'ADD_BOOKMARK_FOLDER',
  UPDATE_BOOKMARK_FOLDER = 'UPDATE_BOOKMARK_FOLDER',
  DELETE_BOOKMARK_FOLDER = 'DELETE_BOOKMARK_FOLDER',
  ADD_BOOKMARK = 'ADD_BOOKMARK',
  UPDATE_BOOKMARK = 'UPDATE_BOOKMARK',
  DELETE_BOOKMARK = 'DELETE_BOOKMARK',
  REORDER_BOOKMARKS = 'REORDER_BOOKMARKS',

  // Settings Actions
  SAVE_SETTINGS = 'SAVE_SETTINGS',
  RESET_SETTINGS = 'RESET_SETTINGS',
  TOGGLE_AUTO_COLOR_CHANGE = 'TOGGLE_AUTO_COLOR_CHANGE',
  SET_AUTO_COLOR_CHANGE_INTERVAL = 'SET_AUTO_COLOR_CHANGE_INTERVAL',
}

export type AppAction =
  | { type: ActionType.AUTHENTICATE }
  | { type: ActionType.SET_PASSWORD; payload: string }
  | { type: ActionType.SET_THEME; payload: Theme }
  | { type: ActionType.SET_PRIMARY_COLOR; payload: PrimaryColor }
  | { type: ActionType.SET_TIME_TRACKER_WIDTH; payload: number }
  | { type: ActionType.SET_APP_VIEW_SCALE; payload: number }
  | { type: ActionType.SET_VIEW_MODE; payload: ViewMode }
  | { type: ActionType.ADD_BOARD; payload: { title: string } }
  | { type: ActionType.SWITCH_BOARD; payload: { boardId: string } }
  | { type: ActionType.DELETE_BOARD; payload: { boardId: string } }
  | { type: ActionType.MOVE_CARD; payload: { cardId: string; sourceListId: string; destListId: string; destIndex: number } }
  | { type: ActionType.MOVE_LIST; payload: { listId: string; destIndex: number } }
  | { type: ActionType.OPEN_CARD_MODAL; payload: { cardId: string; listId: string; } }
  | { type: ActionType.CLOSE_CARD_MODAL }
  | { type: ActionType.UPDATE_CARD; payload: { cardId: string; updates: Partial<Card> } }
  | { type: ActionType.SET_DRAGGING_CARD; payload: { cardId: string; listId: string } }
  | { type: ActionType.SET_DRAGGING_LIST; payload: { listId: string } }
  | { type: ActionType.CLEAR_DRAGGING }
  | { type: ActionType.ADD_CARD; payload: { listId: string; card: Card } }
  | { type: ActionType.DELETE_CARD; payload: { cardId: string; listId: string } }
  | { type: ActionType.RESTORE_CARD; payload: { cardId: string } }
  | { type: ActionType.PERMANENTLY_DELETE_CARD; payload: { cardId: string } }
  | { type: ActionType.EMPTY_TRASH }
  | { type: ActionType.PURGE_OLD_TRASHED_CARDS }
  | { type: ActionType.ADD_LIST; payload: { list: List } }
  | { type: ActionType.UPDATE_BOARD_TITLE; payload: string }
  | { type: ActionType.UPDATE_LIST_TITLE; payload: { listId: string; newTitle: string } }
  | { type: ActionType.TOGGLE_LIST_COLLAPSED; payload: { listId: string } }
  | { type: ActionType.ADD_LABEL; payload: { text: string; color: string } }
  | { type: ActionType.UPDATE_LABEL; payload: { labelId: string; updates: Partial<Omit<Label, 'id'>> } }
  | { type: ActionType.DELETE_LABEL; payload: { labelId: string } }
  | { type: ActionType.ADD_TODO; payload: Omit<DailyTodo, 'id' | 'isCompleted' | 'completedOn'> }
  | { type: ActionType.UPDATE_TODO; payload: { todoId: string; updates: Partial<Omit<DailyTodo, 'id'>> } }
  | { type: ActionType.TOGGLE_TODO; payload: { todoId: string; date: string } } // date is YYYY-MM-DD
  | { type: ActionType.DELETE_TODO; payload: string }
  | { type: ActionType.REORDER_TODOS; payload: { date: string; orderedIds: string[] } }
  | { type: ActionType.CLEAR_COMPLETED_TODOS; payload: { date: string } }
  | { type: ActionType.OPEN_TRASH_MODAL }
  | { type: ActionType.CLOSE_TRASH_MODAL }
  | { type: ActionType.TOGGLE_POMODORO_TIMER }
  | { type: ActionType.RESET_POMODORO_TIMER }
  | { type: ActionType.SET_POMODORO_MODE; payload: PomodoroMode }
  | { type: ActionType.SET_NEXT_POMODORO_MODE }
  | { type: ActionType.UPDATE_POMODORO_TIME }
  | { type: ActionType.TOGGLE_POMODORO_POPOVER }
  | { type: ActionType.CLOSE_POMODORO_POPOVER }
  | { type: ActionType.UPDATE_POMODORO_SETTINGS, payload: Partial<Omit<PomodoroState, 'mode' | 'timeRemaining' | 'isActive' | 'pomodorosCompleted' | 'isPopoverOpen' | 'initialTime' | 'currentTaskText'>> }
  | { type: ActionType.TOGGLE_POMODORO_COMPACT_VIEW }
  | { type: ActionType.SET_POMODORO_CURRENT_TASK; payload: string }
  | { type: ActionType.ADD_POMODORO_TASK; payload: { text: string } }
  | { type: ActionType.TOGGLE_POMODORO_TASK; payload: { taskId: string } }
  | { type: ActionType.DELETE_POMODORO_TASK; payload: { taskId: string } }
  | { type: ActionType.SET_ACTIVE_POMODORO_TASK; payload: { taskId: string | null } }
  | { type: ActionType.OPEN_VERSE_SELECTOR }
  | { type: ActionType.CLOSE_VERSE_SELECTOR }
  | { type: ActionType.SET_SELECTED_VERSE; payload: { surah: number; startAyah: number; endAyah: number; } | null }
  | { type: ActionType.SET_VERSE_INDEX; payload: number }
  | { type: ActionType.SET_SALAT_LOCATION; payload: { city: string; country: string; } }
  | { type: ActionType.SET_SALAT_TIMES; payload: { [key: string]: string; } }
  | { type: ActionType.ADD_NOTIFICATION; payload: Omit<Notification, 'id' | 'createdAt' | 'isRead'> }
  | { type: ActionType.MARK_NOTIFICATION_READ; payload: { notificationId: string } }
  | { type: ActionType.MARK_ALL_NOTIFICATIONS_READ }
  | { type: ActionType.OPEN_NOTIFICATIONS_MODAL }
  | { type: ActionType.CLOSE_NOTIFICATIONS_MODAL }
  | { type: ActionType.ADD_NOTEBOOK; payload: { name: string } }
  | { type: ActionType.UPDATE_NOTEBOOK; payload: { id: string, name: string } }
  | { type: ActionType.DELETE_NOTEBOOK; payload: { id: string } }
  | { type: ActionType.ADD_NOTE; payload: { notebookId: string, title?: string } }
  | { type: ActionType.UPDATE_NOTE; payload: { noteId: string, updates: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>> } }
  | { type: ActionType.TOGGLE_NOTE_PIN; payload: { noteId: string } }
  | { type: ActionType.ADD_AI_TAGS_TO_NOTE; payload: { noteId: string, tagNames: string[] } }
  | { type: ActionType.DELETE_NOTE; payload: { noteId: string } }
  | { type: ActionType.RESTORE_NOTE; payload: { noteId: string } }
  | { type: ActionType.PERMANENTLY_DELETE_NOTE; payload: { noteId: string } }
  | { type: ActionType.VIEW_NOTE; payload: { notebookId: string; noteId: string } }
  | { type: ActionType.CLEAR_NOTE_TO_VIEW }
  | { type: ActionType.ADD_TAG; payload: { name: string } }
  | { type: ActionType.UPDATE_TAG; payload: { id: string, name: string } }
  | { type: ActionType.DELETE_TAG; payload: { id: string } }
  | { type: ActionType.ADD_TIMELINE_EVENT; payload: Omit<TimelineEvent, 'id'> }
  | { type: ActionType.UPDATE_TIMELINE_EVENT; payload: TimelineEvent }
  | { type: ActionType.DELETE_TIMELINE_EVENT; payload: { id: string } }
  // Finance Actions
  | { type: ActionType.ADD_ACCOUNT; payload: Omit<Account, 'id' | 'currentBalance'> }
  | { type: ActionType.DELETE_ACCOUNT; payload: { id: string } }
  | { type: ActionType.ADD_TRANSACTION; payload: Omit<Transaction, 'id'> }
  | { type: ActionType.DELETE_TRANSACTION; payload: { id: string } }
  | { type: ActionType.ADD_LOAN; payload: Omit<Loan, 'id' | 'paidAmount' | 'payments'> }
  | { type: ActionType.UPDATE_LOAN; payload: { loanId: string; updates: Partial<Omit<Loan, 'id' | 'paidAmount' | 'payments'>> } }
  | { type: ActionType.DELETE_LOAN; payload: { id: string } }
  | { type: ActionType.RECORD_LOAN_PAYMENT; payload: { loanId: string; amount: number; date: string; accountId: string } }
  | { type: ActionType.ADD_INVESTMENT; payload: Omit<Investment, 'id' | 'profits'> }
  | { type: ActionType.DELETE_INVESTMENT; payload: { id: string } }
  | { type: ActionType.RECORD_PROFIT; payload: { investmentId: string; amount: number; date: string; accountId: string } }
  // Quran Memorization Actions
  | { type: ActionType.SET_QURAN_PROGRESS; payload: { surahNumber: number; memorizedAyahs: Set<number> } }
  // Mind Map Actions
  | { type: ActionType.ADD_MINDMAP; payload: { name: string } }
  | { type: ActionType.UPDATE_MINDMAP; payload: { id: string, updates: Partial<MindMapData> } }
  | { type: ActionType.DELETE_MINDMAP; payload: { id: string } }
  | { type: ActionType.UNDO_MINDMAP; payload: { id: string } }
  | { type: ActionType.REDO_MINDMAP; payload: { id: string } }
  // Habit Tracker Actions
  | { type: ActionType.ADD_HABIT; payload: Omit<Habit, 'id' | 'completions' | 'isArchived' | 'createdAt' | 'notes'> }
  | { type: ActionType.UPDATE_HABIT; payload: { habitId: string, updates: Partial<Habit> } }
  | { type: ActionType.ARCHIVE_HABIT; payload: { habitId: string } }
  | { type: ActionType.RESTORE_HABIT; payload: { habitId: string } }
  | { type: ActionType.PERMANENTLY_DELETE_HABIT; payload: { habitId: string } }
  | { type: ActionType.TOGGLE_HABIT_COMPLETION; payload: { habitId: string, date: string } }
  | { type: ActionType.OPEN_HABIT_DETAIL; payload: { habitId: string } }
  | { type: ActionType.CLOSE_HABIT_DETAIL }
  | { type: ActionType.ADD_HABIT_NOTE; payload: { habitId: string, date: string, text: string } }
  // Bookmark Actions
  | { type: ActionType.ADD_BOOKMARK_FOLDER; payload: { title: string } }
  | { type: ActionType.UPDATE_BOOKMARK_FOLDER; payload: { folderId: string; title: string } }
  | { type: ActionType.DELETE_BOOKMARK_FOLDER; payload: { folderId: string } }
  | { type: ActionType.ADD_BOOKMARK; payload: { folderId: string; bookmark: Bookmark } }
  | { type: ActionType.UPDATE_BOOKMARK; payload: { folderId: string; bookmarkId: string; updates: Partial<Bookmark> } }
  | { type: ActionType.DELETE_BOOKMARK; payload: { folderId: string; bookmarkId: string } }
  | { type: ActionType.REORDER_BOOKMARKS; payload: { folderId: string; draggedId: string; targetId: string | null } }
  // Settings Actions
  | { type: ActionType.SAVE_SETTINGS }
  | { type: ActionType.RESET_SETTINGS }
  | { type: ActionType.TOGGLE_AUTO_COLOR_CHANGE }
  | { type: ActionType.SET_AUTO_COLOR_CHANGE_INTERVAL; payload: number };