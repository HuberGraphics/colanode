import { Editor, type Range } from '@tiptap/core';
import { FC } from 'react';

export type EditorCommandClientRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
};

export type EditorCommandProps = {
  editor: Editor;
  range: Range;
  context: EditorContext | null;
  clientRect?: (() => EditorCommandClientRect | null) | null;
};

export type EditorContext = {
  userId: string;
  documentId: string;
  accountId: string;
  workspaceId: string;
  rootId: string;
};

export type EditorCommand = {
  key: string;
  name: string;
  description: string;
  keywords?: string[];
  icon: FC<React.SVGProps<SVGSVGElement>>;
  handler: (props: EditorCommandProps) => void | Promise<void>;
  disabled?: boolean;
};
