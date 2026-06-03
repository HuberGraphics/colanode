import { eq, useLiveQuery } from '@tanstack/react-db';
import { JSONContent } from '@tiptap/core';

import { LocalPageNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Link } from '@colanode/ui/components/ui/link';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { defaultClasses } from '@colanode/ui/editor/classes';

interface PageLinkRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const PageLinkRenderer = ({ node }: PageLinkRendererProps) => {
  const workspace = useWorkspace();
  const target = node.attrs?.target;

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
      <span className={defaultClasses.pageLinkMissing} role="presentation">
        Unknown page
      </span>
    );
  }

  const name = page.name ?? 'Unnamed';

  return (
    <Link
      from="/workspace/$userId"
      to="$nodeId"
      params={{ nodeId: target }}
      className={defaultClasses.pageLink}
    >
      <Avatar size="small" id={target} name={name} avatar={page.avatar} />
      <span role="presentation">{name}</span>
    </Link>
  );
};
