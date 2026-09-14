import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { TeamPage } from './pages/TeamPage';
import { Profile } from './pages/Profile';
import { OtherProfile } from './pages/OtherProfile';
import { Login } from './pages/Login'; 
import { OrgChart } from './pages/OrgChart'; // <-- ИМПОРТИРОВАЛИ ОРГСТРУКТУРУ
import { Header } from './components/Header';

export function App() {
    // Получаем текущий путь, чтобы скрыть Header на странице авторизации
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    return (
        // ДОБАВЛЕНЫ КЛАССЫ ТЁМНОЙ ТЕМЫ ДЛЯ ФОНА И ТЕКСТА
        <div className="min-h-screen bg-gray-50 dark:bg-navy-900 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
            
            {/* Показываем шапку везде, кроме страницы /login */}
            {!isLoginPage && <Header />}

            <main className="flex-1">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<TeamPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:id" element={<OtherProfile />} />
                    <Route path="/org-chart" element={<OrgChart />} /> {/* <-- ДОБАВИЛИ РОУТ */}
                </Routes>
            </main>
        </div>
    );
}

export default App;
