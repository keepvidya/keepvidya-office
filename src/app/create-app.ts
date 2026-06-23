// Composition root — wires use-cases + ports + UI. The only place that knows
// about both the domain and the views. Adapters are injected (real in main.ts,
// fakes in tests), satisfying Dependency Inversion.
import { el, mount } from '../ui/dom';
import { icons } from '../ui/icons';
import { renderHome } from '../ui/home';
import { renderEditor } from '../ui/editor-view';
import { type Route, createRouter, routeToHash } from './router';
import { createFile, deleteFile, listFiles, openFile, renameFile } from '../domain/use-cases';
import { currentTheme, toggleTheme } from '../domain/theme';
import type { ClockPort, IdPort, StoragePort, ThemePort } from '../domain/ports';
import type { FileType } from '../domain/file';

export interface AppPorts {
  storage: StoragePort;
  clock: ClockPort;
  id: IdPort;
  theme: ThemePort;
}

export interface App {
  start(): void;
}

export function createApp(host: HTMLElement, ports: AppPorts): App {
  const deps = { storage: ports.storage, clock: ports.clock, id: ports.id };
  const router = createRouter(render);

  async function newAndGo(type: FileType): Promise<void> {
    const r = await createFile(deps, type);
    if (r.ok) router.go(routeToHash({ name: 'editor', type, id: r.value.id }));
  }

  async function render(route: Route): Promise<void> {
    if (route.name === 'editor') {
      const res = await openFile(deps, route.id);
      if (!res.ok) {
        router.go('#/home');
        return;
      }
      mount(
        host,
        shell(
          renderEditor({
            file: res.value,
            onBack: () => router.go('#/home'),
            onRename: (name) => void renameFile(deps, route.id, name),
          }),
        ),
      );
      return;
    }
    const files = await listFiles(deps);
    mount(
      host,
      shell(
        renderHome({
          files,
          onNew: (type) => void newAndGo(type),
          onOpen: (f) => router.go(routeToHash({ name: 'editor', type: f.type, id: f.id })),
          onDelete: async (f) => {
            await deleteFile(deps, f.id);
            router.refresh();
          },
        }),
      ),
    );
  }

  function shell(content: HTMLElement): HTMLElement {
    return el('div', { class: 'screen' }, [rail(), el('div', { class: 'main' }, [content])]);
  }

  function rail(): HTMLElement {
    const themeIcon = currentTheme(ports.theme) === 'light' ? icons.moon : icons.sun;
    const rbtn = (icon: string, tip: string, onclick: () => void): HTMLElement =>
      el('button', { class: 'rbtn', 'data-tip': tip, html: icon, onclick });
    return el('div', { class: 'rail' }, [
      el('div', { class: 'logo', text: 'के', title: 'Keepvidya Office', onclick: () => router.go('#/home') }),
      rbtn(icons.home, 'Home', () => router.go('#/home')),
      rbtn(icons.writer, 'New document', () => void newAndGo('writer')),
      rbtn(icons.sheets, 'New spreadsheet', () => void newAndGo('sheets')),
      rbtn(icons.slides, 'New presentation', () => void newAndGo('slides')),
      el('div', { class: 'sp' }),
      el('button', {
        class: 'rbtn',
        'data-tip': 'Theme',
        'data-testid': 'theme-toggle',
        html: themeIcon,
        onclick: () => {
          toggleTheme(ports.theme);
          router.refresh();
        },
      }),
    ]);
  }

  return {
    start() {
      router.start();
    },
  };
}
