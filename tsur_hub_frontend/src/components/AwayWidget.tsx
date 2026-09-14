import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { EmployeeProfile } from '../types';

export const AwayWidget: React.FC = () => {
    const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAway = async () => {
            try {
                const res = await api.get('/profiles/widget/away');
                setProfiles(res.data);
            } catch (err) {
                console.error('Ошибка загрузки виджета', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAway();
    }, []);

    if (loading) {
        return <div className="bg-white dark:bg-navy-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-navy-700 animate-pulse h-32 transition-colors duration-200"></div>;
    }

    if (profiles.length === 0) {
        return (
            <div className="bg-white dark:bg-navy-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-navy-700 mb-6 transition-colors duration-200">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Где все?</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Вся команда сейчас на месте!</p>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-white dark:bg-navy-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-navy-700 mb-6 transition-colors duration-200">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Кто не в офисе</h2>
            <div className="space-y-3">
                {profiles.map(profile => {
                    const activeEvent = profile.events?.find(ev => {
                        if (!ev.event_date) return false;
                        const start = ev.event_date;
                        const end = ev.end_date || ev.event_date;
                        return start <= today && today <= end;
                    });

                    return (
                        <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-900/50 rounded-2xl border border-gray-100 dark:border-navy-600 hover:border-brand-100 dark:hover:border-brand-500/30 transition-colors duration-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-navy-700 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm overflow-hidden border border-brand-200 dark:border-navy-500 shadow-sm">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        profile.first_name[0]
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">{profile.first_name} {profile.last_name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{profile.department || profile.position || 'Сотрудник'}</div>
                                </div>
                            </div>
                            
                            {activeEvent && (
                                <div className="text-right">
                                    <div className="text-sm font-bold text-brand-600 dark:text-brand-400">
                                        {activeEvent.title}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                        до {activeEvent.end_date 
                                            ? activeEvent.end_date.split('-').reverse().join('.') 
                                            : activeEvent.event_date.split('-').reverse().join('.')}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};