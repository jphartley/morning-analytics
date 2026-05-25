export function omitMarkdownNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  // react-markdown passes an internal AST node prop that React must not spread onto DOM elements.
  const propsWithoutNode = { ...props };
  delete propsWithoutNode.node;
  return propsWithoutNode;
}
