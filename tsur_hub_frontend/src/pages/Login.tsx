import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

import logoImg from '../assets/logo2.svg'; // <-- Импорт картинки логотипа

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const token = response.data.access_token;
            localStorage.setItem('token', token); 
            
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка авторизации. Проверьте почту и пароль.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-navy-950 transition-colors duration-200">
            <div className="w-full max-w-[400px] bg-white dark:bg-navy-800 rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 dark:border-navy-700 transition-colors duration-200">
                
                {/* ВЕРХНЯЯ ЦВЕТНАЯ ШАПКА */}
                <div className="bg-gradient-to-br from-brand-600 to-brand-800 dark:from-navy-700 dark:to-navy-900 p-10 flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors duration-200">
                    
                    {/* Декоративные круги на фоне */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-white opacity-5 rounded-full blur-xl"></div>
                    
                    {/* ЛОГОТИП ИЗ КАРТИНКИ */}
                    <img 
                        src={logoImg} 
                        alt="Логотип ЦУР" 
                        className="h-14 w-auto mb-4 relative z-10 drop-shadow-md object-contain" 
                    />

                    <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">ЦУР.Хаб</h1>
                    <p className="text-brand-100 dark:text-gray-400 text-sm mt-1 font-medium">Корпоративный портал</p>
                </div>

                {/* ФОРМА ВХОДА */}
                <div className="p-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">Вход в систему</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl text-center border border-red-100 dark:border-red-800/50">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Электронная почта
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@tsur.ru"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-600 rounded-xl focus:bg-white dark:focus:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Пароль
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-600 rounded-xl focus:bg-white dark:focus:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Вход...' : 'Войти'}
                        </button>
                    </form>
                </div>

                {/* НИЖНИЙ КОЛОНТИТУЛ */}
                <div className="bg-gray-50 dark:bg-navy-900/50 py-4 text-center border-t border-gray-100 dark:border-navy-700 transition-colors duration-200">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Защищенное соединение</p>
                </div>

            </div>
        </div>
    );
};