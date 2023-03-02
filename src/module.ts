import { Language } from './utils/types';
import { ModelEditor } from './components/editors/modelEditor';
import { PanelPlugin, TypedVariableModel } from '@grafana/data';
import { Main } from './components/main';
import './css/bootstrap-grid.css';
import './css/grid.css';
import './css/others.css';
import { ISelect, Options, FormatTags } from 'utils/types';
import { getTemplateSrv } from '@grafana/runtime';

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

const getOptionsVariable = () : ISelect[] => {
  return getTemplateSrv().getVariables()
    .filter((item:TypedVariableModel) => item.type == 'constant')
    .map((item:TypedVariableModel) => {
      return {
        label : item.name,
        value : item.name,
        description : (item.description == null) ? undefined : item.description
      }
    })
}

const OptionsVariable = getOptionsVariable()