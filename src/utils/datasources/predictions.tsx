import { PreprocessCodeDefault } from "../default";
import { IData, IDataCollection, IDataPred, IFormat, IInterval, IModel, IResult, IScaler, IntervalTypeEnum, PostChangeIDataPred } from "../types"
//import * as dfd from "danfojs"
import { idDefault, idNew, varEachInput, varEachInputEnd, varEachTag, varEachTagEnd, varInput, varTag, variableOutput } from "../constants"
import vm from 'vm'
import { checkAbort, decimalCount, deepCopy, getMean, round, transposeMatrix } from "../utils"
import { Buffer } from 'buffer'
import log from "utils/logger";

const pulse = () => new Promise(resolve => setTimeout(resolve, 0));

/* -------------------------------------------------- */
/* PREDICTION WORKFLOW FUNCTIONS */
/* -------------------------------------------------- */

export const predictCollection = async (model: IModel, col: IDataCollection, signal?: AbortSignal) => {
    log.info("[predictCollection] Starting prediction for collections " + col.name);
    return { ...col, results: await predictData(model, col, signal) }
}

export const predictAllCollections = async (model: IModel, allData: IDataCollection[], signal?: AbortSignal) => {
    log.info("[predictAllCollections] Starting prediction for all collections");
    for (const [i, d] of allData.entries()) {
        log.debug(`[predictAllCollections] Predicting collection index ${i}`);
        allData[i] = { ...d, results: await predictData(model, d, signal) }
    }
    log.info("[predictAllCollections] All collections predicted successfully");
    log.debug("[predictAllCollections] Final results:", allData);
    return allData
}

const predictData = async (model: IModel, dataCollection: IDataCollection, signal?: AbortSignal) => {
    log.info("[predictData] Starting data prediction for collection:", dataCollection.id);
    let results: IResult[] = prepareData(dataCollection, model.numberOfValues)
    return await prepareAndPredictResults(model, results, signal)
}

export const prepareAndPredictResults = async (model: IModel, results: IResult[], signal?: AbortSignal) => {
    log.info("[prepareAndPredictResults] Starting full prepare + predict pipeline");
    const res = await prepareToPredict(model, results)
    log.debug("[prepareAndPredictResults] Prepared data:", res);
    const finalResults = await predictResults(model, res.newData, res.newResults, signal)
    log.info("[prepareAndPredictResults] Pipeline completed successfully");
    return finalResults
}

export const predictResults = async (model: IModel, data: IDataPred[], results: IResult[], signal?: AbortSignal) => {
    log.info("[predictResults] Sending prediction request to model endpoint");
    checkAbort(signal)
    const predictions: any = await sendRequest(model, data, signal)
    checkAbort(signal)
    log.info("[predictResults] Predictions received successfully");
    let res: IResult[] = []
    for (let idx = 0; idx < results.length; idx++) {
        res.push({ ...results[idx], result: predictions[idx] })
    }
    return res
}

export const prepareToPredict = async (model: IModel, results: IResult[], signal?: AbortSignal): Promise<PostChangeIDataPred> => {
    log.info("[prepareToPredict] Preparing data for prediction");
    let dataToPredict: IDataPred[] = []
    for (const [i, r] of results.entries()) {
        log.debug(`[prepareToPredict] Processing result index ${i}`);
        //log.debug(`[prepareToPredict] Original data snapshot:`, deepCopy(r.data));
        await pulse();
        checkAbort(signal)
        let finalData: IDataPred = deepCopy(r.data)
        if (model.preprocess) {
            log.debug("[prepareToPredict] Applying preprocess script");
            finalData = await applyPreprocess(model.preprocess, finalData)
            //log.debug("[prepareToPredict] Data after preprocess:", deepCopy(finalData));
        }
        if (model.scaler) {
            log.debug("[prepareToPredict] Applying scaler transformation");
            finalData = await applyScaler(model.scaler, finalData)
            //log.debug("[prepareToPredict] Data after scaling:", deepCopy(finalData));
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
    const result: number[] = [];
    for (let i = 0; i < rawValues.length; i++) {
        const weight = Math.abs(rawValues[i]) / Math.abs(mean);  // Obtener PESO
        result.push(weight * newValue);                           // Obtener nuevo valor a partir del nuevo y el peso
    }
    return result;
}

const addResultsFromValues = (res: IResult[], rawData: IDataPred, values: number[], id: string, intervalType: IntervalTypeEnum) => {
    log.debug("[addResultsFromValues] Adding results for variable:", id);
    const mean: number = getMean(rawData[id])           // Cojo la media de todos los valores
    for (let i = 0; i < values.length; i++) {
        let p = values[i]
        //let newData = deepCopy(rawData)                 // Hago una copia del array de valores
        let new_value = -1
        if (intervalType === IntervalTypeEnum.percentage) {      // A partir de la media saco cada nuevo valor considerado en el intervalo
            const v = calculatePercentage(Math.abs(p), Math.abs(mean))
            new_value = (p < 0) ? mean - v : mean + v
        } else {
            new_value = mean + p
        }

        const newData: IDataPred = {
            ...rawData,
            [id]: getListValuesFromNew(new_value, mean, rawData[id])
        };

        res.push({
            id: id + "_" + ((p < 0) ? 'l' : 'p') + Math.abs(p),
            data: newData,
            correspondsWith: {
                [id]: p
            }
        })
    }
    log.debug("[addResultsFromValues] Generated", res.length, "results for variable:", id);
    return res
}

const defaultDataToObject = (data: IData[]): IDataPred => {
    log.debug("[defaultDataToObject] Converting default IData array to object");
    let res: IDataPred = {}
    for (let i = 0; i < data.length; i++) {
        const d = data[i]
        res[d.id] = (d.raw_values) ? d.raw_values : []
    }
    return res
}


export const newDataToObject = (data: IData[], hasInterval: boolean, numberOfElements = 1): IDataPred => {
    log.debug("[newDataToObject] Converting new IData array to object");
    let res: IDataPred = {}
    for (let i = 0; i < data.length; i++) {
        const d: IData = data[i]
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
    }
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
        const defaultData: IDataPred = defaultDataToObject(dataCollection.data)
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
        const filterCol = dataCollection.data.filter((sData: IData) => sData.set_percentage)
        for (let i = 0; i < filterCol.length; i++) {
            res = addResultsFromValues(res, baseData, values, filterCol[i].id, interval.type)
        }
    }

    log.info("[prepareData] Prepared", res.length, "result sets");
    return res
}

const objectWithFirstElement = (list: number[][]): number[] => {
    const result: number[] = [];
    for (let i = 0; i < list.length; i++) {
        result.push(list[i][0]);
    }
    return result
}

const transformDataPred = (d: IDataPred, isListValues: boolean, isTransposeList: boolean): any => {
    let dataPred: any = Object.values(d);
    if (!isListValues) {
        log.debug("[transformDataPred] Applying objectWithFirstElement");
        return objectWithFirstElement(dataPred);
    }
    if (isTransposeList) {
        log.debug("[transformDataPred] Applying transposeMatrix");
        return transposeMatrix(dataPred);
    }
    return dataPred;
};

const buildAuxArrays = async (data: IDataPred[], isListValues: boolean, isTransposeList: boolean): Promise<{ aux: any[]; auxWithKeys: IDataPred[] }> => {
    const aux: any[] = [];
    const auxWithKeys: IDataPred[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i % 50 === 0 && i > 0) await pulse();
        const d = data[i];
        const keys = Object.keys(d);
        const dataPred = transformDataPred(d, isListValues, isTransposeList);

        aux.push(dataPred);

        const withKeys: { [key: string]: any } = {};
        for (let j = 0; j < keys.length; j++) {
            withKeys[keys[j]] = dataPred[j];
        }
        auxWithKeys.push(withKeys);
    }

    return { aux, auxWithKeys };
};

const buildEachTagData = async (auxWithKeys: IDataPred[], eachTagFormat: string): Promise<string[]> => {
    const result: string[] = [];

    for (let i = 0; i < auxWithKeys.length; i++) {
        const v = auxWithKeys[i];
        const entries = Object.entries(v);
        const tagInputs: string[] = [];

        for (let j = 0; j < entries.length; j++) {
            if (i % 50 === 0 && i > 0) await pulse();
            const [key, values] = entries[j];
            let str = JSON.stringify(values);
            str = str.substring(1, str.length - 1);
            tagInputs.push(
                eachTagFormat.replace(varInput, str).replace(varTag, '"' + key + '"')
            );
        }

        result.push(tagInputs.join(","));
    }

    return result;
};

const buildPlainData = (auxWithKeys: IDataPred[]): string[] => {
    const result: string[] = [];

    for (let i = 0; i < auxWithKeys.length; i++) {
        const str = JSON.stringify(Object.values(auxWithKeys[i]));
        result.push(str.substring(1, str.length - 1));
    }

    return result;
};

const applyEachInputBlock = async (allFormat: string, auxWithKeys: IDataPred[]): Promise<{ body: string; allFormat: string }> => {
    const startIndex = allFormat.indexOf(varEachInput);
    const endIndex = allFormat.indexOf(varEachInputEnd);

    if (startIndex === -1 || endIndex === -1) {
        log.warn("[applyEachInputBlock] No 'each' block found; skipping");
        return { body: "", allFormat };
    }

    let eachFormat = allFormat.slice(startIndex + varEachInput.length, endIndex).trim();
    log.debug("[applyEachInputBlock] Extracted 'each' format template:", eachFormat);

    const startTagIndex = eachFormat.indexOf(varEachTag);
    const endTagIndex = eachFormat.indexOf(varEachTagEnd);

    let allData: string[];

    if (startTagIndex !== -1 && endTagIndex !== -1) {
        const eachTagFormat = eachFormat.slice(startTagIndex + varEachTag.length, endTagIndex).trim();
        log.debug("[applyEachInputBlock] Extracted 'each-tag' format template:", eachTagFormat);

        allData = await buildEachTagData(auxWithKeys, eachTagFormat);
        eachFormat =
            eachFormat.slice(0, startTagIndex) +
            " $input " +
            eachFormat.slice(endTagIndex + varEachTagEnd.length);
        log.trace("[applyEachInputBlock] Reconstructed each format template:", eachFormat);
    } else {
        allData = buildPlainData(auxWithKeys);
    }

    const allInputs: string[] = [];
    for (let i = 0; i < allData.length; i++) {
        allInputs.push(eachFormat.replace(varInput, allData[i]));
    }

    const body = allInputs.join(",");
    log.trace("[applyEachInputBlock] Generated formatted body:", body);

    const updatedFormat =
        allFormat.slice(0, startIndex) +
        " $input " +
        allFormat.slice(endIndex + varEachInputEnd.length);
    log.trace("[applyEachInputBlock] Reconstructed full format template:", updatedFormat);

    return { body, allFormat: updatedFormat };
};

// ─── Función principal ────────────────────────────────────────────────────────

const addFormatInput = async (data: IDataPred[], isListValues: boolean, isTransposeList: boolean, format?: IFormat): Promise<string> => {
    log.debug("[addFormatInput] Starting execution");
    log.debug("[addFormatInput] data:", data);
    log.debug("[addFormatInput] flags -> isListValues:", isListValues, "isTransposeList:", isTransposeList);

    const { aux, auxWithKeys } = await buildAuxArrays(data, isListValues, isTransposeList);
    log.debug("[addFormatInput] aux:", aux);
    log.debug("[addFormatInput] auxWithKeys:", auxWithKeys);

    if (format === undefined) {
        log.warn("[addFormatInput] No format provided; returning raw JSON");
        return JSON.stringify(aux);
    }

    log.debug("[addFormatInput] Format detected:", format);
    let allFormat = format.input;

    const startIndex = allFormat.indexOf(varEachInput);
    const endIndex = allFormat.indexOf(varEachInputEnd);

    let body: string;

    if (startIndex !== -1 && endIndex !== -1) {
        const result = await applyEachInputBlock(allFormat, auxWithKeys);
        body = result.body;
        allFormat = result.allFormat;
    } else {
        log.warn("[addFormatInput] No 'each' block in format; using direct serialization");
        const raw = JSON.stringify(aux);
        body = raw.substring(1, raw.length - 1);
    }

    body = allFormat.replace(varInput, body);
    log.info("[addFormatInput] Successfully generated formatted input body");
    log.debug("[addFormatInput] Final body:", body);

    return body;
};

const removeFormatOutput = (result: string, format?: IFormat): number[] => {
    if (format !== undefined) {
        const indx = format.output.indexOf(variableOutput)

        const res: string[] = result
            .replace(format.output.slice(0, indx), "")
            .replace(format.output.slice(indx + variableOutput.length + 1, format.output.length), "")
            .split(',')
        let resNum: number[] = [];
        for (let i = 0; i < res.length; i++) {
            resNum.push(Number(res[i].replace(/[^\d.-]/g, '')))
        }
        return resNum
    }
    return [Number(result)]
}

/* -------------------------------------------------- */
/* PREPROCESS / SCALER / REQUEST */
/* -------------------------------------------------- */

export const applyScaler = async (scaler: IScaler, data_dict: IDataPred): Promise<IDataPred> => {
    log.debug("[applyScaler] Scaling data using provided scaler parameters");
    let scaled_data_dict: IDataPred = {};
    const entries = Object.entries(data_dict);

    for (let idx = 0; idx < entries.length; idx++) {
        const [key, l] = entries[idx];

        // Pausamos brevemente entre cada "tag" o columna de datos
        await pulse();

        if (l !== undefined && l != null && l.length > 0) {
            const scaled_list: number[] = [];
            const mean = scaler.mean[idx];
            const scale = scaler.scale[idx];

            for (let i = 0; i < l.length; i++) {
                // Si la lista es masiva (ej. > 5000 elementos), pausamos cada 1000 para no congelar el UI
                if (i % 100 === 0 && i > 0) {
                    await pulse();
                }
                scaled_list.push((l[i] - mean) / scale);
            }
            scaled_data_dict[key] = scaled_list;
        } else {
            scaled_data_dict[key] = l;
        }
    }

    return scaled_data_dict;
}

export const applyPreprocess = async (code: string, data: IDataPred, signal?: AbortSignal) => {
    log.debug("[applyPreprocess] Applying preprocess code");
    if (code !== PreprocessCodeDefault) {
        await pulse()
        checkAbort(signal)
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

const sendRequest = async (model: IModel, data: IDataPred[], signal?: AbortSignal) => {
    let myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")

    if (model.credentials) myHeaders.append('Authorization', 'Basic ' + Buffer.from(model.credentials.username + ":" + model.credentials.password).toString('base64'))

    let body = await addFormatInput(data, model.isListValues, model.isTransposeList, model.format)

    let requestOptions: RequestInit = {
        method: model.method,
        headers: myHeaders,
        body: body,
        signal: signal
    }
    console.log(body)

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
            throw new Error(`Request failed (${response.status})${(errorText) ? ": " + errorText : ''}`)
        }
    } catch (err) {
        if (err instanceof Error) {
            // Si es un AbortError, lo relanzamos para que el catch superior lo gestione
            if (err.name === 'AbortError') {
                throw err;
            }
            log.error("[sendRequest] Known error:", err.message);
            throw err;
        }

        // 2. Si err no es un objeto Error (poco probable en fetch, pero posible en JS)
        log.error("[sendRequest] An unknown error occurred:", err);
        throw new Error(String(err));
    }

}
