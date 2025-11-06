import { FormatEditor } from './components/editors/formatEditor';
import { ISelect, Language } from './utils/types';
import { ModelEditor } from './components/editors/modelEditor';
import { PanelPlugin } from '@grafana/data';
import { Main } from './components/main';
import './css/bootstrap-grid.css';
import './css/grid.css';
import './css/others.css';
import { Options } from 'utils/types';
import { ExtraCalcEditor } from 'components/editors/extraCalcEditor';
import { getOptionsVariable } from 'utils/datasources/grafana';
import { getTemplateSrv } from '@grafana/runtime';

const OptionsVariable: ISelect[] = getOptionsVariable(getTemplateSrv())

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
    }).addSelect({
      path: 'activeQuery',
      name: 'Active query variable',
      category: ['General'],
      settings: {
        options: OptionsVariable
      }
    }).addCustomEditor({
      path: 'formats',
      id: 'formats',
      name: 'Formats',
      category: ['Formats'],
      editor: FormatEditor
    }).addCustomEditor({
      path: 'extraCalcs',
      id: 'extraCalcs',
      name: 'Extra calculations',
      category: ['Extra calculations'],
      editor: ExtraCalcEditor
    }).addCustomEditor({
      path: 'models',
      id: 'models',
      name: 'Models',
      category: ['Models'],
      editor: ModelEditor
    })
})
