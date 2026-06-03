import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { PageLinkNodeView } from '@colanode/ui/editor/views';

export const PageLinkNode = Node.create({
  name: 'pageLink',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,
  addAttributes() {
    return {
      id: {
        default: null,
      },
      target: {
        default: null,
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['page-link', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(PageLinkNodeView, {
      as: 'page-link',
      className: 'inline-flex',
    });
  },
});
