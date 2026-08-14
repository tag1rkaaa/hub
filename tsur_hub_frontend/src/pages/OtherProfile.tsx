import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

interface Profile {
    id: number;
    first_name: string;
    last_name: string;
    position?: string;
    status?: string;
}

interface Link {
    id: number;
    title: string;
    url: string;
}

export const OtherProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [links, setLinks] = useState<Link[]>([]);
    const [isLocked, setIsLocked] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    
    // ДОБАВЛЕНО: Состояние для хранения статуса администратора
    const [isAdmin, setIsAdmin] = useState(false);

    const loadProfile = async () => {
        try {
            // Загружаем профиль сотрудника
            const res = await api.get(`/profiles/${id}`);
            setProfile(res.data);
            fetchLinks();

            // ДОБАВЛЕНО: Проверяем статус ТЕКУЩЕГО пользователя (кто смотрит страницу)
            // Если ваш эндпоинт для получения себя называется иначе (например, /users/me), замените тут:
            const meRes = await api.get('/profiles/me');
            if (meRes.data && meRes.data.is_admin) {
                setIsAdmin(true);
            }
        } catch (error) {
            console.error("Ошибка при загрузке профиля", error);
        }
    };

    const fetchLinks = async (token?: string) => {
        try {
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
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
            localStorage.setItem(`unlock_${id}`, token);
            setIsModalOpen(false);
            fetchLinks(token);
        } catch {
            alert('Неверный PIN-код');
        }
    };

    if (!profile) return <div>Загрузка...</div>;

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h1>
            <p className="text-gray-600">{profile.position}</p>
            
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Рабочие ссылки</h2>
                {isLocked ? (
                    <div className="p-6 bg-gray-100 rounded-xl text-center">
                        <p className="mb-4">Ссылки защищены PIN-кодом</p>
                        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Ввести PIN
                        </button>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {links.map(l => <li key={l.id}><a href={l.url} className="text-blue-600 hover:underline">{l.title}</a></li>)}
                    </ul>
                )}
            </div>

            {/* ДОБАВЛЕНО: Скрытая панель администратора */}
            {isAdmin && (
                <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Управление профилем (Admin)</h2>
                    <div className="flex gap-4">
                        <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition">
                            Редактировать
                        </button>
                        <button className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition">
                            Удалить профиль
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl min-w-[300px]">
                        <h2 className="text-lg font-bold mb-4">Введите PIN</h2>
                        <input type="password" value={pin} onChange={e => setPin(e.target.value)} className="border p-2 w-full mb-4 rounded" autoFocus />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Отмена</button>
                            <button onClick={handleUnlock} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Разблокировать</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};