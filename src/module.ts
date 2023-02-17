import { ModelEditor } from './components/editors/modelEditor';
import { PanelPlugin } from '@grafana/data';
import { Main } from './components/main';
import './css/bootstrap-grid.css';
import './css/grid.css';
import './css/others.css';
import { Options } from 'utils/types';

export const plugin = new PanelPlugin<Options>(Main).setPanelOptions((builder) => {
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
