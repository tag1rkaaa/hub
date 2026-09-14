import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import type { EmployeeProfile } from '../types';
import { Link } from 'react-router-dom';

interface TreeNode extends EmployeeProfile {
    children: TreeNode[];
}

export const OrgChart: React.FC = () => {
    const [allProfiles, setAllProfiles] = useState<EmployeeProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

    // Загружаем всех профилей один раз при входе на страницу
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const res = await api.get('/profiles/org-tree/all');
                setAllProfiles(res.data);
            } catch (error) {
                console.error("Ошибка загрузки оргструктуры", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    // Получаем уникальный список всех отделов
    const departments = useMemo(() => {
        return Array.from(new Set(allProfiles.map(p => p.department).filter(Boolean))) as string[];
    }, [allProfiles]);

    // УМНАЯ СБОРКА ДЕРЕВА: пересчитывается при смене отдела
    const tree = useMemo(() => {
        // 1. Оставляем только нужных сотрудников
        const visibleProfiles = selectedDepartment 
            ? allProfiles.filter(p => p.department === selectedDepartment)
            : allProfiles;

        // 2. Создаем карту (Map) для быстрого поиска
        const map = new Map<number, TreeNode>();
        visibleProfiles.forEach(item => map.set(item.id, { ...item, children: [] }));

        const roots: TreeNode[] = [];
        
        // 3. Строим связи
        visibleProfiles.forEach(item => {
            const node = map.get(item.id)!;
            
            // Если у сотрудника есть начальник И этот начальник тоже находится в нашем отфильтрованном списке
            if (item.manager_id && map.has(item.manager_id)) {
                map.get(item.manager_id)!.children.push(node);
            } else {
                // Иначе этот сотрудник — самый главный в текущем виде (Начальник отдела или Директор)
                roots.push(node);
            }
        });

        return roots;
    }, [allProfiles, selectedDepartment]);

    // Компонент отрисовки одного узла
    const OrgNode: React.FC<{ node: TreeNode; isRoot?: boolean }> = ({ node, isRoot }) => (
        <div className="flex flex-col items-center">
            
            {/* Карточка сотрудника */}
            <div className="relative group transition-all duration-300">
                <Link 
                    to={`/profile/${node.id}`} 
                    className={`flex flex-col items-center p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 w-48 text-center relative z-10 
                    ${isRoot 
                        ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/30 dark:bg-brand-900/20 dark:border-brand-400 scale-105' // Особый стиль для начальника
                        : 'bg-white dark:bg-navy-800 border-gray-200 dark:border-navy-600 hover:border-brand-300 dark:hover:border-brand-500'}`}
                >
                    {/* Если это начальник (самый верхний корень), можно добавить иконку короны или звезды */}
                    {isRoot && (
                        <div className="absolute -top-3 right-4 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase">
                            Руководитель
                        </div>
                    )}

                    <img 
                        src={node.avatar_url || 'https://via.placeholder.com/150'} 
                        className={`w-16 h-16 rounded-full object-cover border-4 mb-2 
                            ${isRoot ? 'border-white dark:border-navy-700 shadow-md' : 'border-brand-50 dark:border-navy-700'}`}
                        alt="avatar"
                    />
                    <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{node.first_name} {node.last_name}</div>
                    <div className="text-[11px] text-brand-600 dark:text-brand-400 font-bold mt-1.5">{node.position || 'Сотрудник'}</div>
                    
                    {!selectedDepartment && (
                        <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                            {node.department}
                        </div>
                    )}
                </Link>
            </div>

            {/* Отрисовка подчиненных */}
            {node.children.length > 0 && (
                <div className="flex flex-col items-center">
                    <div className="w-px h-8 bg-gray-300 dark:bg-navy-600"></div>
                    
                    {/* ЗДЕСЬ ИСПРАВЛЕНО: gap-4 заменено на gap-8 для подчиненных */}
                    <div className="flex gap-8 relative">
                        {node.children.length > 1 && (
                            <div className="absolute top-0 left-[50%] right-0 w-full h-px bg-gray-300 dark:bg-navy-600 -translate-x-[50%]"></div>
                        )}
                        
                        {node.children.map((child) => (
                            <div key={child.id} className="relative pt-8">
                                <div className="absolute top-0 left-1/2 w-px h-8 bg-gray-300 dark:bg-navy-600 -translate-x-1/2"></div>
                                {/* Передаем isRoot=false для всех подчиненных */}
                                <OrgNode node={child} isRoot={false} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    if (loading) return <div className="text-center py-20 text-gray-500">Загрузка структуры...</div>;

    return (
        <div className="max-w-full overflow-x-auto p-8 min-h-[calc(100vh-80px)] bg-gray-50 dark:bg-navy-900 transition-colors duration-200">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Организационная структура
            </h1>

            {/* --- ПАНЕЛЬ ФИЛЬТРОВ (КНОПКИ ОТДЕЛОВ) --- */}
            {departments.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-5xl mx-auto">
                    <button
                        onClick={() => setSelectedDepartment(null)}
                        className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border-2 
                            ${selectedDepartment === null 
                                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/20 dark:text-brand-400 shadow-sm' 
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-300 dark:hover:border-navy-600'}`}
                    >
                        Вся компания
                    </button>
                    
                    {departments.map(dept => (
                        <button
                            key={dept}
                            onClick={() => setSelectedDepartment(dept)}
                            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border-2 
                                ${selectedDepartment === dept 
                                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/20 dark:text-brand-400 shadow-sm' 
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-300 dark:hover:border-navy-600'}`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            )}

            {/* --- ДЕРЕВО --- */}
            {/* ЗДЕСЬ ИСПРАВЛЕНО: Добавлен gap-16 для разделения корневых узлов */}
            <div className="flex justify-center gap-16 min-w-max pb-20">
                {tree.map(rootNode => (
                    // Передаем isRoot=true для самых верхних узлов в текущем виде
                    <OrgNode key={rootNode.id} node={rootNode} isRoot={true} />
                ))}
            </div>
        </div>
    );
};