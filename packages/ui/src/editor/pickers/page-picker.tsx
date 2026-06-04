import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
  VirtualElement,
} from '@floating-ui/react';
import type { Range } from '@tiptap/core';
import { Editor } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import { FilePlus, FileText } from 'lucide-react';
import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import {
  EditorCommandClientRect,
  EditorContext,
  LocalPageNode,
} from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  ScrollArea,
  ScrollBar,
  ScrollViewport,
} from '@colanode/ui/components/ui/scroll-area';
import {
  createEditorPage,
  getEditorPageName,
  searchEditorPages,
} from '@colanode/ui/editor/lib/pages';
import { updateScrollView } from '@colanode/ui/lib/utils';

export type PagePickerInsertMode = 'inline-link' | 'block';

type PagePickerItem =
  | {
      kind: 'page';
      page: LocalPageNode;
    }
  | {
      kind: 'create-page';
      name: string;
    };

interface PagePickerProps {
  editor: Editor;
  range: Range;
  context: EditorContext;
  clientRect?: (() => EditorCommandClientRect | null) | null;
  mode: PagePickerInsertMode;
  onClose: () => void;
}

const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter'];

const insertPage = ({
  editor,
  range,
  page,
  mode,
}: {
  editor: Editor;
  range: Range;
  page: LocalPageNode;
  mode: PagePickerInsertMode;
}) => {
  if (mode === 'inline-link') {
    editor
      .chain()
      .focus()
      .insertContentAt(range, [
        {
          type: 'pageLink',
          attrs: {
            id: generateId(IdType.Block),
            target: page.id,
          },
        },
        {
          type: 'text',
          text: ' ',
        },
      ])
      .run();
    window.getSelection()?.collapseToEnd();
    return;
  }

  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent({
      type: 'page',
      attrs: {
        id: page.id,
      },
    })
    .run();
};

export const PagePicker = ({
  editor,
  range,
  context,
  clientRect,
  mode,
  onClose,
}: PagePickerProps) => {
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState<LocalPageNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainer = useRef<HTMLDivElement>(null);
  const listContainer = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles, update } = useFloating({
    placement: 'bottom-start',
    middleware: [offset(6), flip(), shift()],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
  });

  useLayoutEffect(() => {
    const rect = clientRect?.();
    if (!rect) {
      return;
    }

    const virtualEl = {
      getBoundingClientRect: () =>
        new DOMRect(
          rect.x ?? rect.left,
          rect.y ?? rect.top,
          rect.width ?? rect.right - rect.left,
          rect.height ?? rect.bottom - rect.top
        ),
      contextElement: editor.view.dom as Element,
    };

    refs.setPositionReference(virtualEl as VirtualElement);
    update();
  }, [clientRect, editor.view.dom, refs, update]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let ignore = false;

    searchEditorPages({ context, query })
      .then((result) => {
        if (!ignore) {
          setPages(result.slice(0, 10));
        }
      })
      .catch((error) => {
        if (!ignore) {
          setPages([]);
          toast.error(error.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [context, query]);

  const items = useMemo<PagePickerItem[]>(
    () => [
      ...pages.map((page) => ({
        kind: 'page' as const,
        page,
      })),
      {
        kind: 'create-page' as const,
        name: query,
      },
    ],
    [pages, query]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length, query]);

  useLayoutEffect(() => {
    const item = listContainer?.current?.children[selectedIndex] as HTMLElement;

    if (item && scrollContainer?.current) {
      updateScrollView(scrollContainer.current, item);
    }
  }, [selectedIndex]);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) {
        return;
      }

      try {
        const page =
          item.kind === 'page'
            ? item.page
            : createEditorPage({ context, name: item.name });

        insertPage({ editor, range, page, mode });
        onClose();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to add page');
      }
    },
    [context, editor, items, mode, onClose, range]
  );

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (!navigationKeys.includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === 'ArrowUp') {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length);
      return;
    }

    if (event.key === 'ArrowDown') {
      setSelectedIndex((selectedIndex + 1) % items.length);
      return;
    }

    selectItem(selectedIndex);
  };

  return (
    <FloatingPortal>
      <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 60 }}>
        <div className="z-50 min-w-32 w-80 rounded-md border bg-popover text-popover-foreground p-1 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 overflow-hidden">
          <div className="p-1">
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              className="h-8 w-full rounded-sm bg-background px-2 text-sm outline-hidden"
              placeholder="Search pages"
            />
          </div>
          <ScrollArea className="h-80">
            <ScrollViewport ref={scrollContainer}>
              <div ref={listContainer}>
                {items.map((item, index) => {
                  const key =
                    item.kind === 'page' ? item.page.id : `create-${query}`;
                  const selected = index === selectedIndex;
                  const name =
                    item.kind === 'page'
                      ? item.page.name ?? 'Unnamed'
                      : getEditorPageName(item.name);

                  return (
                    <button
                      type="button"
                      className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${
                        selected ? 'bg-accent text-accent-foreground' : ''
                      }`}
                      key={key}
                      onClick={() => selectItem(index)}
                      onPointerDownCapture={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        selectItem(index);
                      }}
                    >
                      <div className="flex size-10 min-w-10 items-center justify-center rounded-md border bg-background">
                        {item.kind === 'page' ? (
                          <Avatar
                            id={item.page.id}
                            name={name}
                            avatar={item.page.avatar}
                            className="size-8"
                          />
                        ) : (
                          <FilePlus className="size-4 text-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {item.kind === 'page'
                            ? name
                            : query.trim().length > 0
                              ? `Create "${name}"`
                              : 'Create new page'}
                        </p>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          {item.kind === 'page' && <FileText className="size-3" />}
                          {item.kind === 'page' ? 'Page' : 'New page'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollViewport>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    </FloatingPortal>
  );
};

export const openPagePicker = (props: Omit<PagePickerProps, 'onClose'>) => {
  const renderer = new ReactRenderer(PagePicker, {
    props: {
      ...props,
      onClose: () => {
        renderer.destroy();
        props.editor.chain().focus().run();
      },
    },
    editor: props.editor,
  });
};
