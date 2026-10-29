"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Download, Edit, Loader2, Monitor, Save } from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { resumeSchema } from "@/app/lib/schema";
import { emptyResume, resumeToMarkdown } from "@/lib/resume-markdown";

export default function ResumeBuilder({ initialContent = "", initialFormData = null }) {
  const [activeTab, setActiveTab] = useState(initialContent ? "preview" : "edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const [resumeMode, setResumeMode] = useState("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef(null);
  const { user } = useUser();
  const initial = resumeSchema.safeParse(initialFormData);
  const { control, register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: initial.success ? initial.data : emptyResume,
  });
  const { loading: isSaving, fn: saveResumeFn } = useFetch(saveResume);
  const formValues = useWatch({ control });
  const combinedContent = useMemo(() => resumeToMarkdown(formValues, user?.fullName || ""), [formValues, user?.fullName]);
  const lastFormContent = useRef(combinedContent);

  useEffect(() => {
    const changed = lastFormContent.current !== combinedContent;
    lastFormContent.current = combinedContent;
    if (activeTab === "edit" && isDirty && changed) setPreviewContent(combinedContent);
  }, [combinedContent, activeTab, isDirty]);

  const persist = async (content, formData) => {
    try {
      await saveResumeFn({ content, formData });
      setPreviewContent(content);
      reset(formValues);
      toast.success("Resume saved successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to save resume");
    }
  };
  const onSubmit = (values) => persist(resumeToMarkdown(values, user?.fullName || ""), values);
  const saveCurrentResume = () => {
    if (activeTab === "edit") return handleSubmit(onSubmit)();
    const parsed = resumeSchema.safeParse(formValues);
    return persist(previewContent, parsed.success ? parsed.data : null);
  };
  const generatePDF = async () => {
    if (!previewContent.trim() || !pdfRef.current) return;
    setIsGenerating(true);
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      await html2pdf().set({
        margin: [15, 15], filename: "resume.pdf", image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(pdfRef.current).save();
    } catch {
      toast.error("Unable to generate the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div data-color-mode="light" className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">Resume Builder</h1>
        <div className="flex gap-2">
          <Button onClick={saveCurrentResume} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating || !previewContent.trim()}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isGenerating ? "Generating PDF..." : "Download PDF"}
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList><TabsTrigger value="edit">Form</TabsTrigger><TabsTrigger value="preview">Markdown</TabsTrigger></TabsList>
        <TabsContent value="edit">
          {initialContent && !initialFormData && <p className="text-sm text-muted-foreground my-4">This resume was saved as Markdown. Use the Markdown tab to edit it, or complete this form to rebuild it.</p>}
          <p className="text-sm text-muted-foreground my-4">Changing or saving form fields regenerates the Markdown and replaces manual Markdown edits.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                {[
                  ["email", "Email", "email", "your@email.com"], ["mobile", "Mobile Number", "tel", "+91 98765 43210"],
                  ["linkedin", "LinkedIn URL", "url", "https://linkedin.com/in/your-profile"],
                  ["twitter", "Twitter/X Profile", "url", "https://x.com/your-handle"],
                ].map(([field, label, type, placeholder]) => (
                  <div className="space-y-2" key={field}>
                    <label htmlFor={`contact-${field}`} className="text-sm font-medium">{label}</label>
                    <Input id={`contact-${field}`} {...register(`contactInfo.${field}`)} type={type} placeholder={placeholder} aria-invalid={Boolean(errors.contactInfo?.[field])} />
                    {errors.contactInfo?.[field] && <p role="alert" className="text-sm text-red-500">{errors.contactInfo[field].message}</p>}
                  </div>
                ))}
              </div>
            </div>
            {[["summary", "Professional Summary", "Write a professional summary..."], ["skills", "Skills", "List your key skills..."]].map(([name, label, placeholder]) => (
              <div className="space-y-4" key={name}>
                <label htmlFor={name} className="text-lg font-medium">{label}</label>
                <Controller name={name} control={control} render={({ field }) => <Textarea id={name} {...field} className="h-32" placeholder={placeholder} aria-invalid={Boolean(errors[name])} />} />
                {errors[name] && <p role="alert" className="text-sm text-red-500">{errors[name].message}</p>}
              </div>
            ))}
            {[["experience", "Work Experience", "Experience"], ["education", "Education", "Education"], ["projects", "Projects", "Project"]].map(([name, title, type]) => (
              <div className="space-y-4" key={name}>
                <h3 className="text-lg font-medium">{title}</h3>
                <Controller name={name} control={control} render={({ field }) => <EntryForm type={type} entries={field.value} onChange={field.onChange} />} />
                {errors[name] && <p role="alert" className="text-sm text-red-500">Please check your {title.toLowerCase()} entries.</p>}
              </div>
            ))}
          </form>
        </TabsContent>
        <TabsContent value="preview">
          <Button variant="link" type="button" className="mb-2" onClick={() => setResumeMode(resumeMode === "preview" ? "edit" : "preview")}>
            {resumeMode === "preview" ? <><Edit className="h-4 w-4" />Edit Resume</> : <><Monitor className="h-4 w-4" />Show Preview</>}
          </Button>
          {resumeMode !== "preview" && <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2"><AlertTriangle className="h-5 w-5" /><span className="text-sm">Changing form data will replace manual Markdown edits.</span></div>}
          <div className="border rounded-lg">
            <MDEditor value={previewContent} onChange={(value) => setPreviewContent(value || "")} height={800} preview={resumeMode} previewOptions={{ rehypePlugins: [rehypeSanitize] }} />
          </div>
        </TabsContent>
      </Tabs>
      <div className="fixed -left-[10000px] top-0 w-[794px]" aria-hidden="true">
        <div ref={pdfRef}><MDEditor.Markdown source={previewContent} rehypePlugins={[rehypeSanitize]} style={{ background: "white", color: "black", padding: "24px" }} /></div>
      </div>
    </div>
  );
}
