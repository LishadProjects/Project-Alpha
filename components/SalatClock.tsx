
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ActionType } from '../types';
import { LandmarkIcon, LoaderIcon } from './icons';

const PRAYER_NAMES: { [key: string]: string } = {
    Fajr: 'Fajr',
    Dhuhr: 'Zohar',
    Asr: 'Asar',
    Maghrib: 'Magrib',
    Isha: 'Esha',
};

export const SalatClock: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [locationInput, setLocationInput] = useState(`${state.salatLocation.city}, ${state.salatLocation.country}`);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSalatTimes = async () => {
            setIsLoading(true);
            setError(null);
            const { city, country } = state.salatLocation;
            try {
                const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`);
                if (!response.ok) {
                    throw new Error(`Could not find location. Please check the spelling.`);
                }
                const data = await response.json();
                if (data.code === 200) {
                    dispatch({ type: ActionType.SET_SALAT_TIMES, payload: data.data.timings });
                } else {
                    throw new Error(data.data || 'Failed to fetch prayer times.');
                }
            } catch (e: any) {
                setError(e.message);
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        if (state.salatLocation.city && state.salatLocation.country) {
            fetchSalatTimes();
        }
    }, [state.salatLocation, dispatch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsPopoverOpen(false);
                setIsEditing(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLocationSave = () => {
        const parts = locationInput.split(',').map(p => p.trim());
        if (parts.length >= 2) {
            const city = parts[0];
            const country = parts.slice(1).join(', ');
            dispatch({ type: ActionType.SET_SALAT_LOCATION, payload: { city, country } });
        } else {
            setError("Please enter format: City, Country");
            setLocationInput(`${state.salatLocation.city}, ${state.salatLocation.country}`);
        }
        setIsEditing(false);
    };

    const nextPrayer = useMemo(() => {
        if (!state.salatTimes || Object.keys(state.salatTimes).length === 0) return null;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const prayers = Object.entries(state.salatTimes)
            .filter(([name]) => PRAYER_NAMES[name])
            .map(([name, time]) => {
                const [h, m] = time.split(':').map(Number);
                return { name, time, totalMinutes: h * 60 + m };
            })
            .sort((a, b) => a.totalMinutes - b.totalMinutes);

        let next = prayers.find(p => p.totalMinutes > currentTime);
        if (!next) {
            next = prayers[0]; // If all prayers for today have passed, show Fajr for tomorrow
        }
        return next;
    }, [state.salatTimes]);

    return (
        <div ref={popoverRef} className="relative">
            <button
                onClick={() => setIsPopoverOpen(p => !p)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Salat Times"
            >
                <LandmarkIcon className="w-5 h-5" />
            </button>
            {isPopoverOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-700 p-3">
                    {isEditing ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleLocationSave(); }}>
                            <input
                                type="text"
                                value={locationInput}
                                onChange={e => setLocationInput(e.target.value)}
                                autoFocus
                                onBlur={handleLocationSave}
                                className="w-full text-sm p-1.5 rounded bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                        </form>
                    ) : (
                        <div onClick={() => setIsEditing(true)} className="cursor-pointer mb-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-semibold">{state.salatLocation.city}, {state.salatLocation.country}</p>
                        </div>
                    )}
                    <hr className="my-2 border-gray-200 dark:border-gray-600" />
                    {isLoading ? (
                        <div className="flex items-center justify-center p-4"><LoaderIcon className="w-6 h-6 animate-spin" /></div>
                    ) : error ? (
                        <p className="text-sm text-red-500">{error}</p>
                    ) : (
                        <ul className="space-y-1">
                            {Object.entries(PRAYER_NAMES).map(([key, name]) => (
                                <li key={key} className={`flex justify-between items-center text-sm p-1 rounded ${nextPrayer?.name === key ? 'bg-primary-100 dark:bg-primary-900/50 font-bold' : ''}`}>
                                    <span>{name}</span>
                                    <span className="font-mono">{state.salatTimes[key]}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};
