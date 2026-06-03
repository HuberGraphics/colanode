import { describe, expect, it } from 'vitest';

import { extractBlocksMentions } from '@colanode/core/lib/mentions';
import { Block } from '@colanode/core/registry/block';

describe('extractBlocksMentions', () => {
  it('ignores inline page links and extracts only user mentions', () => {
    const blocks: Record<string, Block> = {
      root: {
        id: 'root',
        type: 'paragraph',
        parentId: 'document',
        index: 'a0',
        content: [
          {
            type: 'pageLink',
            attrs: {
              id: 'page-link-1',
              target: 'page-target',
            },
          },
          {
            type: 'mention',
            attrs: {
              id: 'mention-1',
              target: 'user-target',
            },
          },
        ],
      },
    };

    expect(extractBlocksMentions('root', blocks)).toEqual([
      {
        id: 'mention-1',
        target: 'user-target',
      },
    ]);
  });
});
