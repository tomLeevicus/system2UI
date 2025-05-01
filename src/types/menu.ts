export interface MenuItem {
  path: string;
  meta?: {
    title?: string;
    icon?: string;
  };
  children?: MenuItem[];
} 