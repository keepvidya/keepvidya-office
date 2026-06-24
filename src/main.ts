// Browser composition root: build real adapters and start the app.
import './styles/theme.css';
import './styles/app.css';
import { createApp } from './app/create-app';
import { createIndexedDbStorage } from './adapters/storage/indexeddb-storage';
import { createDomTheme } from './adapters/theme/dom-theme';
import { createIdGen, createSystemClock } from './adapters/system/system';
import { createConfigurableLlm } from './adapters/llm/configurable-llm';
import { createLocalProviderSettings } from './adapters/settings/local-provider-settings';

const host = document.getElementById('app');
if (host) {
  const theme = createDomTheme();
  theme.set(theme.get()); // apply persisted theme on boot
  const settings = createLocalProviderSettings();
  createApp(host, {
    storage: createIndexedDbStorage(),
    clock: createSystemClock(),
    id: createIdGen(),
    theme,
    settings,
    llm: createConfigurableLlm(settings), // mock by default; Shiva/BYOK via settings
  }).start();
}
