export const emptyResume = {
  contactInfo: { email: "", mobile: "", linkedin: "", twitter: "" },
  summary: "", skills: "", experience: [], education: [], projects: [],
};

function escapeText(value = "") {
  return value.replace(/[\\`*_{}[\]()#+.!|<>]/g, "\\$&");
}
export function formatResumeDate(value) {
  if (!value) return "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  return new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}
export function entriesToMarkdown(entries, title) {
  if (!entries?.length) return "";
  return `## ${title}\n\n` + entries.map((entry) =>
    `### ${escapeText(entry.title)} @ ${escapeText(entry.organization)}\n${formatResumeDate(entry.startDate)} - ${entry.current ? "Present" : formatResumeDate(entry.endDate)}\n\n${entry.description}`
  ).join("\n\n");
}
export function resumeToMarkdown(values = emptyResume, name = "") {
  const contact = values.contactInfo || {};
  const details = [contact.email && escapeText(contact.email), contact.mobile && escapeText(contact.mobile),
    contact.linkedin && `[LinkedIn](${contact.linkedin.replaceAll(")", "%29")})`,
    contact.twitter && `[Twitter](${contact.twitter.replaceAll(")", "%29")})`].filter(Boolean).join(" | ");
  return [name && `# ${escapeText(name)}`, details,
    values.summary && `## Professional Summary\n\n${values.summary}`,
    values.skills && `## Skills\n\n${values.skills}`,
    entriesToMarkdown(values.experience, "Work Experience"), entriesToMarkdown(values.education, "Education"),
    entriesToMarkdown(values.projects, "Projects")].filter(Boolean).join("\n\n");
}
