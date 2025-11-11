import { DataFrame, PanelData, TypedVariableModel, dateTime } from "@grafana/data"
import { LocationService, TemplateSrv } from "@grafana/runtime"
import { IData, ISelect } from "../types"
import moment from "moment"
import { getMean } from "utils/utils"
import log from "utils/logger"

export const checkIfVariableExists = (templateSrv: TemplateSrv, id?: string) => {
    const dashboard_variables: TypedVariableModel[] = templateSrv.getVariables().filter(item => item.type === 'constant' || item.type === 'textbox' || item.type === 'custom')
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
        .filter((item: TypedVariableModel) => item.type === 'constant' || item.type === 'textbox' || item.type === 'custom')
        .map((item: TypedVariableModel) => {
            return {
                label: item.name,
                value: item.name,
                description: (item.description === null) ? undefined : item.description
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

export const getArrayOfData = (data: PanelData, idQuery: string, fieldTag: string, isListValues: boolean, hasSpecificNumberOfValues?: number) => {
    log.info("[getArrayOfData] Starting to extract array of data");
    log.debug("[getArrayOfData] idQuery:", idQuery, "fieldTag:", fieldTag, "isListValues:", isListValues, "hasSpecificNumberOfValues:", hasSpecificNumberOfValues);

    let res: IData[] = []
    const serieData: DataFrame | undefined = data.series.find((serie) => serie.refId === idQuery)
    if (!serieData) {
        log.warn(`[getArrayOfData] No series found with refId=${idQuery}`);
        return res;
    }
    log.debug("[getArrayOfData] Series found:", serieData);

    const fieldTagData = serieData.fields.find((field) => field.name === fieldTag)
    if (!fieldTagData || fieldTagData.values.length === 0) {
        log.warn(`[getArrayOfData] Field '${fieldTag}' not found or empty`);
        return res;
    }
    log.debug("[getArrayOfData] Field tag data found with", fieldTagData.values.length, "values");

    const allValues = serieData.fields.filter((field) => field.name !== fieldTag)
    const arrValues = fieldTagData.values

    log.debug("[getArrayOfData] allValues (fields excluding fieldTag):", allValues.map(f => f.name));
    log.trace("[getArrayOfData] allValues detailed content:", allValues);
    log.debug("[getArrayOfData] arrValues (fieldTag values):", arrValues);

    const aggregatedData = new Map<any, number[]>();

    if (arrValues !== null && arrValues !== undefined && arrValues.length > 0) {
        log.debug("[getArrayOfData] Starting aggregation loop...");
        for (let idx = 0; idx < arrValues.length; idx++) {
            const currentId = arrValues.get(idx);

            let values: number[] = []
            allValues.forEach((field) => {
                values.push(field.values.get(idx))
            })

            log.trace(`[getArrayOfData] Index ${idx}: tag='${currentId}', raw values:`, values);

            if (aggregatedData.has(currentId)) {
                const existingValues = aggregatedData.get(currentId)!;
                aggregatedData.set(currentId, existingValues.concat(values));
                log.trace(`[getArrayOfData] Appended values to existing tag='${currentId}'`);
            } else {
                aggregatedData.set(currentId, values);
                log.trace(`[getArrayOfData] Created new entry for tag='${currentId}'`);
            }
        }
        log.debug("[getArrayOfData] Aggregation loop finished.");
        log.trace("[getArrayOfData] Aggregated data map:", aggregatedData);
    } else {
        log.warn("[getArrayOfData] arrValues (fieldTag values) is empty or null.");
        return res;
    }

    log.debug("[getArrayOfData] Processing aggregated data to create final result...");
    aggregatedData.forEach((allRawValues, id) => {
        let mean = getMean(allRawValues);
        log.trace(`[getArrayOfData] Processing tag='${id}': total raw values:`, allRawValues, "mean:", mean);

        let finalValues: number[] = allRawValues;

        if (isListValues && hasSpecificNumberOfValues !== undefined && hasSpecificNumberOfValues > 0) {
            finalValues = finalValues.map((v) => (v === null) ? mean : v);
            if (finalValues.length < hasSpecificNumberOfValues) {
                const padding = Array(hasSpecificNumberOfValues - finalValues.length).fill(null);
                finalValues = finalValues.concat(padding);
                log.trace(`[getArrayOfData] Padded values for tag='${id}' to ${hasSpecificNumberOfValues}:`, finalValues);
            } else if (finalValues.length > hasSpecificNumberOfValues) {
                finalValues = finalValues.slice(0, hasSpecificNumberOfValues);
                log.trace(`[getArrayOfData] Trimmed values for tag='${id}' to ${hasSpecificNumberOfValues}:`, finalValues);
            }
        }
        res.push({
            id: id,
            raw_values: finalValues,
            default_value: mean
        });
        log.trace(`[getArrayOfData] Final result added for tag='${id}':`, res[res.length - 1]);
    });

    log.info(`[getArrayOfData] Completed extraction of ${res.length} unique data items`);
    log.debug("[getArrayOfData] Final data array:", res);

    return res
}

export const getExtraInfo = (data: PanelData, idQuery: string, fieldName: string, fieldValue: string) => {
    let res: { [key: string]: any } = {}
    const serieData: DataFrame | undefined = data.series.find((serie) => serie.refId === idQuery)
    if (serieData) {
        const fieldNameData = serieData.fields.find((field) => field.name === fieldName)
        const fieldValueData = serieData.fields.find((field) => field.name === fieldValue)
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


