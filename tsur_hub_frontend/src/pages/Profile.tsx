import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import type { EmployeeProfile, EmployeeLink } from '../types';
import { AddEventModal } from '../components/AddEventModal';
import { ResourcesWidget } from '../components/ResourcesWidget';

export const Profile: React.FC = () => {
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [links, setLinks] = useState<EmployeeLink[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState<'profile' | 'links'>('profile');
    const [isEditing, setIsEditing] = useState(false);
    
    // ДОБАВЛЕНО: desk и organization
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', position: '', status: '', department: '', city: '', hire_date: '', employment_type: '', desk: '', organization: ''  
    });
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [pin, setPin] = useState('');
    const [pinMessage, setPinMessage] = useState('');
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchMyProfileData = async () => {
            try {
                setLoading(true);
                const profRes = await api.get('/profiles/me');
                const data = profRes.data;
                setProfile(data);
                
                // ДОБАВЛЕНО: desk и organization
                setFormData({
                    first_name: data.first_name || '', last_name: data.last_name || '', position: data.position || '',
                    status: data.status || '', department: data.department || '', city: data.city || '',
                    hire_date: data.hire_date || '', employment_type: data.employment_type || '',
                    desk: data.desk || '', organization: data.organization || ''
                });

                const linksRes = await api.get('/profiles/me/links');
                setLinks(linksRes.data);
            } catch (err) {
                console.error('Ошибка загрузки профиля:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyProfileData(); 
    }, []);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const uploadData = new FormData(); uploadData.append('file', e.target.files[0]);
        try {
            const res = await api.post('/profiles/me/avatar', uploadData, { headers: { 'Content-Type': 'multipart/form-data' }});
            setProfile(res.data);
        } catch (err) { alert('Ошибка загрузки аватара'); }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const uploadData = new FormData(); uploadData.append('file', e.target.files[0]);
        try {
            const res = await api.post('/profiles/me/cover', uploadData, { headers: { 'Content-Type': 'multipart/form-data' }});
            setProfile(res.data);
        } catch (err) { alert('Ошибка загрузки обложки'); }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.put('/profiles/me', formData);
            setProfile(res.data);
            setIsEditing(false);
        } catch (err) { alert('Не удалось обновить профиль.'); }
    };

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newUrl) return;
        try {
            await api.post('/profiles/me/links', { title: newTitle, url: newUrl });
            setNewTitle(''); setNewUrl('');
            const linksRes = await api.get('/profiles/me/links');
            setLinks(linksRes.data);
        } catch (err) {}
    };

    const handleDeleteLink = async (id: number) => {
        try {
            await api.delete(`/profiles/me/links/${id}`);
            setLinks(links.filter((l) => l.id !== id));
        } catch (err) {}
    };

    const handleSetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin) return;
        try {
            await api.post('/profiles/me/pin', { pin });
            setPinMessage('PIN-код успешно установлен!');
            setPin('');
        } catch (err) { setPinMessage('Не удалось установить PIN-код.'); }
    };

    const handleDeleteEvent = async (eventId: number) => {
        if (!window.confirm('Вы уверены?')) return;
        try {
            const res = await api.delete(`/profiles/me/events/${eventId}`);
            setProfile(res.data); 
        } catch (err) { alert('Не удалось удалить событие.'); }
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
        <div className="max-w-5xl mx-auto pb-12 relative transition-colors duration-200">
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" />
            <input type="file" accept="image/*" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" />

            <div className="bg-white dark:bg-navy-800 rounded-b-3xl shadow-sm overflow-hidden mb-6 border border-gray-100 dark:border-navy-700 transition-colors duration-200">
                <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="h-48 bg-gradient-to-r from-brand-600 to-brand-800 dark:from-navy-700 dark:to-navy-900 w-full relative group cursor-pointer transition-colors duration-200"
                    style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-medium tracking-wide">Изменить обложку</span>
                    </div>
                </div>
                
                <div className="px-8 pb-6 relative">
                    <div className="flex justify-between items-end -mt-12 mb-4">
                        <div 
                            onClick={() => avatarInputRef.current?.click()}
                            className="w-24 h-24 rounded-full border-4 border-white dark:border-navy-800 shadow-md overflow-hidden flex items-center justify-center text-3xl font-bold text-brand-300 dark:text-brand-500 bg-brand-50 dark:bg-navy-900 relative group cursor-pointer transition-colors duration-200"
                        >
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                profile.first_name[0] + profile.last_name[0]
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                                <span className="text-white text-sm opacity-0 group-hover:opacity-100">Сменить фото</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-5 py-2 bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-navy-600 transition shadow-sm"
                        >
                            {isEditing ? 'Отмена' : 'Редактировать'}
                        </button>
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

            <div className="px-4">
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 transition-colors duration-200">
                                    <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Редактирование профиля</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="Имя" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                        <input type="text" placeholder="Фамилия" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                        <input type="text" placeholder="Должность" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                        <input type="text" placeholder="Отдел" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                        <input type="text" placeholder="Город" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                        <input type="text" placeholder="Статус (Например: В отпуске)" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                        
                                        {/* ДОБАВЛЕНО: Поля Стол и Организация */}
                                        <input type="text" placeholder="Номер стола (Например: 12)" value={formData.desk} onChange={e => setFormData({...formData, desk: e.target.value})} className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                        <input type="text" placeholder="Организация (Например: ЦУР РБ)" value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />

                                        <input 
                                            type="date" 
                                            title="Дата трудоустройства (для стажа)" 
                                            value={formData.hire_date} 
                                            onChange={e => setFormData({...formData, hire_date: e.target.value})} 
                                            className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" 
                                        />
                                        <select 
                                            value={formData.employment_type} 
                                            onChange={e => setFormData({...formData, employment_type: e.target.value})} 
                                            className="border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        >
                                            <option value="">Тип занятости...</option>
                                            <option value="Полная занятость">Полная занятость</option>
                                            <option value="Частичная занятость">Частичная занятость</option>
                                            <option value="ГПХ">ГПХ</option>
                                            <option value="Стажировка">Стажировка</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="mt-5 px-6 py-2 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition shadow-sm">Сохранить</button>
                                </form>
                            ) : (
                                <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 hover:shadow-md transition-all duration-200">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">Информация</h2>
                                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                                        <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Отдел</span><span className="font-medium text-gray-900 dark:text-white">{profile.department || '—'}</span></div>
                                        <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Город</span><span className="font-medium text-gray-900 dark:text-white">{profile.city || '—'}</span></div>
                                        <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Стаж работы</span><span className="font-medium text-gray-900 dark:text-white">{calculateTenure(profile.hire_date)}</span></div>
                                        <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Тип занятости</span><span className="font-medium text-gray-900 dark:text-white">{profile.employment_type || '—'}</span></div>
                                        
                                        {/* ДОБАВЛЕНО: Блоки со столом и организацией */}
                                        <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Стол</span><span className="font-medium text-gray-900 dark:text-white">{profile.desk || 'Не указан'}</span></div>
                                        <div><span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider mb-1">Организация</span><span className="font-medium text-gray-900 dark:text-white">{profile.organization || 'ЦУР РБ'}</span></div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 hover:shadow-md transition-all duration-200">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">Мои достижения</h2>
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
                                <div className="flex justify-between items-center mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">События</h2>
                                    <button 
                                        onClick={() => setIsEventModalOpen(true)}
                                        className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        + Добавить
                                    </button>
                                </div>
                                
                                {profile.events && profile.events.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.events.map(ev => (
                                            <div key={ev.id} className="p-3 bg-brand-50/50 dark:bg-navy-900/50 rounded-xl border border-brand-100 dark:border-navy-600 flex justify-between items-start group transition-colors">
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{ev.title}</div>
                                                    <div className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1">
                                                        {ev.event_date} {ev.event_time ? `• ${ev.event_time}` : ''} {ev.format ? `• ${ev.format}` : ''}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteEvent(ev.id)}
                                                    className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all px-2"
                                                    title="Удалить событие"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">Событий не запланировано.</p>
                                )}
                            </div>

                            {/* Внутренние ресурсы под событиями */}
                            <ResourcesWidget />
                        </div>
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 transition-colors duration-200">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">Управление ссылками</h2>
                            <div className="space-y-2 mb-4">
                                {links.map((link) => (
                                    <div key={link.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-600">
                                        <a href={link.url} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">{link.title}</a>
                                        <button onClick={() => handleDeleteLink(link.id)} className="text-red-500 dark:text-red-400 text-sm hover:underline font-medium">Удалить</button>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleAddLink} className="flex flex-col sm:flex-row gap-2 mt-4">
                                <input type="text" placeholder="Название (План 2024)" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full sm:w-1/3 border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl text-sm bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                <input type="url" placeholder="URL-адрес" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="w-full flex-1 border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl text-sm bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm">Добавить</button>
                            </form>
                        </div>
                        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 h-fit transition-colors duration-200">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 border-b border-gray-50 dark:border-navy-700 pb-2">Защита PIN-кодом</h2>
                            <form onSubmit={handleSetPin} className="flex gap-2 mt-4">
                                <input type="password" placeholder="Новый PIN" value={pin} onChange={e => setPin(e.target.value)} className="flex-1 border border-gray-200 dark:border-navy-600 p-2.5 rounded-xl text-sm bg-gray-50 dark:bg-navy-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                                <button type="submit" className="bg-navy-800 dark:bg-navy-950 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-navy-900 dark:hover:bg-black transition shadow-sm">Установить</button>
                            </form>
                            {pinMessage && <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-3 font-medium bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/50">{pinMessage}</p>}
                        </div>
                    </div>
                )}
            </div>

            <AddEventModal 
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSuccess={(updatedProfile) => setProfile(updatedProfile)}
            />
        </div>
    );
};