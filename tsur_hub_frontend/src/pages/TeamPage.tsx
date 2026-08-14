import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

interface EmployeeProfile {
    id: number;
    first_name: string;
    last_name: string;
    position?: string;
    status?: string;
    avatar_url?: string;
}

export const TeamPage: React.FC = () => {
    const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const [search, setSearch] = useState(searchQuery);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [isAdmin, setIsAdmin] = useState(false);
    
    // ДОБАВЛЕНО: Состояния для модального окна создания профиля
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProfile, setNewProfile] = useState({
        first_name: '',
        last_name: '',
        position: '',
        status: ''
    });

    const fetchProfiles = async (query = '') => {
        try {
            setLoading(true);
            const response = await api.get('/profiles/', {
                params: { search: query || undefined }
            });
            setProfiles(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке списка команды:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkAdminRights = async () => {
        try {
            const meRes = await api.get('/profiles/me');
            if (meRes.data?.is_admin) {
                setIsAdmin(true);
            }
        } catch (e) {
            // Игнорируем ошибку неавторизованного пользователя
        }
    };

    useEffect(() => {
        setSearch(searchQuery);
        fetchProfiles(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        checkAdminRights();
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        if (value) {
            setSearchParams({ search: value });
        } else {
            setSearchParams({});
        }
    };

    // ДОБАВЛЕНО: Функция отправки данных на сервер
    const handleCreateProfile = async () => {
        if (!newProfile.first_name || !newProfile.last_name) {
            alert("Пожалуйста, заполните Имя и Фамилию.");
            return;
        }

        try {
            // Отправляем POST-запрос на создание профиля
            await api.post('/profiles/', newProfile);
            
            // Закрываем модалку и очищаем форму
            setIsCreateModalOpen(false);
            setNewProfile({ first_name: '', last_name: '', position: '', status: '' });
            
            // Заново загружаем список, чтобы увидеть новичка
            fetchProfiles(searchQuery);
        } catch (error) {
            console.error('Ошибка при создании профиля:', error);
            alert("Произошла ошибка. Возможно, на бэкенде еще нет нужного эндпоинта.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Команда</h1>
                
                {isAdmin && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)} // Открываем модалку по клику
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm font-medium"
                    >
                        + Добавить сотрудника
                    </button>
                )}
            </div>

            <div className="mb-8">
                <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Поиск по ФИО или должности..."
                    className="w-full md:w-1/3 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition"
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Загрузка сотрудников...</div>
            ) : profiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    В базе пока нет ни одного профиля.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {profiles.map((profile) => {
                        const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
                        return (
                            <div
                                key={profile.id}
                                onClick={() => navigate(`/profile/${profile.id}`)}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition cursor-pointer flex flex-col items-center text-center group relative"
                            >
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={`${profile.first_name} ${profile.last_name}`}
                                        className="w-20 h-20 rounded-full object-cover mb-4 ring-2 ring-gray-100 group-hover:ring-blue-200 transition"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold mb-4 ring-2 ring-gray-100 group-hover:ring-blue-200 transition">
                                        {initials || 'ЦУ'}
                                    </div>
                                )}

                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                    {profile.first_name} {profile.last_name}
                                </h3>
                                
                                <p className="text-sm text-gray-500 mt-1">
                                    {profile.position || 'Сотрудник'}
                                </p>

                                {profile.status && (
                                    <span className="mt-4 px-3 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-full font-medium">
                                        {profile.status}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ДОБАВЛЕНО: Само модальное окно */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Новый сотрудник</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                                <input 
                                    type="text" 
                                    value={newProfile.first_name}
                                    onChange={(e) => setNewProfile({...newProfile, first_name: e.target.value})}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Иван"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
                                <input 
                                    type="text" 
                                    value={newProfile.last_name}
                                    onChange={(e) => setNewProfile({...newProfile, last_name: e.target.value})}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Иванов"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
                                <input 
                                    type="text" 
                                    value={newProfile.position}
                                    onChange={(e) => setNewProfile({...newProfile, position: e.target.value})}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Аналитик"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                                <input 
                                    type="text" 
                                    value={newProfile.status}
                                    onChange={(e) => setNewProfile({...newProfile, status: e.target.value})}
                                    className="w-full border border-gray-300 px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="Работает"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition"
                            >
                                Отмена
                            </button>
                            <button 
                                onClick={handleCreateProfile}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition shadow-sm"
                            >
                                Добавить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};