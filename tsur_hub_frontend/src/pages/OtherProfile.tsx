import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { EmployeeProfile, EmployeeLink } from '../types';

export const OtherProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [links, setLinks] = useState<EmployeeLink[]>([]);
    
    const [activeTab, setActiveTab] = useState<'profile' | 'links'>('profile');
    const [isLocked, setIsLocked] = useState(true);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    // Состояния для админ-модалок
    const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    
    // Данные форм админа
    const [achievementData, setAchievementData] = useState({ title: '', year: new Date().getFullYear(), color_theme: 'blue' });
    const [eventData, setEventData] = useState({ title: '', event_date: '', event_time: '', format: '' });

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/profiles/${id}`);
            setProfile(res.data);
            fetchLinks();

            const meRes = await api.get('/profiles/me');
            if (meRes.data && meRes.data.is_admin) {
                setIsAdmin(true);
            }
        } catch (error) {
            console.error("Ошибка при загрузке профиля", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLinks = async (token?: string) => {
        try {
            const config = token ? { headers: { 'X-Unlock-Token': token } } : {};
            const res = await api.get(`/profiles/${id}/links`, config);
            setLinks(res.data);
            setIsLocked(false);
        } catch {
            setIsLocked(true);
        }
    };

    useEffect(() => { loadProfile(); }, [id]);

    const handleUnlock = async () => {
        try {
            const res = await api.post(`/profiles/${id}/unlock`, { pin });
            const token = res.data.unlock_token;
            setIsPinModalOpen(false);
            setPin('');
            fetchLinks(token);
        } catch {
            alert('Неверный PIN-код');
        }
    };

    // --- ФУНКЦИИ АДМИНА ---
    const handleAddAchievement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/profiles/${id}/achievements/direct`, achievementData);
            setIsAchievementModalOpen(false);
            setAchievementData({ title: '', year: new Date().getFullYear(), color_theme: 'blue' });
            loadProfile();
        } catch (err) {
            alert("Ошибка при добавлении достижения");
        }
    };

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/profiles/${id}/events/direct`, eventData);
            setIsEventModalOpen(false);
            setEventData({ title: '', event_date: '', event_time: '', format: '' });
            loadProfile();
        } catch (err) {
            alert("Ошибка при добавлении события");
        }
    };

    const handleDeleteProfile = async () => {
        const isConfirmed = window.confirm("Вы уверены, что хотите удалить этот профиль? Это действие нельзя отменить.");
        if (!isConfirmed) return;

        try {
            await api.delete(`/profiles/${id}`);
            alert("Профиль успешно удален");
            navigate('/team');
        } catch (err) {
            alert("Ошибка при удалении профиля. Возможно, эндпоинт еще не создан на бэкенде.");
        }
    };

    const calculateTenure = (hireDateStr?: string) => {
        if (!hireDateStr) return 'Стаж не указан';
        const hireDate = new Date(hireDateStr);
        const now = new Date();
        let years = now.getFullYear() - hireDate.getFullYear();
        let months = now.getMonth() - hireDate.getMonth();
        if (months < 0) { years--; months += 12; }
        if (years === 0 && months === 0) return 'Менее месяца';
        return `${years > 0 ? years + ' г. ' : ''}${months > 0 ? months + ' мес.' : ''}`;
    };

    if (loading || !profile) return <div className="text-center py-20 text-gray-400 dark:text-gray-500">Загрузка профиля...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-12 transition-colors duration-200">
            {/* ШАПКА ПРОФИЛЯ */}
            <div className="bg-white dark:bg-navy-800 rounded-b-3xl shadow-sm overflow-hidden mb-6 border border-gray-100 dark:border-navy-700 transition-colors duration-200">
                <div 
                    className="h-48 bg-gradient-to-r from-brand-600 to-brand-800 dark:from-navy-700 dark:to-navy-900 w-full relative transition-colors duration-200"
                    style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: 'cover' } : {}}
                ></div>
                
                <div className="px-8 pb-6 relative">
                    <div className="flex justify-between items-end -mt-12 mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-navy-800 shadow-md overflow-hidden flex items-center justify-center text-3xl font-bold text-brand-300 dark:text-brand-500 bg-brand-50 dark:bg-navy-900 transition-colors">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                profile.first_name[0] + profile.last_name[0]
                            )}
                        </div>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.first_name} {profile.last_name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-gray-600 dark:text-gray-400 font-medium">{profile.position || 'Должность не указана'}</p>
                            {profile.status && (
                                <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-full border border-brand-100 dark:border-brand-800/50">
                                    {profile.status}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex border-t border-gray-100 dark:border-navy-700 px-8 gap-8 transition-colors duration-200">
                    {['profile', 'links'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                            }`}
                        >
                            {tab === 'profile' && 'О сотруднике'}
                            {tab === 'links' && 'Рабочие ссылки'}
                        </button>
                    ))}
                </div>
            </div>

            {/* КОНТЕНТ ВКЛАДОК */}
            <div className="px-4">
                
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 hover:shadow-md transition-all duration-200">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">Информация</h2>
                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Отдел</span><span className="font-medium text-gray-900 dark:text-white">{profile.department || '—'}</span></div>
                                    <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Город</span><span className="font-medium text-gray-900 dark:text-white">{profile.city || '—'}</span></div>
                                    <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Стаж работы</span><span className="font-medium text-gray-900 dark:text-white">{calculateTenure(profile.hire_date)}</span></div>
                                    <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Тип занятости</span><span className="font-medium text-gray-900 dark:text-white">{profile.employment_type || '—'}</span></div>
                                    
                                    {/* Добавленные поля */}
                                    <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Стол</span><span className="font-medium text-gray-900 dark:text-white">{profile.desk || 'Не указан'}</span></div>
                                    <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Организация</span><span className="font-medium text-gray-900 dark:text-white">{profile.organization || 'ЦУР РБ'}</span></div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 hover:shadow-md transition-all duration-200">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">Достижения</h2>
                                {profile.achievements && profile.achievements.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {profile.achievements.map(a => (
                                            <div key={a.id} className={`px-4 py-2 rounded-xl border border-${a.color_theme}-200 dark:border-${a.color_theme}-800/50 bg-${a.color_theme}-50 dark:bg-${a.color_theme}-900/20 text-${a.color_theme}-700 dark:text-${a.color_theme}-400 flex items-center gap-2 shadow-sm`}>
                                                <span className="font-medium">{a.title}</span>
                                                <span className="text-xs opacity-60 font-bold">{a.year}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">Достижений пока нет.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 hover:shadow-md transition-all duration-200">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">События</h2>
                                {profile.events && profile.events.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.events.map(ev => (
                                            <div key={ev.id} className="p-3 bg-brand-50/50 dark:bg-navy-900/50 rounded-xl border border-brand-100 dark:border-navy-600 transition-colors">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{ev.title}</div>
                                                <div className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1">{ev.event_date} {ev.event_time ? `• ${ev.event_time}` : ''} {ev.format ? `• ${ev.format}` : ''}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">Событий не запланировано.</p>
                                )}
                            </div>

                            {/* ПАНЕЛЬ АДМИНИСТРАТОРА */}
                            {isAdmin && (
                                <div className="p-6 bg-brand-50 dark:bg-navy-900/60 border border-brand-100 dark:border-navy-700 rounded-2xl shadow-sm transition-colors duration-200">
                                    <h2 className="text-sm font-bold text-brand-800 dark:text-brand-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                        Управление профилем
                                    </h2>
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => setIsAchievementModalOpen(true)}
                                            className="w-full text-center px-4 py-2 bg-white dark:bg-navy-800 text-brand-700 dark:text-brand-300 rounded-xl hover:bg-brand-600 dark:hover:bg-brand-600 hover:text-white transition-colors border border-brand-200 dark:border-navy-600 font-medium shadow-sm"
                                        >
                                            Выдать достижение
                                        </button>
                                        <button 
                                            onClick={() => setIsEventModalOpen(true)}
                                            className="w-full text-center px-4 py-2 bg-white dark:bg-navy-800 text-brand-700 dark:text-brand-300 rounded-xl hover:bg-brand-600 dark:hover:bg-brand-600 hover:text-white transition-colors border border-brand-200 dark:border-navy-600 font-medium shadow-sm"
                                        >
                                            Добавить событие
                                        </button>
                                        
                                        <div className="h-px bg-brand-200/50 dark:bg-navy-700 my-1"></div>
                                        
                                        <button 
                                            onClick={handleDeleteProfile}
                                            className="w-full text-center px-4 py-2 bg-white dark:bg-navy-800 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-colors border border-gray-200 dark:border-navy-600 font-medium shadow-sm"
                                        >
                                            Удалить профиль
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 transition-colors duration-200">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">Рабочие ссылки</h2>
                        {isLocked ? (
                            <div className="p-10 bg-gray-50 dark:bg-navy-900/50 rounded-2xl text-center border border-gray-100 dark:border-navy-700 transition-colors">
                                <p className="mb-6 text-gray-600 dark:text-gray-300 font-medium">Ссылки защищены PIN-кодом сотрудника</p>
                                <button onClick={() => setIsPinModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl transition shadow-sm font-medium">
                                    Ввести PIN
                                </button>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {links.map(l => (
                                    <li key={l.id} className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl flex items-center border border-gray-100 dark:border-navy-700 hover:border-brand-200 dark:hover:border-brand-500/50 transition">
                                        <a href={l.url} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-medium">{l.title}</a>
                                    </li>
                                ))}
                                {links.length === 0 && <p className="text-gray-500 dark:text-gray-400">Ссылки отсутствуют.</p>}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* --- МОДАЛЬНЫЕ ОКНА --- */}

            {/* 1. Модалка PIN-кода */}
            {isPinModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 dark:bg-navy-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors">
                    <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl min-w-[320px] shadow-xl border border-gray-100 dark:border-navy-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Доступ к ссылкам</h2>
                        <input 
                            type="password" 
                            placeholder="Введите PIN-код"
                            value={pin} 
                            onChange={e => setPin(e.target.value)} 
                            className="w-full border border-gray-200 dark:border-navy-600 p-3 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-navy-900 dark:text-white" 
                            autoFocus 
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => {setIsPinModalOpen(false); setPin('');}} className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-xl font-medium transition">Отмена</button>
                            <button onClick={handleUnlock} className="bg-brand-600 text-white px-5 py-2 rounded-xl hover:bg-brand-700 font-medium transition shadow-sm">Подтвердить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Модалка Добавления Достижения (Админ) */}
            {isAchievementModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 dark:bg-navy-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors">
                    <form onSubmit={handleAddAchievement} className="bg-white dark:bg-navy-800 p-6 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-navy-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Выдать достижение</h2>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название (например: Сотрудник года)</label>
                                <input required type="text" value={achievementData.title} onChange={e => setAchievementData({...achievementData, title: e.target.value})} className="w-full border border-gray-200 dark:border-navy-600 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-navy-900 dark:text-white" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Год</label>
                                    <input required type="number" value={achievementData.year} onChange={e => setAchievementData({...achievementData, year: Number(e.target.value)})} className="w-full border border-gray-200 dark:border-navy-600 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-navy-900 dark:text-white" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цвет (Tailwind)</label>
                                    <select value={achievementData.color_theme} onChange={e => setAchievementData({...achievementData, color_theme: e.target.value})} className="w-full border border-gray-200 dark:border-navy-600 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-navy-900 dark:text-white">
                                        <option value="blue">Синий</option>
                                        <option value="amber">Желтый (Золото)</option>
                                        <option value="emerald">Зеленый</option>
                                        <option value="purple">Фиолетовый</option>
                                        <option value="rose">Красный</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAchievementModalOpen(false)} className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-xl font-medium transition">Отмена</button>
                            <button type="submit" className="bg-brand-600 text-white px-5 py-2 rounded-xl hover:bg-brand-700 font-medium transition shadow-sm">Выдать</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 3. Модалка Добавления События (Админ) */}
            {isEventModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 dark:bg-navy-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-colors">
                    <form onSubmit={handleAddEvent} className="bg-white dark:bg-navy-800 p-6 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-navy-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Запланировать событие</h2>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название (например: Оценка 360)</label>
                                <input required type="text" value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})} className="w-full border border-gray-200 dark:border-navy-600 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-navy-900 dark:text-white" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата</label>
                                    <input required type="date" value={eventData.event_date} onChange={e => setEventData({...eventData, event_date: e.target.value})} className="w-full border border-gray-200 dark:border-navy-600 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-navy-900 dark:text-white" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Время</label>
                                    <input type="time" value={eventData.event_time} onChange={e => setEventData({...eventData, event_time: e.target.value})} className="w-full border border-gray-200 dark:border-navy-600 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-navy-900 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Формат (например: Online / Офис)</label>
                                <input type="text" value={eventData.format} onChange={e => setEventData({...eventData, format: e.target.value})} className="w-full border border-gray-200 dark:border-navy-600 p-3 rounded-xl focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-navy-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-xl font-medium transition">Отмена</button>
                            <button type="submit" className="bg-brand-600 text-white px-5 py-2 rounded-xl hover:bg-brand-700 font-medium transition shadow-sm">Добавить</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};