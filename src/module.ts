import { FormatEditor } from './components/editors/formatEditor';
import { Language } from './utils/types';
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
      defaultValue: Language.English,
      name: 'Plugin language',
      category: ['General'],
      settings: {
        options: [
          {
            value: Language.English,
            label: 'English',
          },
          {
            value: Language.Spanish,
            label: 'Spanish',
          },
        ],
      }
    }).addCustomEditor({
      path: 'formats',
      id: 'formats',
      name: 'Formats',
      category: ['Formats'],
      editor: FormatEditor
    }).addCustomEditor({
      path: 'models',
      id: 'models',
      name: 'Models',
      category: ['Models'],
      editor: ModelEditor
    })
})
