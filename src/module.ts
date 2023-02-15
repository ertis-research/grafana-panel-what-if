import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

import './css/bootstrap-grid.css';
import './css/grid.css';
import './css/others.css';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    .addRadio({
      path: 'language',
      defaultValue: 'gb',
      name: 'Plugin language',
      category: ['General'],
      settings: {
        options: [
          {
            value: 'gb',
            label: 'English',
          },
          {
            value: 'esp',
            label: 'Spanish',
          },
        ],
      }
    });
});
