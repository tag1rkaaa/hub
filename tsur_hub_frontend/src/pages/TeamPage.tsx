import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { EmployeeProfile } from '../types';
import { TeamWidgets } from '../components/TeamWidgets';
import { AwayWidget } from '../components/AwayWidget';

export const TeamPage: React.FC = () => {
    const [team, setTeam] = useState<EmployeeProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('Все');
    const [selectedCity, setSelectedCity] = useState('Все');

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                setLoading(true);
                const res = await api.get('/profiles/'); 
                setTeam(res.data);
            } catch (error) {
                console.error('Ошибка при загрузке списка команды:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    const departments = ['Все', ...Array.from(new Set(team.map(p => p.department).filter(Boolean)))];
    const cities = ['Все', ...Array.from(new Set(team.map(p => p.city).filter(Boolean)))];

    const filteredTeam = team.filter(profile => {
        const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
        const position = (profile.position || '').toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || position.includes(searchQuery.toLowerCase());
        
        const matchesDept = selectedDepartment === 'Все' || profile.department === selectedDepartment;
        const matchesCity = selectedCity === 'Все' || profile.city === selectedCity;

        return matchesSearch && matchesDept && matchesCity;
    });

    if (loading) {
        return <div className="text-center py-20 text-gray-400 dark:text-gray-500">Загрузка команды...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 transition-colors duration-200">
            <div className="mb-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Команда</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-200">Справочник сотрудников и контактная информация</p>
                </div>

                <div className="bg-white dark:bg-navy-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 flex flex-col md:flex-row gap-4 transition-colors duration-200">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Поиск по имени или должности..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-navy-900 dark:text-white dark:placeholder-gray-400 transition-colors duration-200"
                        />
                    </div>
                    
                    <div className="md:w-64">
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-navy-900 dark:text-white transition-colors duration-200"
                        >
                            {departments.map((dept, idx) => (
                                <option key={idx} value={dept as string}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:w-48">
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-navy-900 dark:text-white transition-colors duration-200"
                        >
                            {cities.map((city, idx) => (
                                <option key={idx} value={city as string}>{city}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* --- ПАНЕЛЬ ВИДЖЕТОВ --- */}
            <AwayWidget />
            <TeamWidgets />

            {/* --- СПИСОК КОМАНДЫ --- */}
            {filteredTeam.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                    {filteredTeam.map(profile => (
                        <div key={profile.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 p-6 flex flex-col items-center text-center hover:shadow-md transition-all duration-200 relative overflow-hidden">
                            
                            {profile.status && (
                                <div className="absolute top-0 left-0 w-full bg-emerald-500 dark:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider py-1">
                                    {profile.status}
                                </div>
                            )}

                            <div className={`w-20 h-20 rounded-full border-4 border-white dark:border-navy-700 shadow-sm flex items-center justify-center text-2xl font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-navy-900 mb-4 overflow-hidden ${profile.status ? 'mt-4' : ''}`}>
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    profile.first_name[0] + profile.last_name[0]
                                )}
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">{profile.first_name} {profile.last_name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1 transition-colors duration-200">{profile.position || 'Должность не указана'}</p>
                            
                            <div className="mt-4 flex flex-col gap-1 w-full text-sm">
                                {profile.department && (
                                    <div className="bg-gray-50 dark:bg-navy-900/50 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-navy-600 transition-colors duration-200">
                                        {profile.department}
                                    </div>
                                )}
                                {profile.city && (
                                    <div className="bg-gray-50 dark:bg-navy-900/50 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-navy-600 transition-colors duration-200">
                                        {profile.city}
                                    </div>
                                )}
                            </div>

                            <Link 
                                to={`/profile/${profile.id}`} 
                                className="mt-6 w-full py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-medium rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors duration-200"
                            >
                                В профиль
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-navy-800 rounded-2xl border border-gray-100 dark:border-navy-700 transition-colors duration-200 mt-8">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">По заданным фильтрам сотрудники не найдены.</p>
                    <button 
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedDepartment('Все');
                            setSelectedCity('Все');
                        }}
                        className="mt-4 text-brand-600 dark:text-brand-400 hover:underline"
                    >
                        Сбросить фильтры
                    </button>
                </div>
            )}
        </div>
    );
};