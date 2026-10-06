"use client";

import { CharacterCount, Placeholder } from "@tiptap/extensions";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  ChevronDown,
  Italic,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toRichTextHtml } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  id,
  name,
  labelId,
  defaultValue,
  placeholder,
  maxLength,
  invalid,
  describedBy,
  onChange,
}: {
  id: string;
  name: string;
  labelId: string;
  defaultValue: string;
  placeholder?: string;
  maxLength: number;
  invalid?: boolean;
  describedBy?: string;
  onChange?: () => void;
}) {
  const [initial] = useState(() => toRichTextHtml(defaultValue));
  const [html, setHtml] = useState(initial);

  const editor = useEditor({
    immediatelyRender: false,
    content: initial,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
        strike: false,
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
    ],
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
        class: "rich-text min-h-28 px-3 py-2 text-base outline-none md:text-sm",
      },
    },
    onUpdate({ editor }) {
      setHtml(editor.isEmpty ? "" : editor.getHTML());
      onChange?.();
    },
  });

  const characters = useEditorState({
    editor,
    selector: ({ editor }) => editor?.storage.characterCount.characters() ?? 0,
  });

  return (
    <div
      aria-invalid={invalid}
      className="rounded-lg border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
    >
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        aria-describedby={describedBy}
        className="max-h-96 overflow-y-auto"
      />
      <input type="hidden" name={name} value={html} />
      {/* <p className="border-t border-border px-3 py-1.5 text-right text-xs text-muted-foreground tabular-nums">
        {(characters ?? 0).toLocaleString("en-IN")} / {maxLength.toLocaleString("en-IN")}
      </p> */}
    </div>
  );
}

const TOOLS = [
  {
    label: "Bold",
    icon: Bold,
    mark: "bold",
    run: (e: Editor) => e.chain().focus().toggleBold().run(),
  },
  {
    label: "Italic",
    icon: Italic,
    mark: "italic",
    run: (e: Editor) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "Underline",
    icon: Underline,
    mark: "underline",
    run: (e: Editor) => e.chain().focus().toggleUnderline().run(),
  },
  {
    label: "Bulleted list",
    icon: List,
    mark: "bulletList",
    run: (e: Editor) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Numbered list",
    icon: ListOrdered,
    mark: "orderedList",
    run: (e: Editor) => e.chain().focus().toggleOrderedList().run(),
  },
] as const;

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
const BLOCKS: {
  value: "p" | `h${(typeof HEADING_LEVELS)[number]}`;
  label: string;
}[] = [
  { value: "p", label: "Paragraph" },
  ...HEADING_LEVELS.map((level) => ({
    value: `h${level}` as const,
    label: `Heading ${level}`,
  })),
];

function setBlock(editor: Editor, value: string) {
  const level = HEADING_LEVELS.find((l) => `h${l}` === value);
  const chain = editor.chain().focus();
  if (level) chain.setHeading({ level }).run();
  else chain.setParagraph().run();
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const active = useEditorState({
    editor,
    selector: ({ editor }) =>
      Object.fromEntries(
        TOOLS.map((t) => [t.mark, editor?.isActive(t.mark) ?? false]),
      ),
  });
  const block = useEditorState({
    editor,
    selector: ({ editor }) => {
      const level = HEADING_LEVELS.find((l) =>
        editor?.isActive("heading", { level: l }),
      );
      return level ? `h${level}` : "p";
    },
  });

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex gap-0.5 border-b border-border p-1"
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={!editor}
          render={
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="w-28 justify-between"
            />
          }
        >
          {BLOCKS.find((b) => b.value === block)?.label ?? "Paragraph"}
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rich-text w-44">
          <DropdownMenuRadioGroup
            value={block ?? "p"}
            onValueChange={(value) => editor && setBlock(editor, value)}
          >
            {BLOCKS.map((b) => (
              <DropdownMenuRadioItem
                key={b.value}
                value={b.value}
                closeOnClick
                className="focus:bg-muted focus:text-foreground focus:**:text-foreground"
              >
                <b.value className="m-0">{b.label}</b.value>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <div aria-hidden className="mx-1 my-1 w-px bg-border" />
      {TOOLS.map((t) => (
        <Button
          key={t.mark}
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t.label}
          aria-pressed={active?.[t.mark] ?? false}
          disabled={!editor}
          onClick={() => editor && t.run(editor)}
          className={cn(active?.[t.mark] && "bg-muted text-foreground")}
        >
          <t.icon />
        </Button>
      ))}
    </div>
  );
}
