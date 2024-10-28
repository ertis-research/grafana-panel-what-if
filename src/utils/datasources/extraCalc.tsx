import { Calc, DateRes, ExtraCalcFormat, IDataCollection, IDataPred, IModel, IResult, ITag, PostChangeIDataPred, TypeDynamicField, WhenApplyEnum } from "utils/types"
import { getListValuesFromNew, newDataToObject, predictResults, prepareAndPredictResults, prepareToPredict } from "./predictions"
import vm from 'vm'
import { dateToString, deepCopy, getMean } from "utils/utils"
import { dateTime, DateTime } from "@grafana/data"

const replaceVariables = (model: IModel, col: IDataCollection, text: string, data: IDataPred, dyn?: string[], lastResult?: number, iter?: number) => {
    // $out
    if (lastResult !== undefined) text = text.replace(/\$out/g, lastResult.toString())

    // $dyn
    if (dyn !== undefined && model.extraCalc && model.extraCalc.dynamicFieldList && model.extraCalc.dynamicFieldList.length === dyn.length) {
        const dynList = model.extraCalc.dynamicFieldList
        dyn.forEach((d: string, idx: number) => {
            let searchValue = new RegExp('\\$dyn' + (idx + 1), 'g'); //  /\$dyn/g
            //check type
            switch(dynList[idx].type){
                case TypeDynamicField.num:
                    text = text.replace(searchValue, d)
                    break
                default: // text and date are the same
                    text = text.replace(searchValue, "'" + d + "'")
                    break
            }
        })
    }

    // $[X]
    text = text.replace(/\$\[(\w+)\]/g, (match, varName) => {
        return (data.hasOwnProperty(varName) && data[varName] !== undefined) ? data[varName][0].toString() : match;
    });

    // $date
    if(col.dateTime !== undefined) text = text.replace(/\$date/g, "'" + dateToString(col.dateTime.toDate()) + "'")

    // $dateStart
    //if(col.dateTimeStart !== undefined) text = text.replace(/\$dateStart/g, dateToString(col.dateTimeStart.toDate()))

    // $iter
    console.log("iter", iter)
    if(iter !== undefined) text = text.replace(/\$iter/g, iter.toString())

    console.log("res replace", text)
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

const check = (r: IResult, model: IModel, col: IDataCollection, isAfter: boolean, dyn?: string[], iter?: number) => {
    if(r.result && model.extraCalc && typeof r.result === 'number') {
        let condition = ""
        if(isAfter && r.processedData) {
            condition = replaceVariables(model, col, model.extraCalc.until, r.processedData, dyn, r.result, iter)
        } else {
            condition = replaceVariables(model, col, model.extraCalc.until, r.data, dyn, r.result, iter)
        }
        return executeString(condition)
    }
    return false
}

export const extraCalcCollection = async (model: IModel, col: IDataCollection, dyn?: string[]): Promise<IDataCollection> => {
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
            calcValue = executeString(replaceVariables(model, col, model.extraCalc.calcValue, prep.newData[0], dyn, undefined, 0))
            const requests = createRequests(iniResult, (model.extraCalc.numRequests-1), calcValue, prep.newData[0], tag, model.extraCalc.calc, 1, true)
            results = await predictResults(model, [...prep.newData, ...requests.newData], [...prep.newResults, ...requests.newResults])
        } else {
            calcValue = executeString(replaceVariables(model, col, model.extraCalc.calcValue, data, dyn, undefined, 0))
            results = [iniResult, ...createRequests(iniResult, (model.extraCalc.numRequests-1), calcValue, data, tag, model.extraCalc.calc, 1).newResults]
            results = await prepareAndPredictResults(model, results)
        }

        // Comprobamos si se cumple la condicion en alguno
        let idxFin = results.findIndex((r, idx) => check(r, model, col, isAfter, dyn, idx))

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
            idxFin = results.findIndex((r, idx) => check(r, model, col, isAfter, dyn, (res.length + idx)))
        }

        res = [...res, ...results.slice(0, idxFin)]

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
