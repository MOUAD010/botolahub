"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { mergeAttributes } from "@tiptap/core";
import {
  AtSign,
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Shirt,
  Swords,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mentionSuggestion } from "@/components/admin/mentionSuggestion";
import "tippy.js/dist/tippy.css";

const EntityMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mentionType: {
        default: "player",
        parseHTML: (element) =>
          element.getAttribute("data-mention-type") || "player",
        renderHTML: (attributes) => ({
          "data-mention-type": attributes.mentionType,
        }),
      },
      slug: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-slug"),
        renderHTML: (attributes) =>
          attributes.slug ? { "data-slug": attributes.slug } : {},
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const type =
      (node.attrs.mentionType as string) === "match" ? "match" : "player";
    const slug = (node.attrs.slug as string) || "";
    const label = (node.attrs.label as string) || (node.attrs.id as string);
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        href: `/${type}/${slug}`,
        class: `news-mention news-mention--${type}`,
        "data-type": "mention",
        "data-mention-type": type,
        "data-id": node.attrs.id,
        "data-slug": slug,
        "data-label": label,
      }),
      `@${label}`,
    ];
  },
}).configure({
  HTMLAttributes: {
    class: "news-mention",
  },
  suggestion: mentionSuggestion,
});

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  className?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write the article… Use @player or @match to link profiles",
  dir = "ltr",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-link underline" },
      }),
      Placeholder.configure({ placeholder }),
      EntityMention,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap-editor prose prose-sm dark:prose-invert max-w-none min-h-[220px] px-3 py-2 focus:outline-none",
        dir,
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
  }, [value, editor]);

  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  function insertMentionTrigger(kind: "player" | "match") {
    editor?.chain().focus().insertContent(`@${kind} `).run();
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-background",
        className
      )}
    >
      <div className="flex flex-wrap gap-0.5 border-b border-border bg-muted/40 p-1.5">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          label="Heading"
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Ordered list"
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="Quote"
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          label="Link"
        >
          <Link2 className="size-4" />
        </ToolbarButton>
        <span className="mx-1 w-px self-stretch bg-border" />
        <ToolbarButton
          onClick={() => insertMentionTrigger("player")}
          label="@player"
        >
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold">
            <Shirt className="size-3.5" />
            <AtSign className="size-3" />
          </span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => insertMentionTrigger("match")}
          label="@match"
        >
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold">
            <Swords className="size-3.5" />
            <AtSign className="size-3" />
          </span>
        </ToolbarButton>
        <span className="mx-1 w-px self-stretch bg-border" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          label="Undo"
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          label="Redo"
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>
      <p className="border-b border-border bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
        Mentions: type{" "}
        <code className="rounded bg-muted px-1 font-mono">@player</code> or{" "}
        <code className="rounded bg-muted px-1 font-mono">@match</code> then
        pick from the list — readers can open the profile from the article.
      </p>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className={cn(active && "bg-muted text-foreground")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
