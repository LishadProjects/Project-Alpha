
import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Account, ActionType, Loan, Transaction, Investment, FinanceViewTab } from '../types';
import { WalletIcon, LandmarkIcon, SmartphoneIcon, TrendingUpIcon, TrendingDownIcon, PlusIcon, Trash2Icon, HandshakeIcon, PrinterIcon, EditIcon } from './icons';

const toYMD = (date: Date): string => date.toISOString().split('T')[0];

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount); // Using USD as a placeholder

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex-1">
        <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
    </div>
);

const AccountIcon: React.FC<{ type: Account['type'], className?: string }> = ({ type, className }) => {
    switch (type) {
        case 'bank': return <LandmarkIcon className={className} />;
        case 'mobile': return <SmartphoneIcon className={className} />;
        case 'wallet':
        default: return <WalletIcon className={className} />;
    }
};

export const FinanceView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [activeTab, setActiveTab] = useState<FinanceViewTab>('overview');

    const handlePrint = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const startDate = formData.get('start-date') as string;
        const endDate = formData.get('end-date') as string;

        if (!startDate || !endDate) {
            alert("Please select a valid date range.");
            return;
        }

        const printContent = document.getElementById('print-statement-content');
        if (printContent) {
            const transactionsInRange = state.transactions
                .filter(t => t.date >= startDate && t.date <= endDate)
                .sort((a,b) => a.date.localeCompare(b.date));

            let html = `
                <style>
                    body { font-family: sans-serif; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .income { color: green; }
                    .expense { color: red; }
                </style>
                <h2>Financial Statement</h2>
                <p><strong>From:</strong> ${startDate} <strong>To:</strong> ${endDate}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            transactionsInRange.forEach(t => {
                html += `
                    <tr>
                        <td>${t.date}</td>
                        <td>${t.description}</td>
                        <td>${t.category}</td>
                        <td class="${t.type}">${formatCurrency(t.amount)}</td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            printContent.innerHTML = html;
        }

        document.body.classList.add('printing');
        window.print();
        document.body.classList.remove('printing');
    };

    // --- Memoized Calculations ---
    const financialStats = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        state.transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                if (t.type === 'income') monthlyIncome += t.amount;
                else monthlyExpenses += t.amount;
            }
        });
        
        const totalBalance = state.accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

        return {
            totalBalance,
            monthlyIncome,
            monthlyExpenses,
            monthlyProfit: monthlyIncome - monthlyExpenses
        };
    }, [state.accounts, state.transactions]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'transactions': return <TransactionsTab />;
            case 'accounts': return <AccountsTab />;
            case 'loans': return <LoansTab />;
            case 'investments': return <InvestmentsTab />;
            case 'reports': 
                 return (
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">Generate Report</h2>
                        <form onSubmit={handlePrint} className="max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                             <div>
                                <label className="text-sm font-medium">Start Date</label>
                                <input type="date" name="start-date" required defaultValue={toYMD(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))} className="w-full mt-1 p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                            </div>
                            <div>
                                <label className="text-sm font-medium">End Date</label>
                                <input type="date" name="end-date" required defaultValue={toYMD(new Date())} className="w-full mt-1 p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                            </div>
                            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                                <PrinterIcon className="w-5 h-5"/> Print Statement
                            </button>
                        </form>
                        <div id="print-statement-content" className="print-container"></div>
                    </div>
                );
            case 'overview':
            default:
                return (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                             <StatCard title="Total Balance" value={formatCurrency(financialStats.totalBalance)} color="text-primary-500" />
                             <StatCard title="This Month's Income" value={formatCurrency(financialStats.monthlyIncome)} color="text-green-500" />
                             <StatCard title="This Month's Expenses" value={formatCurrency(financialStats.monthlyExpenses)} color="text-red-500" />
                             <StatCard title="This Month's Profit" value={formatCurrency(financialStats.monthlyProfit)} color="text-yellow-500" />
                        </div>
                        <TransactionForm />
                    </div>
                );
        }
    };
    
    return (
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <nav className="px-4 flex space-x-4">
                    {(['overview', 'transactions', 'accounts', 'loans', 'investments', 'reports'] as FinanceViewTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-3 text-sm font-semibold capitalize transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderTabContent()}
            </div>
        </div>
    );
};


// Sub-components for each tab to keep FinanceView clean
const TransactionForm: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(toYMD(new Date()));
    const [accountId, setAccountId] = useState(state.accounts[0]?.id || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !accountId) {
            alert('Please fill all required fields.');
            return;
        }
        dispatch({
            type: ActionType.ADD_TRANSACTION,
            payload: { amount: parseFloat(amount), description, type, category, date, accountId }
        });
        setAmount('');
        setDescription('');
        setCategory('');
    };
    
    if (state.accounts.length === 0) {
        return <div className="p-6 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg">Please create an account first to add transactions.</div>
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4">Add New Transaction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Groceries" required className="w-full mt-1 p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                </div>
                <div>
                    <label className="text-sm font-medium">Amount</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required step="0.01" className="w-full mt-1 p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                </div>
                 <div>
                    <label className="text-sm font-medium">Account</label>
                    <select value={accountId} onChange={e => setAccountId(e.target.value)} required className="w-full mt-1 p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                        {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
                 <div className="flex items-end">
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                        <PlusIcon className="w-5 h-5"/> Add
                    </button>
                </div>
            </div>
        </form>
    );
};

const TransactionsTab: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const sortedTransactions = useMemo(() => [...state.transactions].sort((a,b) => b.date.localeCompare(a.date)), [state.transactions]);
    const getAccountName = (id: string) => state.accounts.find(a => a.id === id)?.name || 'Unknown';
    
    return (
        <div className="p-6">
            <TransactionForm />
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">Description</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Account</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Delete</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {sortedTransactions.map(t => (
                                    <tr key={t.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">{t.description}</td>
                                        <td className={`whitespace-nowrap px-3 py-4 text-sm ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(t.amount)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{getAccountName(t.accountId)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{t.date}</td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                            <button onClick={() => dispatch({ type: ActionType.DELETE_TRANSACTION, payload: { id: t.id }})} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"><Trash2Icon className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AccountsTab: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [name, setName] = useState('');
    const [type, setType] = useState<Account['type']>('wallet');
    const [initialBalance, setInitialBalance] = useState('');
    const [creationDate, setCreationDate] = useState(toYMD(new Date()));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: ActionType.ADD_ACCOUNT, payload: { name, type, initialBalance: parseFloat(initialBalance) || 0, creationDate }});
        setName(''); setType('wallet'); setInitialBalance(''); setCreationDate(toYMD(new Date()));
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleSubmit} className="md:col-span-1 p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4 h-fit">
                <h3 className="text-lg font-bold">Create Account</h3>
                <div>
                    <label className="text-sm font-medium">Account Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Savings" required className="w-full mt-1 p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                </div>
                 <div>
                    <label className="text-sm font-medium">Account Type</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="w-full mt-1 p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                        <option value="wallet">Wallet</option>
                        <option value="bank">Bank</option>
                        <option value="mobile">Mobile Banking</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium">Initial Balance</label>
                    <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="0.00" required step="0.01" className="w-full mt-1 p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                </div>
                <div>
                    <label className="text-sm font-medium">Creation Date</label>
                    <input type="date" value={creationDate} onChange={e => setCreationDate(e.target.value)} required className="w-full mt-1 p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"><PlusIcon className="w-5 h-5"/> Create</button>
            </form>
            <div className="md:col-span-2 space-y-4">
                {state.accounts.map(acc => (
                    <div key={acc.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <AccountIcon type={acc.type} className="w-6 h-6 text-primary-500" />
                            <div>
                                <h4 className="font-bold">{acc.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{acc.type} &middot; Opened: {acc.creationDate}</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-lg">{formatCurrency(acc.currentBalance)}</p>
                           <button onClick={() => dispatch({ type: ActionType.DELETE_ACCOUNT, payload: { id: acc.id }})} className="text-red-500/50 hover:text-red-500 text-xs mt-1">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LoansTab: React.FC = () => {
    const { state, dispatch } = useAppContext();
    
    // Form state for adding a new loan
    const [person, setPerson] = useState('');
    const [type, setType] = useState<'lent' | 'borrowed'>('lent');
    const [amount, setAmount] = useState('');
    const [startDate, setStartDate] = useState(toYMD(new Date()));
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({
            type: ActionType.ADD_LOAN,
            payload: {
                person,
                type,
                initialAmount: parseFloat(amount),
                startDate,
                dueDate
            }
        });
        setPerson('');
        setAmount('');
    };
    
    // Component for a single loan item, to manage its own payment form state
    const LoanItem: React.FC<{ loan: Loan }> = ({ loan }) => {
        const { state, dispatch } = useAppContext();
        const [isEditing, setIsEditing] = useState(false);
        
        // Edit form state
        const [editedPerson, setEditedPerson] = useState(loan.person);
        const [editedType, setEditedType] = useState(loan.type);
        const [editedAmount, setEditedAmount] = useState(loan.initialAmount.toString());
        const [editedStartDate, setEditedStartDate] = useState(loan.startDate);
        const [editedDueDate, setEditedDueDate] = useState(loan.dueDate || '');

        // Payment form state
        const [paymentAmount, setPaymentAmount] = useState('');
        const [paymentDate, setPaymentDate] = useState(toYMD(new Date()));
        const [paymentAccountId, setPaymentAccountId] = useState(state.accounts[0]?.id || '');
        
        const progress = (loan.paidAmount / loan.initialAmount) * 100;

        const handleEditSave = (e: React.FormEvent) => {
            e.preventDefault();
            const newAmount = parseFloat(editedAmount);
            if (newAmount < loan.paidAmount) {
                alert(`Cannot set initial amount less than already paid amount of ${formatCurrency(loan.paidAmount)}`);
                return;
            }
            dispatch({
                type: ActionType.UPDATE_LOAN,
                payload: {
                    loanId: loan.id,
                    updates: {
                        person: editedPerson.trim(),
                        type: editedType,
                        initialAmount: newAmount,
                        startDate: editedStartDate,
                        dueDate: editedDueDate || undefined,
                    }
                }
            });
            setIsEditing(false);
        };

        const handleCancelEdit = () => {
            setEditedPerson(loan.person);
            setEditedType(loan.type);
            setEditedAmount(loan.initialAmount.toString());
            setEditedStartDate(loan.startDate);
            setEditedDueDate(loan.dueDate || '');
            setIsEditing(false);
        };

        const handleRecordPayment = (e: React.FormEvent) => {
            e.preventDefault();
            if (!paymentAmount || !paymentAccountId) {
                alert("Please enter an amount and select an account.");
                return;
            }
            dispatch({
                type: ActionType.RECORD_LOAN_PAYMENT,
                payload: {
                    loanId: loan.id,
                    amount: parseFloat(paymentAmount),
                    date: paymentDate,
                    accountId: paymentAccountId,
                }
            });
            setPaymentAmount('');
        };
        
        if (isEditing) {
            return (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
                   <form onSubmit={handleEditSave} className="space-y-3">
                       <h4 className="text-lg font-bold mb-2">Editing Loan</h4>
                       <input type="text" value={editedPerson} onChange={e => setEditedPerson(e.target.value)} placeholder="Person's Name" required className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                       <select value={editedType} onChange={e => setEditedType(e.target.value as any)} className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                           <option value="lent">I Lent Money</option>
                           <option value="borrowed">I Borrowed Money</option>
                       </select>
                       <input type="number" value={editedAmount} onChange={e => setEditedAmount(e.target.value)} placeholder="Amount" required className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                       <div><label className="text-xs">Start Date</label><input type="date" value={editedStartDate} onChange={e => setEditedStartDate(e.target.value)} required className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/></div>
                       <div><label className="text-xs">Due Date</label><input type="date" value={editedDueDate} onChange={e => setEditedDueDate(e.target.value)} className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/></div>
                       <div className="flex gap-2 justify-end pt-2">
                           <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                           <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">Save Changes</button>
                       </div>
                   </form>
               </div>
            )
        }

        return (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{loan.type === 'lent' ? 'Lent to' : 'Borrowed from'}</p>
                        <h4 className="font-bold text-lg">{loan.person}</h4>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="text-right">
                            <p className="font-bold text-xl">{formatCurrency(loan.initialAmount)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Due: {loan.dueDate || 'N/A'}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                             <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" aria-label="Edit loan"><EditIcon className="w-4 h-4" /></button>
                             <button onClick={() => dispatch({type: ActionType.DELETE_LOAN, payload: { id: loan.id }})} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full" aria-label="Delete loan"><Trash2Icon className="w-4 h-4"/></button>
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between text-sm font-medium">
                        <span>Paid: {formatCurrency(loan.paidAmount)}</span>
                        <span className="text-red-500">Due: {formatCurrency(loan.initialAmount - loan.paidAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <form onSubmit={handleRecordPayment} className="mt-4 grid grid-cols-4 gap-2 items-end">
                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Amount" className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                    <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                    <select value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)} className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                         {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                    <button type="submit" className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">Record</button>
                </form>
            </div>
        )
    };

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleSubmit} className="md:col-span-1 p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4 h-fit">
                <h3 className="text-lg font-bold">Add New Loan</h3>
                 <input type="text" value={person} onChange={e => setPerson(e.target.value)} placeholder="Person's Name" required className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                 <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                    <option value="lent">I Lent Money</option>
                    <option value="borrowed">I Borrowed Money</option>
                 </select>
                 <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" required className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                 <div><label className="text-xs">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/></div>
                 <div><label className="text-xs">Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/></div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"><PlusIcon className="w-5 h-5"/> Add Loan</button>
            </form>
            <div className="md:col-span-2 space-y-4">
                {state.loans.map(loan => <LoanItem key={loan.id} loan={loan} />)}
            </div>
        </div>
    );
};

const InvestmentsTab: React.FC = () => {
    const { state, dispatch } = useAppContext();
    
    // New investment form state
    const [name, setName] = useState('');
    const [initialAmount, setInitialAmount] = useState('');
    const [startDate, setStartDate] = useState(toYMD(new Date()));
    const [profitType, setProfitType] = useState<Investment['profitType']>('monthly');
    const [endDate, setEndDate] = useState('');
    const [returnRate, setReturnRate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({
            type: ActionType.ADD_INVESTMENT,
            payload: {
                name,
                initialAmount: parseFloat(initialAmount),
                startDate,
                profitType,
                endDate: endDate || undefined,
                expectedReturnRate: returnRate ? parseFloat(returnRate) : undefined,
            }
        });
        // Reset form
        setName(''); setInitialAmount('');
    };

    const InvestmentItem: React.FC<{ investment: Investment }> = ({ investment }) => {
        const [profitAmount, setProfitAmount] = useState('');
        const [profitDate, setProfitDate] = useState(toYMD(new Date()));
        const [profitAccountId, setProfitAccountId] = useState(state.accounts[0]?.id || '');
        
        const totalProfit = useMemo(() => investment.profits.reduce((sum, p) => sum + p.amount, 0), [investment.profits]);
        const roi = investment.initialAmount > 0 ? (totalProfit / investment.initialAmount) * 100 : 0;

        const handleRecordProfit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!profitAmount || !profitAccountId) return;
            dispatch({
                type: ActionType.RECORD_PROFIT,
                payload: {
                    investmentId: investment.id,
                    amount: parseFloat(profitAmount),
                    date: profitDate,
                    accountId: profitAccountId
                }
            });
            setProfitAmount('');
        };
        
        return (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                 <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg">{investment.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Invested on: {investment.startDate}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-gray-500 dark:text-gray-400">Principal</p>
                        <p className="font-bold text-xl">{formatCurrency(investment.initialAmount)}</p>
                    </div>
                 </div>
                 <div className="mt-4 grid grid-cols-2 gap-4">
                     <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                         <p className="text-sm text-green-800 dark:text-green-300">Total Profit</p>
                         <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalProfit)}</p>
                     </div>
                     <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                         <p className="text-sm text-blue-800 dark:text-blue-300">Return on Investment (ROI)</p>
                         <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{roi.toFixed(2)}%</p>
                     </div>
                 </div>
                 <form onSubmit={handleRecordProfit} className="mt-4 grid grid-cols-4 gap-2 items-end">
                    <input type="number" value={profitAmount} onChange={e => setProfitAmount(e.target.value)} placeholder="Profit Amount" className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                    <input type="date" value={profitDate} onChange={e => setProfitDate(e.target.value)} className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"/>
                    <select value={profitAccountId} onChange={e => setProfitAccountId(e.target.value)} className="w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                         {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                    <button type="submit" className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">Record</button>
                 </form>
            </div>
        );
    };

    return (
         <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={handleSubmit} className="md:col-span-1 p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4 h-fit">
                <h3 className="text-lg font-bold">Add New Investment</h3>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Investment Name (e.g., Stock)" required className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border"/>
                <input type="number" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} placeholder="Initial Amount" required className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border"/>
                <select value={profitType} onChange={e => setProfitType(e.target.value as any)} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border">
                    <option value="monthly">Monthly Profit</option>
                    <option value="yearly">Yearly Profit</option>
                    <option value="on-maturity">Profit on Maturity</option>
                </select>
                <div><label className="text-xs">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border"/></div>
                <div><label className="text-xs">End Date (Optional)</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border"/></div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"><PlusIcon className="w-5 h-5"/> Add Investment</button>
            </form>
            <div className="md:col-span-2 space-y-4">
                {state.investments.map(inv => <InvestmentItem key={inv.id} investment={inv} />)}
            </div>
         </div>
    );
};
