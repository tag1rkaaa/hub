import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { EmployeeProfile } from '../types';
import { Link } from 'react-router-dom';

export const TeamWidgets: React.FC = () => {
    const [birthdays, setBirthdays] = useState<EmployeeProfile[]>([]);
    const [newHires, setNewHires] = useState<EmployeeProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWidgets = async () => {
            try {
                const [bdayRes, newHiresRes] = await Promise.all([
                    api.get('/profiles/widget/birthdays'),
                    api.get('/profiles/widget/new-hires')
                ]);
                setBirthdays(bdayRes.data);
                setNewHires(newHiresRes.data);
            } catch (err) {
                console.error("Ошибка загрузки виджетов", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWidgets();
    }, []);

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    };

    if (loading) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* ВИДЖЕТ ДНЕЙ РОЖДЕНИЙ */}
            <div className="bg-white dark:bg-navy-800 rounded-2xl p-6 border border-gray-100 dark:border-navy-700 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    Ближайшие дни рождения
                </h3>
                {birthdays.length > 0 ? (
                    <div className="space-y-4">
                        {birthdays.map(p => (
                            <Link to={`/profile/${p.id}`} key={p.id} className="flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-navy-900/50 p-2 rounded-xl transition">
                                <img 
                                    src={p.avatar_url || 'https://via.placeholder.com/150'} 
                                    className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-navy-600"
                                    alt="avatar"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{p.first_name} {p.last_name}</div>
                                    <div className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                                        {p.birth_date ? formatDate(p.birth_date) : ''}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">В ближайшее время праздников нет.</p>
                )}
            </div>

            {/* ВИДЖЕТ НОВИЧКОВ */}
            <div className="bg-white dark:bg-navy-800 rounded-2xl p-6 border border-gray-100 dark:border-navy-700 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    Новые сотрудники
                </h3>
                {newHires.length > 0 ? (
                    <div className="space-y-4">
                        {newHires.map(p => (
                            <Link to={`/profile/${p.id}`} key={p.id} className="flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-navy-900/50 p-2 rounded-xl transition">
                                <img 
                                    src={p.avatar_url || 'https://via.placeholder.com/150'} 
                                    className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-navy-600"
                                    alt="avatar"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{p.first_name} {p.last_name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{p.position || p.department || 'Должность не указана'}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">За последний месяц пополнений не было.</p>
                )}
            </div>
        </div>
    );
};