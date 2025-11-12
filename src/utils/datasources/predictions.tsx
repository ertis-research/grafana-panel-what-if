import { PreprocessCodeDefault } from "../default";
import { IData, IDataCollection, IDataPred, IFormat, IInterval, IModel, IResult, IScaler, IntervalTypeEnum, PostChangeIDataPred } from "../types"
//import * as dfd from "danfojs"
import { idDefault, idNew, varEachInput, varEachInputEnd, varEachTag, varEachTagEnd, varInput, varTag, variableOutput } from "../constants"
import vm from 'vm'
import { decimalCount, deepCopy, getMean, round, transposeMatrix } from "../utils"
import { Buffer } from 'buffer'
import log from "utils/logger";


/* -------------------------------------------------- */
/* PREDICTION WORKFLOW FUNCTIONS */
/* -------------------------------------------------- */

export const predictAllCollections = async (model: IModel, allData: IDataCollection[]) => {
    log.info("[predictAllCollections] Starting prediction for all collections");
    for (const [i, d] of allData.entries()) {
        log.debug(`[predictAllCollections] Predicting collection index ${i}`);
        allData[i] = { ...d, results: await predictData(model, d) }
    }
    log.info("[predictAllCollections] All collections predicted successfully");
    log.debug("[predictAllCollections] Final results:", allData);
    return allData
}

const predictData = async (model: IModel, dataCollection: IDataCollection) => {
    log.info("[predictData] Starting data prediction for collection:", dataCollection.id);
    let results: IResult[] = prepareData(dataCollection, model.numberOfValues)
    return await prepareAndPredictResults(model, results)
}

export const prepareAndPredictResults = async (model: IModel, results: IResult[]) => {
    log.info("[prepareAndPredictResults] Starting full prepare + predict pipeline");
    const res = await prepareToPredict(model, results)
    log.debug("[prepareAndPredictResults] Prepared data:", res);
    const finalResults = await predictResults(model, res.newData, res.newResults)
    log.info("[prepareAndPredictResults] Pipeline completed successfully");
    return finalResults
}

export const predictResults = async (model: IModel, data: IDataPred[], results: IResult[]) => {
    log.info("[predictResults] Sending prediction request to model endpoint");
    const predictions: any = await sendRequest(model, data)
    log.info("[predictResults] Predictions received successfully");
    return results.map<IResult>((r: IResult, indx: number) => { return { ...r, result: predictions[indx] } })
}

export const prepareToPredict = async (model: IModel, results: IResult[]): Promise<PostChangeIDataPred> => {
    log.info("[prepareToPredict] Preparing data for prediction");
    let dataToPredict: IDataPred[] = []
    for (const [i, r] of results.entries()) {
        log.debug(`[prepareToPredict] Processing result index ${i}`);
        log.debug(`[prepareToPredict] Original data snapshot:`, deepCopy(r.data));
        let finalData = deepCopy(r.data)
        if (model.preprocess) {
            log.debug("[prepareToPredict] Applying preprocess script");
            finalData = await applyPreprocess(model.preprocess, finalData)
            log.debug("[prepareToPredict] Data after preprocess:", deepCopy(finalData));
        }
        if (model.scaler) {
            log.debug("[prepareToPredict] Applying scaler transformation");
            finalData = applyScaler(model.scaler, finalData)
            log.debug("[prepareToPredict] Data after scaling:", deepCopy(finalData));
        }
        dataToPredict.push(finalData)
        results[i] = { ...r, processedData: finalData }
    }
    log.info("[prepareToPredict] Data preparation complete");
    return { newData: dataToPredict, newResults: results }
}



/* -------------------------------------------------- */
/* DATA TRANSFORMATION HELPERS */
/* -------------------------------------------------- */

const getValuesFromInterval = (interval: IInterval): number[] => {
    log.debug("[getValuesFromInterval] Calculating values from interval:", interval);
    if (interval.max === undefined || interval.min === undefined || interval.steps === undefined) {
        log.warn("[getValuesFromInterval] Incomplete interval definition, returning empty array")
        return []
    }

    const min_interval = Number(interval.min), max_interval = Number(interval.max), step_interval = Number(interval.steps)
    const dec = decimalCount(step_interval)

    const values = Array.from({ length: Math.ceil((max_interval - min_interval) / step_interval) + 1 }, (_, i: number) => { let num = round((i * step_interval) + min_interval, dec); return (num > max_interval) ? max_interval : num })
    log.debug("[getValuesFromInterval] Generated interval values:", values);
    return values;
}

const calculatePercentage = (percent: number, total: number) => {
    return (percent / 100) * total
}

export const getListValuesFromNew = (newValue: number, mean: number, rawValues: number[]): number[] => {
    let weights = rawValues.map((r: number) => Math.abs(r) / Math.abs(mean))       // Obtener PESOS
    return weights.map((w: number) => w * newValue)            // Otener nuevos valores a partir del nuevo y los pesos
}

const addResultsFromValues = (res: IResult[], rawData: IDataPred, values: number[], id: string, intervalType: IntervalTypeEnum) => {
    log.debug("[addResultsFromValues] Adding results for variable:", id);
    const mean: number = getMean(rawData[id])           // Cojo la media de todos los valores
    values.forEach((p: number) => {
        let newData = deepCopy(rawData)                 // Hago una copia del array de valores
        let new_value = -1
        if (intervalType === IntervalTypeEnum.percentage) {      // A partir de la media saco cada nuevo valor considerado en el intervalo
            const v = calculatePercentage(Math.abs(p), Math.abs(mean))
            new_value = (p < 0) ? mean - v : mean + v
        } else {
            new_value = mean + p
        }
        newData[id] = getListValuesFromNew(new_value, mean, newData[id])   // A partir del nuevo valor obtenido saco la lista de valores necesarios

        res.push({
            id: id + "_" + ((p < 0) ? 'l' : 'p') + Math.abs(p),
            data: newData,
            correspondsWith: {
                tag: id,
                intervalValue: p
            }
        })
    })
    log.debug("[addResultsFromValues] Generated", res.length, "results for variable:", id);
    return res
}

const defaultDataToObject = (data: IData[]): IDataPred => {
    log.debug("[defaultDataToObject] Converting default IData array to object");
    let res: IDataPred = {}
    data.forEach((d: IData) => { res[d.id] = (d.raw_values) ? d.raw_values : [] }) // nunca deberia ser []
    return res
}


export const newDataToObject = (data: IData[], hasInterval: boolean, numberOfElements = 1): IDataPred => {
    log.debug("[newDataToObject] Converting new IData array to object");
    let res: IDataPred = {}
    data.forEach((d: IData) => {
        let vals = (d.raw_values) ? d.raw_values : []
        if (d.new_value !== undefined && !(hasInterval && d.set_percentage)) {
            //vals = Array.from({ length: ((numberOfElements != undefined && numberOfElements > 0) ? numberOfElements : 1) }, () => Number(d.new_value))
            if (vals.length > 0) {
                vals = getListValuesFromNew(Number(d.new_value), getMean(vals), vals)
            } else {
                vals = Array.from({ length: ((numberOfElements !== undefined && numberOfElements > 0) ? numberOfElements : 1) }, () => Number(d.new_value))
            }
        }
        res[d.id] = vals
        //res[d.id] = (isNew && !(hasInterval && d.set_percentage) && d.new_value != undefined) ? [Number(d.new_value)] : ((d.raw_values) ? d.raw_values : []) // Nunca deberia ser 0
    })
    log.debug("[newDataToObject] Conversion completed:", res);
    return res
}

const prepareData = (dataCollection: IDataCollection, numberOfValues?: number): IResult[] => {
    log.info("[prepareData] Preparing base data from collection:", dataCollection.id);

    let res: IResult[] = []
    let baseData: IDataPred = {}
    const hasInterval = dataCollection.interval.max !== undefined && dataCollection.interval.min !== undefined && dataCollection.interval.steps !== undefined

    // Prediccion basica con los valores nuevos
    if (!(dataCollection.data.some((d: IData) => d.default_value === undefined))) {  // Solo se predice el default si estan todos los datos
        const defaultData: IDataPred = defaultDataToObject(dataCollection.data)  //dataCollection.data.map((d:IData) => (d.default_value) ? d.default_value : 0)
        res.push({
            id: idDefault, // ESTOY METIENDO LOS DATOS DEFAULT 
            data: defaultData
        })
        baseData = defaultData
    }

    if (dataCollection.data.some((d: IData) => d.new_value !== undefined && d.new_value.trim() !== '')) {
        //const onlyNewData:number[] = dataCollection.data.map((d:IData) => (d.set_percentage == true || d.new_value == undefined) ? ((d.default_value) ? d.default_value : 0) : Number(d.new_value))
        const onlyNewData: IDataPred = newDataToObject(dataCollection.data, hasInterval, numberOfValues)
        res.push({
            id: idNew,
            data: onlyNewData
        })
        baseData = onlyNewData
    }

    // Predicciones cambiando el intervalo
    const interval: IInterval = dataCollection.interval
    if (interval.max !== undefined && interval.min !== undefined && interval.steps !== undefined) {
        const values: number[] = getValuesFromInterval(interval)
        dataCollection.data.filter((sData: IData) => sData.set_percentage).forEach((sData: IData) => {
            res = addResultsFromValues(res, baseData, values, sData.id, interval.type)
        })
    }

    log.info("[prepareData] Prepared", res.length, "result sets");
    return res
}

const objectWithFirstElement = (list: number[][]): number[] => {
    return list.map((v: number[]) => v[0])
}

const addFormatInput = (data: IDataPred[], isListValues: boolean, isTransposeList: boolean, format?: IFormat): string => {
    log.debug("[addFormatInput] Starting addFormatInput execution");
    log.debug("[addFormatInput] Received data:", data);
    log.debug("[addFormatInput] Flags -> isListValues:", isListValues, "isTransposeList:", isTransposeList);

    let auxWithKeys: IDataPred[] = []
    let aux: any[] = []

    data.forEach((d: IDataPred) => {
        const keys = Object.keys(d);
        let dataPred: any = Object.values(d)

        if (!isListValues) {
            log.debug("[addFormatInput] Applying objectWithFirstElement transformation");
            dataPred = objectWithFirstElement(dataPred)
        } else if (isTransposeList) {
            log.debug("[addFormatInput] Applying transposeMatrix transformation");
            dataPred = transposeMatrix(dataPred)
        }
        aux.push(dataPred);

        const resultObjectWithKeys = keys.reduce((acc, currentKey, index) => {
            acc[currentKey] = dataPred[index];
            return acc;
        }, {} as { [key: string]: any });
        auxWithKeys.push(resultObjectWithKeys);
    })


    log.debug("[addFormatInput] Intermediate data (aux) prepared:", aux)
    log.debug("[addFormatInput] Intermediate data (auxWithKeys) prepared:", auxWithKeys)

    let body = ""

    if (format !== undefined) {
        log.debug("[addFormatInput] Format detected:", format);
        let allFormat = format.input

        const startIndex = allFormat.indexOf(varEachInput)
        const endIndex = allFormat.indexOf(varEachInputEnd)

        if (startIndex !== -1 && endIndex !== -1) {
            let eachFormat = allFormat.slice(startIndex + varEachInput.length, endIndex).trim();
            log.debug("[addFormatInput] Extracted 'each' format template:", eachFormat);

            const startTagIndex = eachFormat.indexOf(varEachTag)
            const endTagIndex = eachFormat.indexOf(varEachTagEnd)

            let allData: string[] = []
            if (startTagIndex !== -1 && endTagIndex !== -1) {
                const eachTagFormat = eachFormat.slice(startTagIndex + varEachTag.length, endTagIndex).trim();
                log.debug("[addFormatInput] Extracted 'each-tag' format template:", eachTagFormat);

                allData = auxWithKeys.map((v: IDataPred) => {
                    let allTagInputs = Object.entries(v).map(([key, values]) => {
                        let str = JSON.stringify(values)
                        str = str.substring(1, str.length - 1)
                        return eachTagFormat.replace(varInput, str).replace(varTag, '"' + key + '"')
                    }) 
                    return allTagInputs.join(",")
                })
                eachFormat = eachFormat.slice(0, startTagIndex) + " $input " + eachFormat.slice(endTagIndex + varEachTagEnd.length)
                log.trace("[addFormatInput] Reconstructed each format template:", eachFormat);
            } else {
                allData = auxWithKeys.map((v: IDataPred) => {
                    let str = JSON.stringify(Object.values(v))
                    return str.substring(1, str.length - 1)
                })
            }

            let allInputs = allData.map((str: string) => {
                return eachFormat.replace(varInput, str)
            })

            body = allInputs.join(",")
            log.trace("[addFormatInput] Generated formatted body from 'each' block:", body);

            allFormat = allFormat.slice(0, startIndex) + " $input " + allFormat.slice(endIndex + varEachInputEnd.length)
            log.trace("[addFormatInput] Reconstructed full format template:", allFormat);
        } else {
            log.warn("[addFormatInput] No 'each' block detected in format; using direct serialization");
            body = JSON.stringify(aux)
            body = body.substring(1, body.length - 1)
        }
        body = allFormat.replace(varInput, body)
        log.info("[addFormatInput] Successfully generated formatted input body");
    } else {
        log.warn("[addFormatInput] No format provided; returning raw JSON body");
        body = JSON.stringify(aux)
    }

    log.debug("[addFormatInput] Final body output:", body);
    return body
}

const removeFormatOutput = (result: string, format?: IFormat): number[] => {
    if (format !== undefined) {
        const indx = format.output.indexOf(variableOutput)

        const res: string[] = result
            .replace(format.output.slice(0, indx), "")
            .replace(format.output.slice(indx + variableOutput.length + 1, format.output.length), "")
            .split(',')
        const resNum: number[] = res.map((r: string) => Number(r.replace(/[^\d.-]/g, '')))
        return resNum
    }
    return [Number(result)]
}

/* -------------------------------------------------- */
/* PREPROCESS / SCALER / REQUEST */
/* -------------------------------------------------- */

export const applyScaler = function (scaler: IScaler, data_dict: IDataPred): IDataPred {
    log.debug("[applyScaler] Scaling data using provided scaler parameters");
    let scaled_data_dict: IDataPred = {}
    Object.entries(data_dict).forEach(([key, l]: [string, number[]], idx: number) => {
        scaled_data_dict[key] = (l !== undefined && l != null && l.length > 0) ? l.map((v: number) => (v - scaler.mean[idx]) / scaler.scale[idx]) : l
        //scaled_data_dict[key] = (value - scaler.mean[idx]) / scaler.scale[idx]
    })
    return scaled_data_dict;
}

export const applyPreprocess = async (code: string, data: IDataPred) => {
    log.debug("[applyPreprocess] Applying preprocess code");
    if (code !== PreprocessCodeDefault) {
        try {
            const sandbox = { data: data }
            let context = vm.createContext(sandbox) // https://stackoverflow.com/a/55056012/16131308 <--- te quiero
            data = vm.runInContext(code, context)
            log.info("[applyPreprocess] Preprocess executed successfully");
        } catch (error) {
            log.error("[applyPreprocess] Preprocess failed:", error);
        }
    }
    return data
}


/* -------------------------------------------------- */
/* NETWORK REQUEST */
/* -------------------------------------------------- */

const sendRequest = async (model: IModel, data: IDataPred[]) => {
    let myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")

    if (model.credentials) myHeaders.append('Authorization', 'Basic ' + Buffer.from(model.credentials.username + ":" + model.credentials.password).toString('base64'))

    let body = addFormatInput(data, model.isListValues, model.isTransposeList, model.format)

    let requestOptions: RequestInit = {
        method: model.method,
        headers: myHeaders,
        body: body
    }
    
    log.info("[sendRequest] Sending HTTP request to model:", model.url);
    try {
        const response = await fetch(model.url, requestOptions);
        if (response.ok) {
            log.info("[sendRequest] Response received successfully");
            const text: string = await response.text();
            return removeFormatOutput(text, model.format);
        } else {
            const errorText = await response.text();
            log.error("[sendRequest] Request failed with status:", response.status, "->", errorText);
            return "ERROR";
        }
    } catch (err) {
        log.error("[sendRequest] Network error:", err);
        return "ERROR";
    }

}
