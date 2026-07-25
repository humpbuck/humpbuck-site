import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blogVideo: {
      setBlogVideo: (src: string) => ReturnType;
    };
  }
}

/** R2 / direct video URL node for TipTap blog editor. */
export const BlogVideo = Node.create({
  name: "blogVideo",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video[src]",
        getAttrs: (el) => {
          const src = (el as HTMLElement).getAttribute("src");
          return src ? { src } : false;
        },
      },
      {
        tag: "div.blog-video video[src]",
        getAttrs: (el) => {
          const src = (el as HTMLElement).getAttribute("src");
          return src ? { src } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "blog-video" },
      [
        "video",
        mergeAttributes(
          {
            controls: "true",
            playsinline: "true",
            style: "width:auto;height:auto;max-width:100%;",
          },
          HTMLAttributes,
        ),
      ],
    ];
  },

  addCommands() {
    return {
      setBlogVideo:
        (src: string) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src },
          }),
    };
  },
});
