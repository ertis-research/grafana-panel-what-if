import { ModelEditor } from './components/editors/modelEditor';
import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { Main } from './components/main';

import './css/bootstrap-grid.css';
import './css/grid.css';
import './css/others.css';

export const plugin = new PanelPlugin<SimpleOptions>(Main).setPanelOptions((builder) => {
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
    }).addCustomEditor({
      path : 'models',
      id: 'models',
      name : 'Models',
      category : ['Models'],
      editor : ModelEditor
    });
});
