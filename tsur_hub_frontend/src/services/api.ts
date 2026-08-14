import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:8000/api', // Обязательно указывать порт 8000 целиком
});

// Перехватчик для автоматической подстановки токена
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});