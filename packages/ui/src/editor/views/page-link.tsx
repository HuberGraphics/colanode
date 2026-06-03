import { eq, useLiveQuery } from '@tanstack/react-db';
import { type NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

import { LocalPageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Link } from '@colanode/ui/components/ui/link';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { defaultClasses } from '@colanode/ui/editor/classes';

export const PageLinkNodeView = ({ node }: NodeViewProps) => {
  const workspace = useWorkspace();
  const target = node.attrs.target;

  const pageGetQuery = useLiveQuery(
    (q) =>
      q
        .from({ nodes: workspace.collections.nodes })
        .where(({ nodes }) => eq(nodes.id, target))
        .findOne(),
    [workspace.userId, target]
  );

  const page =
    pageGetQuery.data?.type === 'page'
      ? (pageGetQuery.data as LocalPageNode)
      : null;

  if (!target || !page) {
    return (
      <NodeViewWrapper
        data-id={node.attrs.id}
        className={defaultClasses.pageLinkMissing}
      >
        <span role="presentation">Unknown page</span>
      </NodeViewWrapper>
    );
  }

  const name = page.name ?? 'Unnamed';

  return (
    <NodeViewWrapper data-id={node.attrs.id} className="inline-flex">
      <Link
        from="/workspace/$userId"
        to="$nodeId"
        params={{ nodeId: target }}
        className={defaultClasses.pageLink}
      >
        <Avatar size="small" id={target} name={name} avatar={page.avatar} />
        <span role="presentation">{name}</span>
      </Link>
    </NodeViewWrapper>
  );
};
