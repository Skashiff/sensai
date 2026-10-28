import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resume } from "./fixtures";
const mocks = vi.hoisted(() => ({ save: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("@/actions/resume", () => ({ saveResume: mocks.save }));
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: { fullName: "Test Candidate" } }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock("@/app/(main)/resume/_components/entry-form", () => ({ EntryForm: () => null }));
vi.mock("@uiw/react-md-editor", () => {
  const Editor = ({ value, onChange }) => <textarea aria-label="Resume Markdown" value={value} onChange={(event) => onChange(event.target.value)} />;
  Editor.Markdown = ({ source }) => <div>{source}</div>;
  return { default: Editor };
});
import ResumeBuilder from "@/app/(main)/resume/_components/resume-builder.jsx";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.save.mockResolvedValue({ id: "resume-1" });
});
it("saves Markdown-only resumes after reload without requiring empty form fields", async () => {
  const user = userEvent.setup();
  render(<ResumeBuilder initialContent="# Existing resume" />);
  const editor = screen.getByRole("textbox", { name: "Resume Markdown" });
  await user.clear(editor);
  await user.type(editor, "# Updated resume");
  await user.click(screen.getByRole("button", { name: "Save", exact: true }));
  await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ content: "# Updated resume", formData: null }));
  expect(mocks.success).toHaveBeenCalledTimes(1);
});
it("restores structured form fields and preserves them when saving", async () => {
  const user = userEvent.setup();
  render(<ResumeBuilder initialContent="# Existing resume" initialFormData={resume} />);
  await user.click(screen.getByRole("tab", { name: "Form", exact: true }));
  expect(screen.getByLabelText("Email").value).toBe(resume.contactInfo.email);
  expect(screen.getByLabelText("Skills").value).toBe(resume.skills);
  const summary = screen.getByLabelText("Professional Summary");
  await user.clear(summary);
  await user.type(summary, "Updated analyst profile.");
  await user.click(screen.getByRole("button", { name: "Save", exact: true }));
  await waitFor(() => expect(mocks.save).toHaveBeenCalled());
  const saved = mocks.save.mock.calls[0][0];
  expect(saved.formData.summary).toBe("Updated analyst profile.");
  expect(saved.content).toContain("Updated analyst profile.");
});
it("does not announce a successful save when persistence fails", async () => {
  mocks.save.mockRejectedValue(new Error("Database unavailable"));
  render(<ResumeBuilder initialContent="# Resume" />);
  await userEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
  await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Database unavailable"));
  expect(mocks.success).not.toHaveBeenCalled();
});
