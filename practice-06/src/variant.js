export const variantNumber = 3;
export const FILTERS_BY_VARIANT = {
  1: { completed: false },
  2: { completed: true },
  3: { priority: "high" },
  4: { priority: "medium" },
  5: { categoryId: 1 },
  6: { categoryId: 2 },
  7: { q: "провер" },
  8: { completed: false, priority: "high", categoryId: 2 }
};
export const variantFilters = FILTERS_BY_VARIANT[3];
