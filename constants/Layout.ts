/** Shared layout rules. Text still scales; controls grow rather than clip. */
export const Layout = {
  page: 16,
  gap: 12,
  section: 24,
  touch: 48,
  contentWidth: 960,
  readingWidth: 680,
  radius: 16,
};

export const Type = {
  title: { fontSize: 26, fontWeight: '800' as const },
  heading: { fontSize: 19, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 19 },
};

/** Columns are based on available card width AND accessible text size. */
export function collectionColumns(width: number, fontScale: number): number {
  const minimum = 152 * Math.max(1, fontScale);
  return Math.max(1, Math.min(5, Math.floor((Math.min(width, Layout.contentWidth) - Layout.page * 2 + Layout.gap) / (minimum + Layout.gap))));
}
