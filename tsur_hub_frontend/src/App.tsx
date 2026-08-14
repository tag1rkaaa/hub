import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { TeamPage } from './pages/TeamPage';
import { Profile } from './pages/Profile';
import { OtherProfile } from './pages/OtherProfile';
import Login from './pages/Login'; // <--- Удалили фигурные скобки здесь
import { Header } from './components/Header';

export function App() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
            {!isLoginPage && <Header />}

            <main className="flex-1">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<TeamPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:id" element={<OtherProfile />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;