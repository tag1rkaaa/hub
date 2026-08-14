import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { EmployeeProfile } from '../types';

export default function Feed() {
  // Запрашиваем реальные данные с бэкенда
  const { data: profiles, isLoading, error } = useQuery<EmployeeProfile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const response = await api.get('/profiles/');
      return response.data;
    },
    retry: false // Не повторять запрос при ошибке авторизации
  });

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500 text-lg">Загрузка контактов...</div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center py-20">
        <h2 className="text-2xl text-red-600 font-bold mb-2">Доступ закрыт</h2>
        <p className="text-gray-600 mb-4">Для просмотра ленты необходимо авторизоваться в системе (нет токена).</p>
        <p className="text-sm text-gray-400">Подсказка: добавьте JWT-токен в localStorage браузера через консоль разработчика.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Команда</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles?.map((profile) => (
          <Link 
            to={`/profile/${profile.id}`} 
            key={profile.id} 
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer block"
          >
            <div className="flex items-center space-x-4">
              {/* Аватарка из инициалов */}
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shrink-0">
                {profile.first_name[0]}{profile.last_name[0]}
              </div>
              
              <div className="overflow-hidden">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-gray-500 text-sm truncate">
                  {profile.position || 'Должность не указана'}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {profiles?.length === 0 && (
          <p className="text-gray-500 col-span-full text-center py-10">В базе пока нет ни одного профиля.</p>
        )}
      </div>
    </div>
  );
}