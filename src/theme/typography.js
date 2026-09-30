/**
 * TYPOGRAPHY TOKENS
 *
 * Named text presets. Each is a plain object with fontSize / fontWeight
 * so it can be spread into a StyleSheet rule:
 *
 *   const styles = StyleSheet.create({
 *     title: { ...typography.h2, color: colors.text },
 *   });
 *
 * Don't mix these into one-off rules by hand — if you need a new
 * size, add it here so the whole app stays consistent.
 */
export const typography = {
  // --- Display ---
  // The biggest text on any screen — used for the total balance
  // on the Home hero. Tight letterspacing makes it feel deliberate.
  display: { fontSize: 38, fontWeight: '800', letterSpacing: -0.5 },

  // --- Headings ---
  // Descending hierarchy. h1 = screen title, h2 = section title,
  // h3 = sub-section, h4 = card title.
  h1: { fontSize: 30, fontWeight: '700', letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  h4: { fontSize: 16, fontWeight: '600' },

  // --- Body ---
  // Reading text. Three weights so you can emphasize without
  // changing size (keeps line lengths stable).
  body: { fontSize: 15, fontWeight: '400' },
  bodyMedium: { fontSize: 15, fontWeight: '500' },
  bodyBold: { fontSize: 15, fontWeight: '600' },

  // --- Small ---
  // Support text: descriptions, hints, metadata.
  caption: { fontSize: 13, fontWeight: '400' },
  captionMedium: { fontSize: 13, fontWeight: '500' },

  // --- Micro ---
  // Labels, badges, uppercase section headers. The letterSpacing
  // is intentional — uppercase text needs breathing room to read well.
  tiny: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6 },

  // --- Button ---
  // Slightly heavier than body — buttons should feel solid.
  button: { fontSize: 16, fontWeight: '600' },
};