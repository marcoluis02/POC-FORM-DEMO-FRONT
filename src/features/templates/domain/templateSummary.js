export function summarizeTemplate(template) {
  const titles = Array.isArray(template.section_titles) ? template.section_titles.filter(Boolean) : [];
  const sections = template.section_count ?? 0;
  const questions = template.question_count ?? 0;
  if (!titles.length && !sections && !questions) return null;
  return { sections, questions, summary: titles.join(' · ') };
}
