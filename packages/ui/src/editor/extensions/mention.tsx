import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingPortal,
  VirtualElement,
} from '@floating-ui/react';
import type { Range } from '@tiptap/core';
import { Editor, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react';
import {
  Suggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from '@tiptap/suggestion';
import { FilePlus, FileText } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { EditorContext, LocalPageNode, User } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  ScrollArea,
  ScrollViewport,
  ScrollBar,
} from '@colanode/ui/components/ui/scroll-area';
import {
  createEditorPage,
  getEditorPageName,
  searchEditorPages,
} from '@colanode/ui/editor/lib/pages';
import { MentionNodeView } from '@colanode/ui/editor/views';
import { updateScrollView } from '@colanode/ui/lib/utils';

declare module '@tiptap/core' {
  interface Storage {
    mention: {
      isOpen: boolean;
    };
  }
}

interface MentionOptions {
  context: EditorContext | null;
}

type MentionSuggestionItem =
  | {
      kind: 'user';
      user: User;
    }
  | {
      kind: 'page';
      page: LocalPageNode;
    }
  | {
      kind: 'create-page';
      name: string;
    };

const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter'];

const CommandList = ({
  items,
  command,
  range,
  props,
}: {
  items: MentionSuggestionItem[];
  command: (item: MentionSuggestionItem, range: Range) => void;
  range: Range;
  props: SuggestionProps<MentionSuggestionItem>;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { refs, floatingStyles, update } = useFloating({
    placement: 'bottom-start',
    middleware: [offset(6), flip(), shift()],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
  });

  useLayoutEffect(() => {
    const rect = props.clientRect?.();
    if (!rect) return;

    const virtualEl = {
      getBoundingClientRect: () => rect,
      contextElement: props.editor.view.dom as Element,
    };

    refs.setPositionReference(virtualEl as VirtualElement);
    update();
  }, [props.clientRect, props.editor.view.dom, refs, update]);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item, range);
      }
    },
    [command, items, range]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }
        if (e.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      }

      return false;
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [items, selectedIndex, setSelectedIndex, selectItem]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const scrollContainer = useRef<HTMLDivElement>(null);
  const listContainer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const item = listContainer?.current?.children[selectedIndex] as HTMLElement;

    if (item && scrollContainer?.current) {
      updateScrollView(scrollContainer.current, item);
    }
  }, [selectedIndex]);

  return items.length > 0 ? (
    <FloatingPortal>
      <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 60 }}>
        <div
          id="mention-command"
          className="z-50 min-w-32 w-80 rounded-md border bg-popover text-popover-foreground p-1 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 overflow-hidden"
        >
          <ScrollArea className="h-80">
            <ScrollViewport ref={scrollContainer}>
              <div ref={listContainer}>
                {items.map((item, index) => {
                  const key =
                    item.kind === 'user'
                      ? item.user.id
                      : item.kind === 'page'
                        ? item.page.id
                        : `create-page-${item.name}`;
                  const pageName =
                    item.kind === 'page'
                      ? item.page.name ?? 'Unnamed'
                      : item.kind === 'create-page'
                        ? getEditorPageName(item.name)
                        : null;

                  return (
                    <button
                      type="button"
                      className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${
                        index === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : ''
                      }`}
                      key={key}
                      onClick={() => selectItem(index)}
                      onPointerDownCapture={(e) => {
                        // Added this event handler because the onClick handler was not working
                        e.preventDefault();
                        e.stopPropagation();
                        selectItem(index);
                      }}
                    >
                      <div className="flex size-10 min-w-10 items-center justify-center rounded-md border bg-background">
                        {item.kind === 'user' ? (
                          <Avatar
                            id={item.user.id}
                            name={item.user.name}
                            avatar={item.user.avatar}
                            className="size-8"
                          />
                        ) : item.kind === 'page' ? (
                          <Avatar
                            id={item.page.id}
                            name={pageName ?? 'Unnamed'}
                            avatar={item.page.avatar}
                            className="size-8"
                          />
                        ) : (
                          <FilePlus className="size-4 text-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {item.kind === 'user' ? (
                          <>
                            <p className="truncate font-medium">
                              {item.user.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.user.email}
                            </p>
                          </>
                        ) : item.kind === 'page' ? (
                          <>
                            <p className="truncate font-medium">
                              {pageName ?? 'Unnamed'}
                            </p>
                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                              <FileText className="size-3" />
                              Page
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="truncate font-medium">
                              {item.name.trim().length > 0
                                ? `Create "${pageName}"`
                                : 'Create new page'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              New page
                            </p>
                          </>
                        )}
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
  ) : null;
};

const renderItems = () => {
  let component: ReactRenderer | null = null;
  let editor: Editor | null = null;

  return {
    onStart: (props: SuggestionProps<MentionSuggestionItem>) => {
      editor = props.editor;
      props.editor.storage.mention.isOpen = true;

      component = new ReactRenderer(CommandList, {
        props: {
          ...props,
          props,
        },
        editor: props.editor,
      });
    },
    onUpdate: (props: SuggestionProps<MentionSuggestionItem>) => {
      props.editor.storage.mention.isOpen = true;
      component?.updateProps({
        ...props,
        props,
      });
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (editor) {
        editor.storage.mention.isOpen = true;
      }

      if (props.event.key === 'Escape') {
        return true;
      }

      if (navigationKeys.includes(props.event.key)) {
        return true;
      }

      // @ts-expect-error Component ref type is complex
      return component?.ref?.onKeyDown(props);
    },
    onExit: () => {
      component?.destroy();
      if (editor) {
        editor.storage.mention.isOpen = false;
      }
    },
  };
};

export const MentionExtension = Node.create<MentionOptions>({
  name: 'mention',
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
  addOptions() {
    return {
      context: {} as EditorContext,
    };
  },
  addStorage() {
    return {
      isOpen: false,
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView, {
      as: 'mention',
      className: 'inline-flex',
    });
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '@',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: MentionSuggestionItem;
        }) => {
          // increase range.to by one when the next node is of type "text"
          // and starts with a space character
          const nodeAfter = editor.view.state.selection.$to.nodeAfter;
          const overrideSpace = nodeAfter?.text?.startsWith(' ');

          if (overrideSpace) {
            range.to += 1;
          }

          if (props.kind === 'user') {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: this.name,
                  attrs: {
                    id: generateId(IdType.Mention),
                    target: props.user.id,
                  },
                },
                {
                  type: 'text',
                  text: ' ',
                },
              ])
              .run();
          } else {
            if (!this.options.context) {
              return;
            }

            const page =
              props.kind === 'page'
                ? props.page
                : createEditorPage({
                    context: this.options.context,
                    name: props.name,
                  });

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
          }

          window.getSelection()?.collapseToEnd();
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const mentionType = state.schema.nodes[this.name];
          const pageLinkType = state.schema.nodes.pageLink;
          return !!(
            mentionType &&
            pageLinkType &&
            $from.parent.type.contentMatch.matchType(mentionType) &&
            $from.parent.type.contentMatch.matchType(pageLinkType)
          );
        },
        items: async ({ query }: { query: string }) => {
          return new Promise<MentionSuggestionItem[]>((resolve) => {
            if (!this.options.context) {
              resolve([]);
              return;
            }

            const context = this.options.context;
            const { userId } = context;

            const usersPromise = window.colanode
              .executeQuery({
                type: 'user.search',
                userId,
                searchQuery: query,
                exclude: [userId],
              })
              .catch(() => [] as User[]);

            const pagesPromise = searchEditorPages({
              context,
              query,
            }).catch(() => [] as LocalPageNode[]);

            Promise.all([
              usersPromise,
              pagesPromise,
            ]).then(([users, pages]) => {
              resolve([
                ...users.slice(0, 10).map((user: User) => ({
                  kind: 'user' as const,
                  user,
                })),
                ...pages.slice(0, 10).map((page: LocalPageNode) => ({
                  kind: 'page' as const,
                  page,
                })),
                {
                  kind: 'create-page' as const,
                  name: query,
                },
              ]);
            });
          });
        },
        render: renderItems,
      }),
    ];
  },
});
