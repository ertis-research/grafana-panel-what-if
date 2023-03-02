import { getVariableValue } from "./handleGrafanaVariable"
import { ISelect } from "./types"

export enum Steps {
    step_1 = 1,
    step_2 = 2,
    step_3 = 3,
    step_4 = 4,
    step_5 = 5
}

export enum Mode {
    EDIT = 'Save',
    CREATE = 'Add'
}

export enum ImportDataEnum {
    EXCEL = 0,
    DATETIME_SET = 1,
    DATETIME_VARIABLE_GRAFANA = 2,
    DATETIME_QUERY = 3
}

export const ImportDataOptions = [
    { 
        label: 'CSV', 
        value: ImportDataEnum.EXCEL
    },
    { 
        label: 'Datetime', 
        value: ImportDataEnum.DATETIME_SET, 
        options: [
            {
                label: 'Set datetime',
                value: ImportDataEnum.DATETIME_SET,
            },
            {
                label: 'Variable of Grafana',
                value: ImportDataEnum.DATETIME_VARIABLE_GRAFANA
            },
            {
                label: 'Using query',
                value: ImportDataEnum.DATETIME_QUERY
            }
        ]
    }
]

export const VariablesGrafanaOptions = (replaceVariables:any) : ISelect[] => [
    {
        label: 'From',
        value: '${__from:date}',
        description: getVariableValue(replaceVariables, '{__from:date:iso}')
    },
    {
        label: 'To',
        value: '${__to:date}',
        description: getVariableValue(replaceVariables, '{__to:date:iso}')
    }
]

export const DefaultImportData = {
    label: 'Set datetime',
    value: ImportDataEnum.DATETIME_SET,
}