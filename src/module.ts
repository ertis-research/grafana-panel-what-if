import { FormatEditor } from './components/editors/formatEditor';
import { Language } from './utils/types';
import { ModelEditor } from './components/editors/modelEditor';
import { PanelPlugin } from '@grafana/data';
import { Main } from './components/main';
import './css/bootstrap-grid.css';
import './css/grid.css';
import './css/others.css';
import { Options, FormatTags } from 'utils/types';
import { getTemplateSrv } from '@grafana/runtime';
import { getOptionsVariable } from 'utils/handleGrafanaVariable';

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
    }).addNumberInput({
      path: 'decimals',
      defaultValue: undefined,
      name : 'Decimals',
      category: ['General']
    }).addCustomEditor({
      path : 'formats',
      id: 'formats',
      name : 'Formats',
      category : ['Formats'],
      editor : FormatEditor
    }).addCustomEditor({
      path : 'models',
      id: 'models',
      name : 'Models',
      category : ['Models'],
      editor : ModelEditor
    }).addSelect({
      path: 'varTags',
      description: 'Name of the query field that indicates the id to which the data refers.',
      name: 'Variable tags',
      defaultValue: undefined,
      category: ['General'],
      settings: {
        options: OptionsVariable
      }
    }).addSelect({
      path: 'varTime',
      description: 'Name of the query field that indicates the id to which the data refers.',
      name: 'Variable time',
      defaultValue: undefined,
      category: ['General'],
      settings: {
        options: OptionsVariable
      }
    }).addRadio({
      path: 'formatTags',
      defaultValue: 'dq',
      name: 'Format for list of tags',
      category: ['General'],
      settings: {
        options: [
          {
            value: FormatTags.DoubleQuotes,
            label: 'Double quotes',
          },
          {
            value: FormatTags.SingleQuotes,
            label: 'Single quotes',
          },
          {
            value: FormatTags.None,
            label: 'None',
          }
        ],
      }
    })
})

const OptionsVariable = getOptionsVariable(getTemplateSrv())