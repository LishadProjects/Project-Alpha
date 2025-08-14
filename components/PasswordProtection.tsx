import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType } from '../types';
import { LockIcon } from './icons';

export const PasswordProtection: React.FC = () => {
  const { state, dispatch } = useAppContext();
  
  const [view, setView] = useState<'login' | 'confirmReset'>('login');
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (password === state.password) {
      dispatch({ type: ActionType.AUTHENTICATE });
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };
  
  const handleResetApp = () => {
      // This action clears localStorage and reloads the page.
      dispatch({ type: ActionType.RESET_SETTINGS });
  };

  const renderLoginView = () => (
    <>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Project Access</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Please enter the password to continue.</p>
      {successMessage && <p className="text-sm text-green-500 mb-4">{successMessage}</p>}
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-primary-500 focus:outline-none transition"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold">
          Unlock
        </button>
      </form>
      <div className="mt-6 text-center">
        <button onClick={() => { setView('confirmReset'); setError(''); setPassword(''); }} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            Forgot Password?
        </button>
      </div>
    </>
  );

  const renderConfirmResetView = () => (
    <>
      <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Reset Application?</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        There is no password recovery. You can reset the application, but this will <strong className="font-bold">permanently delete all your data</strong>. This action cannot be undone.
      </p>
      <div className="space-y-3">
        <button onClick={handleResetApp} className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
            Yes, Reset and Delete All Data
        </button>
        <button onClick={() => setView('login')} className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition font-semibold">
            Cancel
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 h-screen w-screen flex items-center justify-center font-sans">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl text-center">
        <LockIcon className="w-16 h-16 mx-auto mb-4 text-primary-500" />
        {view === 'login' && renderLoginView()}
        {view === 'confirmReset' && renderConfirmResetView()}
      </div>
    </div>
  );
};
