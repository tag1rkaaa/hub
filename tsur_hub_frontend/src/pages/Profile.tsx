import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Link {
    id: number;
    title: string;
    url: string;
    icon?: string;
}

interface ProfileData {
    id: number;
    first_name: string;
    last_name: string;
    position?: string;
    status?: string;
    avatar_url?: string;
}

export const Profile: React.FC = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [links, setLinks] = useState<Link[]>([]);
    const [loading, setLoading] = useState(true);

    // Форма редактирования профиля
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [position, setPosition] = useState('');
    const [status, setStatus] = useState('');

    // Форма добавления ссылки
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');

    // Форма PIN-кода
    const [pin, setPin] = useState('');
    const [pinMessage, setPinMessage] = useState('');

    const fetchMyProfileData = async () => {
        try {
            setLoading(true);
            const profRes = await api.get('/profiles/me');
            setProfile(profRes.data);
            setFirstName(profRes.data.first_name || '');
            setLastName(profRes.data.last_name || '');
            setPosition(profRes.data.position || '');
            setStatus(profRes.data.status || '');

            const linksRes = await api.get('/profiles/me/links');
            setLinks(linksRes.data);
        } catch (err) {
            console.error('Ошибка загрузки профиля:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyProfileData();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.put('/profiles/me', {
                first_name: firstName,
                last_name: lastName,
                position,
                status,
            });
            setProfile(res.data);
            alert('Профиль успешно обновлен!');
        } catch (err) {
            console.error('Ошибка обновления профиля:', err);
            alert('Не удалось обновить профиль.');
        }
    };

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newUrl) return;
        try {
            await api.post('/profiles/me/links', { title: newTitle, url: newUrl });
            setNewTitle('');
            setNewUrl('');
            const linksRes = await api.get('/profiles/me/links');
            setLinks(linksRes.data);
        } catch (err) {
            console.error('Ошибка добавления ссылки:', err);
        }
    };

    const handleDeleteLink = async (id: number) => {
        try {
            await api.delete(`/profiles/me/links/${id}`);
            setLinks(links.filter((l) => l.id !== id));
        } catch (err) {
            console.error('Ошибка удаления ссылки:', err);
        }
    };

    const handleSetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin) return;
        try {
            await api.post('/profiles/me/pin', { pin });
            setPinMessage('PIN-код успешно установлен!');
            setPin('');
        } catch (err) {
            console.error('Ошибка установки PIN:', err);
            setPinMessage('Не удалось установить PIN-код.');
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-400">Загрузка профиля...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Мой профиль</h1>

            {/* Карточка редактирования информации */}
            <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Личная информация</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
                        <input
                            type="text"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                        <input
                            type="text"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition"
                >
                    Сохранить изменения
                </button>
            </form>

            {/* Блок управления рабочими ссылками */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Важные рабочие ссылки</h2>
                
                <div className="space-y-2">
                    {links.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                                <span className="font-medium text-gray-900">{link.title}</span> —{' '}
                                <a href={link.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    {link.url}
                                </a>
                            </div>
                            <button
                                onClick={() => handleDeleteLink(link.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                Удалить
                            </button>
                        </div>
                    ))}
                    {links.length === 0 && <p className="text-sm text-gray-400">Ссылки еще не добавлены.</p>}
                </div>

                <form onSubmit={handleAddLink} className="flex flex-col sm:flex-row gap-3 pt-2">
                    <input
                        type="text"
                        placeholder="Название (например, Доска Trello)"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="url"
                        placeholder="URL (https://...)"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition"
                    >
                        Добавить
                    </button>
                </form>
            </div>

            {/* Блок установки PIN-кода */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Защита профиля PIN-кодом</h2>
                <p className="text-sm text-gray-500">
                    Установите PIN-код, чтобы защитить свои рабочие ссылки от просмотра другими сотрудниками.
                </p>
                <form onSubmit={handleSetPin} className="flex gap-3">
                    <input
                        type="password"
                        placeholder="Введите новый PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-1/3 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-5 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition"
                    >
                        Установить PIN
                    </button>
                </form>
                {pinMessage && <p className="text-sm text-emerald-600 font-medium">{pinMessage}</p>}
            </div>
        </div>
    );
};