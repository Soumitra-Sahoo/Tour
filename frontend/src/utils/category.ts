const ICONS: Record<string, string> = {
  food: '🍛',
  hotel: '🏨',
  transport: '🚕',
  tickets: '🎫',
  shopping: '🛍️',
  activities: '🎈',
  other: '📌',
};

export function categoryIcon(category: string): string {
  return ICONS[category.toLowerCase()] || '💰';
}
