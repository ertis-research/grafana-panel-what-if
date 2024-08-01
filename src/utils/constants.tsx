import { dateTime } from "@grafana/data"
import { getVariableValue } from "./datasources/grafana"
import { ISelect } from "./types"
import { ILocalization } from "./localization/scheme"
import { dateTimeLocalToString } from "./utils"

export const varInput = '$input'
export const varEachInput = '$each'
export const varEachInputEnd = '$end-each'
export const variableOutput = '$output'
export const idDefault = 'basic_defaultData'
export const idNew = 'basic_newValue'

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

/*
export const ImportDataOptions = (messages:ILocalization) => {
    return [
        { 
            label: 'CSV', 
            value: ImportDataEnum.EXCEL
        },
        { 
            label: 'Datetime', 
            value: ImportDataEnum.DATETIME_SET, 
            options: [
                {
                    label: messages._panel._step2.setDatetime,
                    value: ImportDataEnum.DATETIME_SET,
                },
                {
                    label: messages._panel._step2.variablesGrafana,
                    value: ImportDataEnum.DATETIME_VARIABLE_GRAFANA
                },
                {
                    label: messages._panel._step2.usingQuery,
                    value: ImportDataEnum.DATETIME_QUERY
                }
            ]
        }
    ]
}*/
/*
export const IntervalModeOptions = (messages:ILocalization) => { 
    return [
        {
            label: "%",
            value: IntervalModeEnum.porcentage
        },
        {
            label: messages._panel._step3.units,
            value: IntervalModeEnum.units
        }
    ]
}*/

export const ImportDataOptions = (messages: ILocalization) => {
    return [
        {
            label: messages._panel._step2.setDatetime,
            value: ImportDataEnum.DATETIME_SET,
        },
        {
            label: 'CSV',
            value: ImportDataEnum.EXCEL
        },
        {
            label: messages._panel._step2.variablesGrafana,
            value: ImportDataEnum.DATETIME_VARIABLE_GRAFANA
        }
    ]
}

export const VariablesGrafanaOptions = (replaceVariables: any): ISelect[] => {
    const from = dateTime(Date.parse(getVariableValue(replaceVariables, '{__from:date:iso}')))
    const to = dateTime(Date.parse(getVariableValue(replaceVariables, '{__to:date:iso}')))
    return [
        {
            label: 'From',
            value: from,
            description: dateTimeLocalToString(from)
        },
        {
            label: 'To',
            value: to,
            description: dateTimeLocalToString(to)
        }
    ]
}


export const DefaultImportData = (messages: ILocalization) => {
    return {
        label: messages._panel._step2.setDatetime,
        value: ImportDataEnum.DATETIME_SET
    }
}
