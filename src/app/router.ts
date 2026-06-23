import { type FileType, isFileType } from '../domain/file';

export type Route = { name: 'home' } | { name: 'editor'; type: FileType; id: string };

// Pure hash → route mapping (unit-tested).
export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const [seg, id] = clean.split('/');
  if (isFileType(seg) && id) return { name: 'editor', type: seg, id };
  return { name: 'home' };
}

export function routeToHash(route: Route): string {
  return route.name === 'home' ? '#/home' : `#/${route.type}/${route.id}`;
}

export interface Router {
  start(): void;
  go(hash: string): void;
  refresh(): void;
}

export function createRouter(onRoute: (route: Route) => void | Promise<void>): Router {
  const handle = (): void => {
    void onRoute(parseHash(window.location.hash));
  };
  return {
    start() {
      window.addEventListener('hashchange', handle);
      handle();
    },
    go(hash) {
      if (window.location.hash === hash) handle();
      else window.location.hash = hash;
    },
    refresh() {
      handle();
    },
  };
}
