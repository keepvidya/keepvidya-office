// Browser composition root: build real adapters and start the app.
import './styles/theme.css';
import './styles/app.css';
import { createApp } from './app/create-app';
import { createIndexedDbStorage } from './adapters/storage/indexeddb-storage';
import { createDomTheme } from './adapters/theme/dom-theme';
import { createIdGen, createSystemClock } from './adapters/system/system';
import { createFixtureLlm } from './adapters/llm/mock-llm';

const host = document.getElementById('app');
if (host) {
  const theme = createDomTheme();
  theme.set(theme.get()); // apply persisted theme on boot
  createApp(host, {
    storage: createIndexedDbStorage(),
    clock: createSystemClock(),
    id: createIdGen(),
    theme,
    llm: createFixtureLlm(), // mock model for now; Shiva/BYOK adapter at M4
  }).start();
}
