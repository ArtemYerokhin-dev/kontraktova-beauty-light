export const CATEGORIES = [
  { code: 'manicure_pedicure', label: 'Манікюр/педикюр', image: '/images/manicure_pedicure.webp' },
  { code: 'brows_permanent', label: 'Брови / перманентний макіяж', image: '/images/brows_permanent.webp' },
  { code: 'lash_lamination', label: 'Ламінування вій', image: '/images/lash_lamination.webp' },
];

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.code, c.label]));

export const STATUS_LABELS = {
  нова: 'Нова',
  підтверджена: 'Підтверджена',
  скасована: 'Скасована',
  виконана: 'Виконана',
};

export const ALL_STATUSES = ['нова', 'підтверджена', 'скасована', 'виконана'];

// Index = JS Date.getDay() (0=Sunday..6=Saturday) — keep this order, it's the
// canonical mapping used for storage and for indexing by getDay() elsewhere.
export const WEEKDAY_LABELS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// Monday-first display order for UI lists (e.g. days-off pickers), mapping
// into the day numbers above.
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
