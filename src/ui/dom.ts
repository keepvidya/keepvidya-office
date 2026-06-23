// Typed DOM helper. Keeps UI declarative without a framework.
export type Child = Node | string | null | undefined;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  kids: Child | Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const key of Object.keys(props)) {
    const v = props[key];
    if (v == null) continue;
    if (key === 'class') node.className = String(v);
    else if (key === 'html') node.innerHTML = String(v);
    else if (key === 'text') node.textContent = String(v);
    else if (key === 'style') node.setAttribute('style', String(v));
    else if (key.startsWith('on') && typeof v === 'function')
      node.addEventListener(key.slice(2).toLowerCase(), v as EventListener);
    else node.setAttribute(key, String(v));
  }
  for (const c of Array.isArray(kids) ? kids : [kids]) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function mount(host: HTMLElement, node: Node): void {
  host.replaceChildren(node);
}
