"use client";

import React from "react";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";

const CoverLetterPreview = ({ content }) => {
  return (
    <div className="py-4">
      <MDEditor value={content} preview="preview" height={700} hideToolbar previewOptions={{ rehypePlugins: [rehypeSanitize] }} />
    </div>
  );
};

export default CoverLetterPreview;

