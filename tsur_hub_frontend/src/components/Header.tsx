import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const Header: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        // Полностью очищаем все данные сессии из localStorage
        localStorage.clear(); 
        
        // Жестко перенаправляем на логин с перезагрузкой страницы, 
        // чтобы сбросить всю память React и Axios
        window.location.href = '/login';
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* 1. Логотип слева */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-blue-600 text-white font-bold px-2.5 py-1.5 rounded-xl text-sm shadow-sm group-hover:bg-blue-700 transition">
                        ЦУР
                    </div>
                    <span className="font-bold text-lg text-gray-900">Хаб</span>
                </Link>

                {/* 2. Поисковая строка в центре */}
                <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 flex-1 max-w-xl mx-4">
                    <input
                        type="text"
                        placeholder="Поиск по ФИО или должности..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50/50"
                    />
                    <button
                        type="submit"
                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition"
                    >
                        Найти
                    </button>
                </form>

                {/* 3. Профиль и Выход справа */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/profile"
                        className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 hover:ring-2 hover:ring-blue-200 transition shadow-sm"
                        title="Мой профиль"
                    >
                        П
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition font-medium"
                    >
                        Выйти
                    </button>
                </div>
            </div>
        </header>
    );
};