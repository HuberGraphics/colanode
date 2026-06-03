import { describe, expect, it } from 'vitest';

import {
  buildEditorContent,
  mapBlocksToContents,
  mapContentsToBlocks,
} from './editor';
import { Block, RichTextContent } from '@colanode/core';

describe('editor content mapping', () => {
  it('preserves inline page links when mapping contents to blocks', () => {
    const blocks = mapContentsToBlocks(
      'page-root',
      [
        {
          type: 'paragraph',
          attrs: {
            id: 'block-1',
          },
          content: [
            {
              type: 'text',
              text: 'See ',
            },
            {
              type: 'pageLink',
              attrs: {
                id: 'page-link-1',
                target: 'page-target',
              },
            },
          ],
        },
      ],
      new Map()
    );

    expect(blocks['block-1']?.content).toEqual([
      {
        type: 'text',
        text: 'See ',
        attrs: undefined,
        marks: undefined,
      },
      {
        type: 'pageLink',
        text: undefined,
        attrs: {
          id: 'page-link-1',
          target: 'page-target',
        },
        marks: undefined,
      },
    ]);
  });

  it('reconstructs inline page links when building editor content', () => {
    const block: Block = {
      id: 'block-1',
      type: 'paragraph',
      parentId: 'page-root',
      index: 'a0',
      content: [
        {
          type: 'text',
          text: 'See ',
        },
        {
          type: 'pageLink',
          attrs: {
            id: 'page-link-1',
            target: 'page-target',
          },
        },
      ],
    };
    const content: RichTextContent = {
      type: 'rich_text',
      blocks: {
        [block.id]: block,
      },
    };

    expect(mapBlocksToContents('page-root', [block])).toEqual([
      {
        type: 'paragraph',
        attrs: {
          id: 'block-1',
        },
        content: [
          {
            type: 'text',
            text: 'See ',
          },
          {
            type: 'pageLink',
            attrs: {
              id: 'page-link-1',
              target: 'page-target',
            },
          },
        ],
      },
    ]);

    expect(buildEditorContent('page-root', content).content?.[0]).toEqual({
      type: 'paragraph',
      attrs: {
        id: 'block-1',
      },
      content: [
        {
          type: 'text',
          text: 'See ',
        },
        {
          type: 'pageLink',
          attrs: {
            id: 'page-link-1',
            target: 'page-target',
          },
        },
      ],
    });
  });
});
