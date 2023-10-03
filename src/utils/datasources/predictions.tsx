import { PreprocessCodeDefault } from "../default";
import { IData, IDataCollection, IDataPred, IFormat, IInterval, IModel, IResult, IScaler, IntervalTypeEnum } from "../types"
//import * as dfd from "danfojs"
import { idDefault, idNew, variableInput, variableOutput } from "../constants"
import vm from 'vm'
import { decimalCount, deepCopy, getMean, round, transposeMatrix } from "../utils"
import { Buffer } from 'buffer'


export const predictAllCollections = async (model: IModel, allData: IDataCollection[]) => {
    for (const [i, d] of allData.entries()) {
        allData[i] = { ...d, results: await predictData(model, d) }
    }
    return allData
}

const predictData = async (model: IModel, dataCollection: IDataCollection) => {
    console.log("numValues", model.numberOfValues)
    console.log("dataCollection", dataCollection)
    let results: IResult[] = prepareData(dataCollection, model.numberOfValues)
    let dataToPredict: IDataPred[] = []
    for (const [i, r] of results.entries()) {
        let finalData = deepCopy(r.data)
        if (model.preprocess) {
            finalData = await applyPreprocess(model.preprocess, finalData)
            //console.log("preprocess", finalData)
        }
        if (model.scaler) {
            console.log('Initial data - scaler', JSON.stringify(finalData))
            finalData = await applyScaler(model.scaler, finalData)
            console.log('Final data - scaler', JSON.stringify(finalData))
        }
        dataToPredict.push(finalData)
        results[i] = { ...r, processedData: finalData }
    }
    const predictions:any = await sendRequest(model, dataToPredict)
    return results.map<IResult>((r: IResult, indx: number) => { return { ...r, result: predictions[indx] } })
}

const getValuesFromInterval = (interval: IInterval): number[] => {
    if (interval.max == undefined || interval.min == undefined || interval.steps == undefined) return []

    const min_interval: number = Number(interval.min), max_interval: number = Number(interval.max), step_interval: number = Number(interval.steps)
    const dec = decimalCount(step_interval)

    //const porcentages_min:number[] = Array.from({ length: Math.ceil(min_interval / step_interval)}, (_, i:number) => { var num = 0 - ((i+1) * step_interval); return (num < -min_interval) ? -min_interval : num})
    //const porcentages_max:number[] = Array.from({ length: Math.ceil(max_interval / step_interval)}, (_, i:number) => { var num = (i+1) * step_interval; return (num > max_interval) ? max_interval : num})

    //return porcentages_min.concat(porcentages_max).sort((a,b)=>a-b)
    return Array.from({ length: Math.ceil((max_interval - min_interval) / step_interval) + 1 }, (_, i: number) => { var num = round((i * step_interval) + min_interval, dec); return (num > max_interval) ? max_interval : num })

}

const calculatePercentage = (percent: number, total: number) => {
    return (percent / 100) * total
}

const getListValuesFromNew = (newValue:number, mean:number, rawValues:number[]) : number[] => {
    let weights = rawValues.map((r:number) => r/mean)       // Obtener PESOS
    return weights.map((w:number) => w*newValue)            // Otener nuevos valores a partir del nuevo y los pesos
}

const addResultsFromValues = (res: IResult[], rawData: IDataPred, values: number[], id: string, intervalType: IntervalTypeEnum) => {
    const mean: number = getMean(rawData[id])           // Cojo la media de todos los valores
    values.forEach((p: number) => {
        let newData = deepCopy(rawData)                 // Hago una copia del array de valores
        let new_value = -1                              
        if (intervalType == IntervalTypeEnum.percentage) {      // A partir de la media saco cada nuevo valor considerado en el intervalo
            //const v = calculatePercentage(Math.abs(p), defData)
            //newData[id] = (p < 0) ? defData - v : defData + v
            const v = calculatePercentage(p, mean)
            new_value = mean + ((mean < 0) ? -v : v)
        } else {
            new_value = mean + p
        }
        newData[id] = getListValuesFromNew(new_value, mean, newData[id])   // A partir del nuevo valor obtenido saco la lista de valores necesarios
        console.log("NEWDATA", newData)

        res.push({
            id: id + "_" + ((p < 0) ? 'l' : 'p') + Math.abs(p),
            data: newData,
            correspondsWith: {
                tag: id,
                intervalValue: p
            }
        })
    })

    return res
}

const defaultDataToObject = (data: IData[]) : IDataPred => {
    var res: IDataPred = {}
    data.forEach((d: IData) => { res[d.id] = (d.raw_values) ? d.raw_values : [] }) // nunca deberia ser []
    return res
}


const newDataToObject = (data: IData[], hasInterval: boolean, numberOfElements: number = 1): IDataPred => {
    var res: IDataPred = {}
    data.forEach((d: IData) => {
        let vals =(d.raw_values) ? d.raw_values : []
        if(d.new_value != undefined && !(hasInterval && d.set_percentage)) {
            vals = Array.from({ length: ((numberOfElements != undefined && numberOfElements > 0) ? numberOfElements : 1) }, () => Number(d.new_value))
        }
        res[d.id] = vals
        //res[d.id] = (isNew && !(hasInterval && d.set_percentage) && d.new_value != undefined) ? [Number(d.new_value)] : ((d.raw_values) ? d.raw_values : []) // Nunca deberia ser 0
    })
    return res
}

const prepareData = (dataCollection: IDataCollection, numberOfValues?:number): IResult[] => {
    let res: IResult[] = []
    var baseData: IDataPred = {}
    const hasInterval = dataCollection.interval.max !== undefined && dataCollection.interval.min !== undefined && dataCollection.interval.steps !== undefined

    // Prediccion basica con los valores nuevos
    if (!(dataCollection.data.some((d: IData) => d.default_value == undefined))) {  // Solo se predice el default si estan todos los datos
        const defaultData: IDataPred = defaultDataToObject(dataCollection.data)  //dataCollection.data.map((d:IData) => (d.default_value) ? d.default_value : 0)
        res.push({
            id: idDefault, // ESTOY METIENDO LOS DATOS DEFAULT 
            data: defaultData
        })
        baseData = defaultData
    }

    if (dataCollection.data.some((d: IData) => d.new_value != undefined && d.new_value.trim() != '')) {
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
    if (interval.max != undefined && interval.min != undefined && interval.steps != undefined) {
        const values: number[] = getValuesFromInterval(interval)
        dataCollection.data.filter((sData: IData) => sData.set_percentage).forEach((sData: IData) => {
            res = addResultsFromValues(res, baseData, values, sData.id, interval.type)
        })
    }

    console.log(res)
    return res
}

export const applyScaler = function (scaler: IScaler, data_dict: IDataPred) : IDataPred {
    let scaled_data_dict: IDataPred = {}
    Object.entries(data_dict).forEach(([key, l]: [string, number[]], idx:number) => {
        scaled_data_dict[key] = (l != undefined && l != null && l.length > 0) ? l.map((v:number) => (v - scaler.mean[idx]) / scaler.scale[idx]) : l
        //scaled_data_dict[key] = (value - scaler.mean[idx]) / scaler.scale[idx]
    })
    return scaled_data_dict;
}

export const applyPreprocess = async (code: string, data: IDataPred) => {
    if (code != PreprocessCodeDefault) {
        try {
            console.log('Initial data - preprocess', JSON.stringify(data))
            //var preprocess = new Function(code) // https://stackoverflow.com/a/9702401/16131308
            const sandbox = { data: data }
            var context = vm.createContext(sandbox) // https://stackoverflow.com/a/55056012/16131308 <--- te quiero
            data = vm.runInContext(code, context)
            console.log('Final data - preprocess', JSON.stringify(data))
        } catch (error) {
            //console.log(error)
            console.error("Preprocess failed")
        }
    }
    return data
}

const objectWithFirstElement = (list:number[][]): number[] => {
    return list.map((v:number[]) => v[0])
}

const addFormatInput = (data: IDataPred[], isListValues: boolean, isTransposeList: boolean, format?: IFormat): string => {
    let body = ""
    const aux = data.map((d: IDataPred) => {
        let dataPred:any = Object.values(d)
        if(!isListValues) {
            dataPred = objectWithFirstElement(dataPred)
        } else {
            if (isTransposeList) dataPred = transposeMatrix(dataPred)
        }
        return dataPred
    })
    body = JSON.stringify(aux)
    body = body.substring(1, body.length - 1)
    if (format != undefined) body = format.input.replace(variableInput, body)
    console.log(body)
    return body
}

const removeFormatOutput = (result: string, format?: IFormat): number[] => {
    if (format != undefined) {
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

const sendRequest = async (model:IModel, data: IDataPred[]) => {
    let myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")

    if (model.credentials) myHeaders.append('Authorization', 'Basic ' + Buffer.from(model.credentials.username + ":" + model.credentials.password).toString('base64'))

    let body = addFormatInput(data, model.isListValues, model.isTransposeList, model.format)

    let requestOptions: RequestInit = {
        method: model.method,
        headers: myHeaders,
        body: body
    }

    let response = await fetch(model.url, requestOptions)
    if(response.ok){
        let text: string = await response.text()
        console.log(text)
        return removeFormatOutput(text, model.format)
    } else {
        console.error(await response.text())
        return 'ERROR'
    }

}