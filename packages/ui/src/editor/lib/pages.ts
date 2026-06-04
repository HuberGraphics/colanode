import { NodeListQueryInput } from '@colanode/client/queries';
import { EditorContext, LocalNode, LocalPageNode } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { collections } from '@colanode/ui/collections';

export const getEditorPageName = (name: string) => {
  const trimmedName = name.trim();
  return trimmedName.length > 0 ? trimmedName : 'Untitled';
};

export const searchEditorPages = async ({
  context,
  query,
}: {
  context: EditorContext;
  query: string;
}): Promise<LocalPageNode[]> => {
  const trimmedQuery = query.trim();
  const filters: NodeListQueryInput['filters'] = [
    {
      field: ['type'],
      operator: 'eq',
      value: 'page',
    },
    {
      field: ['id'],
      operator: 'not_eq',
      value: context.documentId,
    },
  ];

  if (trimmedQuery.length > 0) {
    filters.push({
      field: ['name'],
      operator: 'like',
      value: `%${trimmedQuery}%`,
    });
  }

  const nodes = await window.colanode.executeQuery({
    type: 'node.list',
    userId: context.userId,
    filters,
    sorts: [
      {
        field: ['name'],
        direction: 'asc',
        nulls: 'last',
      },
    ] satisfies NodeListQueryInput['sorts'],
    limit: 50,
  });

  return nodes.filter(
    (node: LocalNode): node is LocalPageNode => node.type === 'page'
  );
};

export const createEditorPage = ({
  context,
  name,
}: {
  context: EditorContext;
  name: string;
}): LocalPageNode => {
  const page: LocalPageNode = {
    id: generateId(IdType.Page),
    type: 'page',
    name: getEditorPageName(name),
    avatar: null,
    parentId: context.documentId,
    rootId: context.rootId,
    createdAt: new Date().toISOString(),
    createdBy: context.userId,
    updatedAt: null,
    updatedBy: null,
    localRevision: '0',
    serverRevision: '0',
  };

  collections.workspace(context.userId).nodes.insert(page);
  return page;
};
