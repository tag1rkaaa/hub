import React, { useState } from 'react';
import { api } from '../services/api';

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedProfile: any) => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [format, setFormat] = useState('Офлайн (В офисе)');
    const [destination, setDestination] = useState(''); // Новое состояние для поля "Куда"
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    // Пресеты без эмодзи, как на твоем скриншоте
    const quickPresets = ['Отпуск', 'Удаленка', 'Встреча', 'Командировка'];

    // Умные условия для скрытия/показа полей на основе названия
    const titleLower = title.toLowerCase();
    const isVacationOrRemote = titleLower.includes('отпуск') || titleLower.includes('удаленка');
    const isBusinessTrip = titleLower.includes('командировка');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Определяем, что отправить в поле format на бэкенд
        let finalFormat = format;
        if (isVacationOrRemote) finalFormat = '';
        if (isBusinessTrip) finalFormat = destination;

        try {
            const response = await api.post('/profiles/me/events', {
                title,
                event_date: eventDate,
                end_date: endDate || null,
                format: finalFormat
            });
            onSuccess(response.data);
            handleClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Ошибка при добавлении события');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setEventDate('');
        setEndDate('');
        setFormat('Офлайн (В офисе)');
        setDestination('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-navy-900/80 backdrop-blur-sm p-4 transition-colors">
            <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-transparent dark:border-navy-600">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-navy-700 bg-gray-50/50 dark:bg-navy-900/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Запланировать событие</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800/50 text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {quickPresets.map(preset => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setTitle(preset)}
                                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                    title.includes(preset) 
                                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700/50 text-brand-700 dark:text-brand-400 font-medium' 
                                    : 'bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800'
                                }`}
                            >
                                {preset}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Название события</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Например: Встреча с клиентом"
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:bg-white dark:focus:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Дата начала</label>
                            <input
                                type="date"
                                required
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:bg-white dark:focus:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Дата конца</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:bg-white dark:focus:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Показываем селект формата ТОЛЬКО если это не отпуск, не удаленка и не командировка */}
                    {!isVacationOrRemote && !isBusinessTrip && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Формат</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:bg-white dark:focus:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                            >
                                <option value="Офлайн (В офисе)">Офлайн (В офисе)</option>
                                <option value="Онлайн">Онлайн</option>
                                <option value="Удаленка">Удаленка</option>
                            </select>
                        </div>
                    )}

                    {/* Показываем поле "Куда" ТОЛЬКО если это командировка */}
                    {isBusinessTrip && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Куда</label>
                            <input
                                type="text"
                                required
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                placeholder="Например: Москва"
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl bg-gray-50 dark:bg-navy-900 dark:text-white focus:bg-white dark:focus:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                            />
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Сохранение...' : 'Добавить в профиль'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};