export interface EmployeeLink {
  id: number;
  profile_id?: number;
  title: string;
  url: string;
  icon?: string;
}

export interface Achievement {
  id: number;
  title: string;
  year?: number;
  color_theme?: string;
}

export interface Event {
    id: number;
    title: string;
    event_date: string;
    end_date?: string;    // <-- Добавь вот эту строчку
    event_time?: string;
    format?: string;
    profile_id?: number;
}

export interface EmployeeProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  position?: string;
  status?: string;
  avatar_url?: string;
  cover_url?: string;
  is_admin: boolean;
  
  // Новые поля из ТЗ
  manager_id?: number;
  department?: string;
  hire_date?: string;
  birth_date?: string;
  employment_type?: string;
  city?: string;
  
  // Вложенные списки
  links: EmployeeLink[];
  achievements: Achievement[];
  events: Event[];
}

export interface EmployeeProfile {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    // ... твои старые поля ...
    city?: string;
    
    // --- ДОБАВЬ ВОТ ЭТИ ДВЕ СТРОЧКИ ---
    desk?: string;
    organization?: string;

    // ... массивы links, achievements, events и т.д.
}