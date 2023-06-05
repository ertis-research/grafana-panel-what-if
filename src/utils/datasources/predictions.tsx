import { PreprocessCodeDefault } from "../default";
import { ICredentials, IData, IDataCollection, IDataPred, IFormat, IInterval, IModel, IResult, IScaler, IntervalTypeEnum } from "../types"
//import * as dfd from "danfojs"
import { idDefault, idNew, variableInput, variableOutput } from "../constants"
import vm from 'vm'
import { decimalCount, deepCopy, round } from "../utils"
import { Buffer } from 'buffer'


export const predictAllCollections = async (model:IModel, allData:IDataCollection[]) => {
    for(const [i, d] of allData.entries()){
        allData[i] =  {...d, results: await predictData(model, d)}
    }
    return allData
}

const predictData = async (model:IModel, dataCollection:IDataCollection) => {
    let results:IResult[] = prepareData(dataCollection)
    let dataToPredict:IDataPred[] = []
    for(const [i, r] of results.entries()){
        let finalData = deepCopy(r.data)
        //console.log("rawData", JSON.stringify(r.data))
        if(model.preprocess){
            finalData = await applyPreprocess(model.preprocess, finalData)
            //console.log("preprocess", finalData)
        }
        if(model.scaler){
            //console.log("pre-scaler-apply", finalData)
            finalData = await applyScaler(model.scaler, finalData)
            //console.log("scaler-apply", finalData)
        }
        dataToPredict.push(finalData)
        results[i] = { ...r, processedData : finalData }
    }
    const predictions:number[] = await sendRequest(model.url, model.method, dataToPredict, model.credentials, model.format)
    return results.map<IResult>((r:IResult, indx:number) => { return {...r, result: predictions[indx]}})
}

const getValuesFromInterval = (interval:IInterval) : number[] => {
    if(interval.max == undefined || interval.min == undefined || interval.steps == undefined) return []

    const min_interval:number = Number(interval.min), max_interval:number = Number(interval.max), step_interval:number = Number(interval.steps)
    const dec = decimalCount(step_interval)

    //const porcentages_min:number[] = Array.from({ length: Math.ceil(min_interval / step_interval)}, (_, i:number) => { var num = 0 - ((i+1) * step_interval); return (num < -min_interval) ? -min_interval : num})
    //const porcentages_max:number[] = Array.from({ length: Math.ceil(max_interval / step_interval)}, (_, i:number) => { var num = (i+1) * step_interval; return (num > max_interval) ? max_interval : num})

    //return porcentages_min.concat(porcentages_max).sort((a,b)=>a-b)
    return Array.from({ length: Math.ceil((max_interval - min_interval) / step_interval) + 1 }, (_, i:number) => { var num = round((i * step_interval) + min_interval, dec); return (num > max_interval) ? max_interval : num})

}

const calculatePercentage = (percent:number, total:number) => {
    return (percent / 100) * total
} 

const addResultsFromValues = (res:IResult[], defaultData:IDataPred, values:number[], id:string, intervalType:IntervalTypeEnum) => {
    const defData:number = defaultData[id]

    values.forEach((p:number) => {
        let newData = deepCopy(defaultData)
        if(intervalType == IntervalTypeEnum.percentage) {
            const v = calculatePercentage(Math.abs(p), defData)
            newData[id] = (p < 0) ? defData - v : defData + v
        } else {
            newData[id] = defData + p
        }
        res.push({
            id : id + "_" + ((p < 0) ? 'l' : 'p') + Math.abs(p),
            data : newData,
            correspondsWith: {
                tag : id,
                intervalValue : p
            }
        })
    })

    return res
}

const dataToObject = (data:IData[], isNew:boolean, hasInterval:boolean) : IDataPred => {
    var res:IDataPred = {}
    data.forEach((d:IData) => {
        res[d.id] = (isNew && !(hasInterval && d.set_percentage) && d.new_value != undefined) ? Number(d.new_value) : ((d.default_value) ? d.default_value : 0) // Nunca deberia ser 0
    })
    return res
}

const prepareData = (dataCollection:IDataCollection) : IResult[] => {
    let res:IResult[] = []
    var baseData:IDataPred = {}
    const hasInterval = dataCollection.interval.max !== undefined && dataCollection.interval.min !== undefined && dataCollection.interval.steps !== undefined

    // Prediccion basica con los valores nuevos
    if(!(dataCollection.data.some((d:IData) => d.default_value == undefined))){
        const defaultData:IDataPred = dataToObject(dataCollection.data, false, hasInterval)  //dataCollection.data.map((d:IData) => (d.default_value) ? d.default_value : 0)
        res.push({
            id : idDefault, // ESTOY METIENDO LOS DATOS DEFAULT 
            data : defaultData
        })
        baseData = defaultData
    }

    if(dataCollection.data.some((d:IData) => d.new_value != undefined && d.new_value.trim() != '')){
        //const onlyNewData:number[] = dataCollection.data.map((d:IData) => (d.set_percentage == true || d.new_value == undefined) ? ((d.default_value) ? d.default_value : 0) : Number(d.new_value))
        const onlyNewData:IDataPred = dataToObject(dataCollection.data, true, hasInterval)
        res.push({
            id : idNew,
            data : onlyNewData
        })
        baseData = onlyNewData
    }
    

    // Predicciones cambiando el intervalo
    const interval:IInterval = dataCollection.interval
    if(interval.max != undefined && interval.min != undefined && interval.steps != undefined) {
        const values:number[] = getValuesFromInterval(interval)
        dataCollection.data.filter((sData:IData) => sData.set_percentage).forEach((sData:IData) => {
            res = addResultsFromValues(res, baseData, values, sData.id, interval.type)
        })
    }

    return res
}

export const applyScaler = function(scaler:IScaler, data_dict:IDataPred) {
    let scaled_data_dict:IDataPred = {}
    Object.keys(data_dict).forEach((key:any, idx:number) => {
        scaled_data_dict[key] = (data_dict[key] - scaler.mean[idx]) / scaler.scale[idx]
    })
    return scaled_data_dict;
}

export const applyPreprocess = async (code:string, data:IDataPred) => {
    if(code != PreprocessCodeDefault){
        try {
            //console.log('inidata', data)
            //var preprocess = new Function(code) // https://stackoverflow.com/a/9702401/16131308
            const sandbox = { data: data }
            var context = vm.createContext(sandbox) // https://stackoverflow.com/a/55056012/16131308 <--- te quiero
            data = vm.runInContext(code, context)
        } catch (error) {
            console.log(error)
            console.error("Preprocess failed")
        }
    }
    return data
}

const addFormatInput = (data:IDataPred[], format?:IFormat) : string => {
    let body = ""
    if(data.length == 1) {
        body = JSON.stringify(Object.values(data[0]))
    } else if (data.length > 1) {
        const aux = data.map((d:IDataPred) => Object.values(d))
        body = JSON.stringify(aux)
        body = body.substring(1, body.length-1)
    }
    if (format != undefined) body = format.input.replace(variableInput, body)
    return body
}

const removeFormatOutput = (result:string, format?:IFormat) : number[] => {
    if(format != undefined) {
        const indx = format.output.indexOf(variableOutput)
        
        const res:string[] = result
                            .replace(format.output.slice(0, indx), "")
                            .replace(format.output.slice(indx+variableOutput.length+1, format.output.length), "")
                            .split(',')
        const resNum:number[] = res.map((r:string) => Number(r.replace(/[^\d.-]/g, '')))
        return resNum
    }
    return [Number(result)]
}

const sendRequest = async (url:string, method:string,  data:IDataPred[], credentials?:ICredentials, format?:IFormat) => {
    let myHeaders = new Headers()
    myHeaders.append("Content-Type", "application/json")

    if (credentials) myHeaders.append('Authorization', 'Basic ' + Buffer.from(credentials.username + ":" + credentials.password).toString('base64'))

    let body = addFormatInput(data, format)
    
    let requestOptions:RequestInit = {
        method: method,
        headers: myHeaders,
        body: body
    }

    let response = await fetch(url, requestOptions)
    let text:string = await response.text()
    return removeFormatOutput(text, format)
}