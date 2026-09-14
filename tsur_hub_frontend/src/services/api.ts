import axios from 'axios';

// Базовая настройка Axios с поддержкой переменных окружения Vite
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api',
});

// Добавляем токен ко всем исходящим запросам
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Перехватываем ошибки авторизации (если токен просрочен)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Если сервер ответил 401 Unauthorized, удаляем токен и кидаем на страницу логина
            localStorage.removeItem('token');
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);