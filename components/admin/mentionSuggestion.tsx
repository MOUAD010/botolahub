"use client";

import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import {
  isHintMention,
  searchMentions,
  type MentionItem,
} from "@/lib/mentions";
import {
  MentionList,
  type MentionListRef,
} from "@/components/admin/MentionList";

export const mentionSuggestion: Omit<
  SuggestionOptions<MentionItem>,
  "editor"
> = {
  char: "@",
  allowSpaces: true,
  items: ({ query }) => searchMentions(query),
  command: ({ editor, range, props }) => {
    if (isHintMention(props)) return;

    // Delete the trigger range (@player …) then insert mention node
    editor
      .chain()
      .focus()
      .insertContentAt(range, [
        {
          type: "mention",
          attrs: {
            id: props.id,
            label: props.label,
            mentionType: props.mentionType,
            slug: props.slug,
          },
        },
        { type: "text", text: " " },
      ])
      .run();
  },
  render: () => {
    let component: ReactRenderer<MentionListRef> | null = null;
    let popup: TippyInstance[] | null = null;

    return {
      onStart: (props: SuggestionProps<MentionItem>) => {
        component = new ReactRenderer(MentionList, {
          props: {
            items: props.items,
            command: (item: MentionItem) => {
              props.command(item);
            },
          },
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },
      onUpdate: (props: SuggestionProps<MentionItem>) => {
        component?.updateProps({
          items: props.items,
          command: (item: MentionItem) => {
            props.command(item);
          },
        });

        if (popup?.[0] && props.clientRect) {
          popup[0].setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        }
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          popup?.[0]?.hide();
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        popup?.[0]?.destroy();
        component?.destroy();
        popup = null;
        component = null;
      },
    };
  },
};
