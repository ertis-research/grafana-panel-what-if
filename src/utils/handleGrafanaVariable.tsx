import { TypedVariableModel } from "@grafana/data"
import { LocationService, TemplateSrv } from "@grafana/runtime"
import { ISelect } from "./types"

export const checkIfVariableExists = (templateSrv:TemplateSrv, id?:string) => {
    const dashboard_variables:TypedVariableModel[] = templateSrv.getVariables().filter(item => item.type == 'constant')
    if(id == undefined || !dashboard_variables.find((v:TypedVariableModel) => v.name == id)) {
        throw new Error('It is necessary to assign a constant variable')
    }
}

export const saveVariableValue = (locationService:LocationService, id:string, value:string) => {
    let queryObj:any = {}
    queryObj[("var-" + id)] = value

    locationService.partial(queryObj, true)
}

export const getVariableValue = (replaceVariables:any, id:string,) => {
    return replaceVariables('$' + id)
}

export const getOptionsVariable = (templateSrv:TemplateSrv) : ISelect[] => {
    return templateSrv.getVariables()
        .filter((item:TypedVariableModel) => item.type == 'constant')
        .map((item:TypedVariableModel) => {
        return {
            label : item.name,
            value : item.name,
            description : (item.description == null) ? undefined : item.description
        }
    })
}