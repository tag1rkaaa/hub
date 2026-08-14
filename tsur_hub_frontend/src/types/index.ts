export interface EmployeeLink {
  id: number;
  profile_id: number;
  title: string;
  url: string;
  icon?: string;
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
  links: EmployeeLink[];
  is_admin: boolean; // <--- ДОБАВЛЕНО ПОЛЕ АДМИНИСТРАТОРА
}