import { DataFrame, PanelData, TypedVariableModel, dateTime } from "@grafana/data"
import { LocationService, TemplateSrv } from "@grafana/runtime"
import { IData, ISelect } from "../types"
import moment from "moment"
import { getMean } from "utils/utils"

export const checkIfVariableExists = (templateSrv: TemplateSrv, id?: string) => {
    const dashboard_variables: TypedVariableModel[] = templateSrv.getVariables().filter(item => item.type === 'constant')
    if (id === undefined || !dashboard_variables.find((v: TypedVariableModel) => v.name === id)) {
        throw new Error('It is necessary to assign a constant variable')
    }
}

export const saveVariableValue = (locationService: LocationService, id: string, value: string) => {
    let queryObj: any = {}
    queryObj[("var-" + id)] = value

    locationService.partial(queryObj, true)
}

export const getVariableValue = (replaceVariables: any, id: string) => {
    return replaceVariables('$' + id)
}

export const getOptionsVariable = (templateSrv: TemplateSrv): ISelect[] => {
    return templateSrv.getVariables()
        .filter((item: TypedVariableModel) => item.type === 'constant')
        .map((item: TypedVariableModel) => {
            return {
                label: item.name,
                value: item.name,
                description: (item.description == null) ? undefined : item.description
            }
        })
}

const applyType = (value: any) => {
    if (moment(value).isValid()) {
        return dateTime(Date.parse(value))
    } else if (!isNaN(value)) {
        return Number(value)
    } else {
        return String(value)
    }
}

export const getArrayOfData = (data: PanelData, idQuery: string, fieldTag: string, isListValues:boolean, hasSpecificNumberOfValues?: number) => {
    let res: IData[] = []
    const serieData: DataFrame | undefined = data.series.find((serie) => serie.refId == idQuery)
    if (serieData) {
        const fieldTagData = serieData.fields.find((field) => field.name == fieldTag)
        if (fieldTagData && fieldTagData.values.length > 0) {
            const allValues = serieData.fields.filter((field) => field.name != fieldTag)
            const arrValues = fieldTagData.values
            if(arrValues != null && arrValues != undefined) {
                arrValues.toArray().forEach((d: string, idx: number) => {
                    let values: number[] = []
                    allValues.forEach((field) => {
                        values.push(field.values.get(idx))
                    })
                    let mean = getMean(values)
                    if (isListValues && hasSpecificNumberOfValues != undefined && hasSpecificNumberOfValues > 0) {
                        values = values.map((v) => (v == null) ? mean : v)
                        if (values.length < hasSpecificNumberOfValues) {
                            values = values.concat(Array(values.length-hasSpecificNumberOfValues).fill(null))
                        } else if (values.length > hasSpecificNumberOfValues) {
                            values = values.slice(0, hasSpecificNumberOfValues)
                        }
                    } 
                    res.push({
                        id: d,
                        raw_values: values,
                        default_value: mean
                    })
                })
            }
            
        }
    }
    console.log("Datos cargados", res)
    return res
}

export const getExtraInfo = (data: PanelData, idQuery: string, fieldName: string, fieldValue: string) => {
    let res: { [key: string]: any } = {}
    const serieData: DataFrame | undefined = data.series.find((serie) => serie.refId == idQuery)
    if (serieData) {
        const fieldNameData = serieData.fields.find((field) => field.name == fieldName)
        const fieldValueData = serieData.fields.find((field) => field.name == fieldValue)
        if (fieldNameData && fieldValueData) {
            fieldNameData.values.toArray().forEach((name: string, idx: number) => {
                res = {
                    ...res,
                    [name]: applyType(fieldValueData.values.get(idx))
                }
            })
        }
    }
    return res
}