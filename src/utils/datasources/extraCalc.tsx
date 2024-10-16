import { Calc, DateRes, ExtraCalcFormat, IDataCollection, IDataPred, IModel, IResult, ITag, PostChangeIDataPred, WhenApplyEnum } from "utils/types"
import { getListValuesFromNew, newDataToObject, predictResults, prepareAndPredictResults, prepareToPredict } from "./predictions"
import vm from 'vm'
import { deepCopy, getMean } from "utils/utils"
import { dateTime, DateTime } from "@grafana/data"

const replaceVariables = (text: string, data: IDataPred, dyn?: number[], lastResult?: number) => {
    // $out
    if (lastResult) text = text.replace(/\$out/g, lastResult.toString())

    // $dyn
    if (dyn !== undefined)
        dyn.forEach((d: number, idx: number) => {
            let searchValue = new RegExp('\\$dyn' + (idx + 1), 'g'); //  /\$dyn/g
            text = text.replace(searchValue, d.toString())
        })


    // $[X]
    text = text.replace(/\$\[(\w+)\]/g, (match, varName) => {
        return (data.hasOwnProperty(varName) && data[varName] !== undefined) ? data[varName][0].toString() : match;
    });

    return text
}

const executeString = (code: string) => {
    try {
        let context = vm.createContext()
        let res = vm.runInContext(code, context)
        return res
    } catch (error) {
        console.log(error)
        console.error("Execution failed")
    }
}

const applyCalcValue = (first: number, second: number, calc: Calc): number => {
    switch (calc) {
        case Calc.sub:
            return first - second
        case Calc.div:
            return first / second
        case Calc.mul:
            return first * second
        default:
            return first + second
    }
}

const applyFormatToRes = (res: number, format: ExtraCalcFormat, selectedDate?: DateTime, process?: string): string|DateRes => {
    if (format !== ExtraCalcFormat.raw) {
        if (process) {
            const code = process.replace(/\$res/g, res.toString())
            res = executeString(code) as number
        }
        if (format === ExtraCalcFormat.addDays && selectedDate) {
            let copyDate = dateTime(selectedDate)
            let dateString = copyDate.add(res, 'days').toDate().toLocaleDateString('en-EN', { year: 'numeric', month: 'long', day: 'numeric' })
            return new DateRes(dateString, res)
        }
    }
    return res.toString()
}

const createRequests = (iniRes: IResult, num: number, calcValue: number, data: IDataPred, tag: string, calc: Calc, idNumber: number, isProcessed = false): PostChangeIDataPred => {
    let res: IResult[] = []
    let allData: IDataPred[] = []
    for (let i = 0; i < num; i++) {
        let newResult = deepCopy(iniRes)
        let mean = getMean(data[tag])
        let newValue = applyCalcValue(mean, calcValue, calc)
        data = {
            ...data,
            [tag]: getListValuesFromNew(newValue, mean, data[tag])
        }
        const copyData = {...data}
        allData.push(copyData)

        newResult.id = newResult.id + "_" + (idNumber + i)
        newResult.correspondsWith.intervalValue = newValue
        if(isProcessed) {
            newResult.processedData = {...copyData}
        } else {
            newResult.data = {...copyData}
        }

        res.push(newResult)
    }
    return {newData: allData, newResults: res}
}

const check = (r: IResult, model: IModel, isAfter: boolean, dyn?: number[]) => {
    if(r.result && model.extraCalc && typeof r.result === 'number') {
        let condition = ""
        if(isAfter && r.processedData) {
            condition = replaceVariables(model.extraCalc.until, r.processedData, dyn, r.result)
        } else {
            condition = replaceVariables(model.extraCalc.until, r.data, dyn, r.result)
        }
        return executeString(condition)
    }
    return false
}

export const extraCalcCollection = async (model: IModel, col: IDataCollection, dyn?: number[]): Promise<IDataCollection> => {
    if (model.extraCalc && model.tags.some((tag: ITag) => tag.id === model.extraCalc?.tag)) {
        let res: IResult[] = []
        let calcValue = 0
        let results: IResult[] = []
        const tag = model.extraCalc.tag
        const isAfter = model.extraCalc.whenApply === WhenApplyEnum.afterPreprocess

        // Preparamos los datos iniciales y obtenemos el valor para los calculos
        let data: IDataPred = prepareInitialData(col, model.numberOfValues)

        // Creamos el resultado inicial
        const iniResult: IResult = {
            id: "extraCalc",
            data: { ...data },
            correspondsWith: { tag: tag, intervalValue: getMean(data[tag]) }
        }

        if(isAfter){
            const prep = await prepareToPredict(model, [iniResult])
            calcValue = executeString(replaceVariables(model.extraCalc.calcValue, prep.newData[0], dyn))
            const requests = createRequests(iniResult, (model.extraCalc.numRequests-1), calcValue, prep.newData[0], tag, model.extraCalc.calc, 1, true)
            results = await predictResults(model, [...prep.newData, ...requests.newData], [...prep.newResults, ...requests.newResults])
        } else {
            calcValue = executeString(replaceVariables(model.extraCalc.calcValue, data, dyn))
            results = [iniResult, ...createRequests(iniResult, (model.extraCalc.numRequests-1), calcValue, data, tag, model.extraCalc.calc, 1).newResults]
            results = await prepareAndPredictResults(model, results)
        }

        // Comprobamos si se cumple la condicion en alguno
        let idxFin = results.findIndex((r) => check(r, model, isAfter, dyn))

        while (idxFin < 0) { // Probamos hasta que se cumpla alguna condicion
            const lastRes = results[results.length-1]
            res = [...res, ...results]
            if(isAfter && lastRes.processedData){
                data = lastRes.processedData
                results = [...createRequests(iniResult, model.extraCalc.numRequests, calcValue, data, tag, model.extraCalc.calc, res.length).newResults]
                const requests = createRequests(iniResult, model.extraCalc.numRequests, calcValue, data, tag, model.extraCalc.calc, res.length, true)
                results = await predictResults(model, [...requests.newData], [...requests.newResults])
            } else {
                data = lastRes.data
                results = [...createRequests(iniResult, model.extraCalc.numRequests, calcValue, data, tag, model.extraCalc.calc, res.length).newResults]
                results = await prepareAndPredictResults(model, results)
            }
            idxFin = results.findIndex((r) => check(r, model, isAfter, dyn))
        }

        res = (idxFin + 1 < results.length) ? [...res, ...results.slice(0, (idxFin+1))] : [...res, ...results]

        col.resultsExtraCalc = res
        col.conclusionExtraCalc = applyFormatToRes(res.length-1, model.extraCalc.resFormat, col.dateTime, model.extraCalc.resProcess)
    } else {
        col.conclusionExtraCalc = "ERROR"
    }
    console.log("Result col extra calc", col)
    return col
}

const prepareInitialData = (dataCollection: IDataCollection, numberOfValues?: number): IDataPred => {
    const hasInterval = dataCollection.interval.max !== undefined && dataCollection.interval.min !== undefined && dataCollection.interval.steps !== undefined
    return newDataToObject(dataCollection.data, hasInterval, numberOfValues)
}
