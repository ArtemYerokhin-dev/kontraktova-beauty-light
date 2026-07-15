export const CATEGORIES = ['manicure_pedicure', 'brows_permanent', 'lash_lamination'];

export const CATEGORY_LABELS = {
  manicure_pedicure: 'Манікюр/педикюр',
  brows_permanent: 'Брови / перманентний макіяж',
  lash_lamination: 'Ламінування вій',
};

export function isValidCategory(cat) {
  return CATEGORIES.includes(cat);
}
