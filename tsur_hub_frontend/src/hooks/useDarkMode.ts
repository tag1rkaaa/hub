import { useEffect, useState } from 'react';

export function useDarkMode() {
    // Проверяем, есть ли уже сохраненная тема, иначе ставим светлую
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'light'
    );

    const colorTheme = theme === 'dark' ? 'light' : 'dark';

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Меняем классы на теге <html>
        root.classList.remove(colorTheme);
        root.classList.add(theme);
        
        // Сохраняем выбор
        localStorage.setItem('theme', theme);
    }, [theme, colorTheme]);

    return [colorTheme, setTheme] as const;
}