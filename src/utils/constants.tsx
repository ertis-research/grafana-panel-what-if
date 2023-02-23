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

export const DefaultImportData = {
    label: 'Set datetime',
    value: ImportDataEnum.DATETIME_SET,
}