import type { BookStatus } from './types';

export const BOOK_CATEGORIES = [
  'Παγκόσμια Λογοτεχνία',
  'Ελληνική Λογοτεχνία',
  'Ποίηση',
  'Φιλοσοφία & Ψυχολογία',
  'Πολιτική & Ιστορία',
  'Underground & Beat',
] as const;

export const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: 'Θέλω να διαβάσω',
  reading: 'Διαβάζω τώρα',
  read: 'Διαβασμένο',
};

export const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=600&auto=format&fit=crop',
];
