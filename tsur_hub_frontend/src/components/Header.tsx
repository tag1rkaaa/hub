import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useDarkMode } from '../hooks/useDarkMode';

import logoImg from '../assets/logo2.svg';

export const Header: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [firstName, setFirstName] = useState<string>('');
    
    const [colorTheme, setTheme] = useDarkMode();

    const toggleDarkMode = () => {
        setTheme(colorTheme);
    };

    useEffect(() => {
        const fetchHeaderProfile = async () => {
            try {
                const res = await api.get('/profiles/me');
                if (res.data) {
                    setAvatarUrl(res.data.avatar_url);
                    setFirstName(res.data.first_name || '');
                }
            } catch (err) {
                console.error('Не удалось загрузить профиль для шапки:', err);
            }
        };
        fetchHeaderProfile();
    }, []);

    const handleLogout = () => {
        localStorage.clear(); 
        window.location.href = '/login';
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    };

    return (
        <header className="bg-white dark:bg-navy-900 border-b border-gray-200 dark:border-navy-700 sticky top-0 z-50 shadow-sm transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                
                {/* 1. ЛОГОТИП ИЗ КАРТИНКИ */}
                <Link to="/" className="flex items-center group mr-4">
                    
                    {/* Выводим изображение */}
                    <img 
                        src={logoImg} 
                        alt="Логотип ЦУР" 
                        className="h-10 w-auto mr-3 object-contain" 
                    />

                    {/* Текст логотипа (удали этот блок, если текст уже есть на самой картинке) */}
                    <div className="font-bold text-[24px] tracking-tight flex gap-1.5 ml-1">
                        <span className="text-[#1e293b] dark:text-white transition-colors duration-200">
                            ЦУР
                        </span>
                        <span className="text-brand-600 transition-colors duration-200">
                            Хаб
                        </span>
                    </div>
                </Link>

                {/* 2. Поиск */}
                <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 flex-1 max-w-xl mx-4">
                    <input
                        type="text"
                        placeholder="Общий поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-navy-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-gray-50/50 dark:bg-navy-800 dark:text-white dark:placeholder-gray-400 transition-colors"
                    />
                    <button
                        type="submit"
                        className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
                    >
                        Найти
                    </button>
                </form>

                {/* 3. Навигация, Профиль, Тема и Выход */}
                <div className="flex items-center gap-3">
                    
                    {/* --- ДОБАВЛЕННАЯ КНОПКА ОРГСТРУКТУРЫ --- */}
                    <Link 
                        to="/org-chart" 
                        className="hidden lg:flex px-4 py-2 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-400 text-sm font-medium rounded-xl transition-colors duration-200 border border-brand-100 dark:border-brand-800/30 shadow-sm mr-2"
                    >
                        Оргструктура
                    </Link>

                    <button 
                        onClick={toggleDarkMode}
                        className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mr-2"
                    >
                        {colorTheme === 'light' ? 'Светлая' : 'Тёмная'}
                    </button>

                    <Link
                        to="/profile"
                        className="w-10 h-10 rounded-full bg-brand-50 dark:bg-navy-800 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold border border-brand-100 dark:border-navy-600 hover:ring-2 hover:ring-brand-200 transition shadow-sm overflow-hidden"
                        title="Мой профиль"
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            firstName ? firstName[0] : 'П'
                        )}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                    >
                        Выйти
                    </button>
                </div>
            </div>
        </header>
    );
};