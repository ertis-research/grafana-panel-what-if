import { FormatEditor } from './components/editors/formatEditor';
import { ISelect, Language, LogLevelPanel } from './utils/types';
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
import { enumToSelect } from 'utils/utils';

const VariableOptions: ISelect[] = getOptionsVariable(getTemplateSrv())
const LogLevelOptions: ISelect[] = enumToSelect(LogLevelPanel)

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
      path: 'logLevel',
      defaultValue: LogLevelPanel.INFO,
      name: 'Log level',
      category: ['General'],
      settings: {
        options: LogLevelOptions,
      }
    }).addSelect({
      path: 'activeQuery',
      name: 'Active query variable',
      category: ['General'],
      settings: {
        options: VariableOptions
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
