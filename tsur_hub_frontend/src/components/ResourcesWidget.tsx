import React from 'react';

const resources = [
    { name: 'База Знаний', url: 'https://knowledge.tsur.ru' },
    // Сюда потом добавишь другие внутренние сети
    // { name: 'CRM система', url: 'https://crm.tsur.ru' },
];

export const ResourcesWidget: React.FC = () => {
    return (
        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 transition-colors duration-200">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-50 dark:border-navy-700 pb-2">
                Внутренние ресурсы
            </h2>
            <div className="space-y-2">
                {resources.map((res, idx) => (
                    <a 
                        key={idx}
                        href={res.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-900/50 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 border border-gray-100 dark:border-navy-600 hover:border-brand-200 dark:hover:border-brand-500/50 transition-all group"
                    >
                        <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-700 dark:group-hover:text-brand-300">
                            {res.name}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
};