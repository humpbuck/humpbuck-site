"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { BlogVideo } from "@/components/admin/blog-video-extension";

const COLORS = [
  "#18181b",
  "#52525b",
  "#b45309",
  "#c89743",
  "#b91c1c",
  "#15803d",
  "#1d4ed8",
  "#ffffff",
];

type Props = {
  value: string;
  onChange: (html: string) => void;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition ${
        active
          ? "bg-zinc-900 text-white"
          : "bg-white text-zinc-700 hover:bg-zinc-100"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export function AdminBlogEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-amber-700 underline" },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "blog-image",
        },
      }),
      BlogVideo,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "blog-editor-content prose prose-zinc max-w-none min-h-[220px] px-3 py-3 text-sm focus:outline-none [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-8 text-center text-sm text-zinc-500">
        Loading editor…
      </div>
    );
  }

  const ed = editor;

  function insertImage() {
    const url = window.prompt("Image R2 URL (https://…)");
    if (!url?.trim()) return;
    ed.chain().focus().setImage({ src: url.trim() }).run();
  }

  function insertVideo() {
    const url = window.prompt("Video R2 URL (https://…mp4 or similar)");
    if (!url?.trim()) return;
    ed.chain().focus().setBlogVideo(url.trim()).run();
  }

  function setLink() {
    const prev = ed.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      ed.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    ed.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 px-2 py-2">
        <ToolbarButton
          title="Paragraph"
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          P
        </ToolbarButton>
        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-zinc-300" />
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
          Link
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-zinc-300" />
        <ToolbarButton
          title="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          Left
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          Center
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          Right
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-zinc-300" />
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Color
          </span>
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className={`h-5 w-5 rounded-full border border-zinc-300 ${
                editor.isActive("textStyle", { color })
                  ? "ring-2 ring-zinc-900 ring-offset-1"
                  : ""
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            type="button"
            title="Reset color"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100"
          >
            Reset
          </button>
        </div>
        <span className="mx-1 h-4 w-px bg-zinc-300" />
        <ToolbarButton title="Insert image (R2 URL)" onClick={insertImage}>
          Image
        </ToolbarButton>
        <ToolbarButton title="Insert video (R2 URL)" onClick={insertVideo}>
          Video
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
