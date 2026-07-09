// Fixed hue per category — identity stays tied to the entity, not its rank,
// so "Food" is always the same color everywhere (chart bars, list pills).
export const CATEGORY_COLORS = {
  Food: "#2a78d6",
  Transport: "#1baf7a",
  Housing: "#eda100",
  Utilities: "#008300",
  Entertainment: "#4a3aa7",
  Health: "#e34948",
  Shopping: "#e87ba4",
  Education: "#eb6834",
  Other: "#898781",
};

export function categoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
}

export const CATEGORY_ICONS = {
  Food: "🍔",
  Transport: "🚗",
  Housing: "🏠",
  Utilities: "💡",
  Entertainment: "🎬",
  Health: "❤️",
  Shopping: "🛍️",
  Education: "🎓",
  Other: "📦",
};

export function categoryIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
}
