import { FileText } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';
import { openPagePicker } from '@colanode/ui/editor/pickers/page-picker';

export const PageCommand: EditorCommand = {
  key: 'page',
  name: 'Page',
  description: 'Link or create a page',
  keywords: ['page', 'link', 'wiki'],
  icon: FileText,
  disabled: false,
  handler({ editor, range, context, clientRect }) {
    if (context == null) {
      return;
    }

    openPagePicker({
      editor,
      range,
      context,
      clientRect,
      mode: 'block',
    });
  },
};
