import { Calc, ExtraCalcFormat, IDataCollection, IDataPred, IModel, IResult, ITag } from "utils/types"
import { getListValuesFromNew, newDataToObject, predictResults } from "./predictions"
import vm from 'vm'
import { getMean } from "utils/utils"
import { dateTime, DateTime } from "@grafana/data"

const replaceVariables = (text: string, results: IResult[], dyn?: number ) => {
    const lastResult = results[results.length-1]
    
    // $out
    if(lastResult.result) text = text.replace(/\$out/g, lastResult.result as string)

    // $dyn
    if(dyn !== undefined) text = text.replace(/\$dyn/g, dyn.toString())

    // $[X]
    text = text.replace(/\$\[(\w+)\]/g, (match, varName) => {
        return (lastResult.data.hasOwnProperty(varName) && lastResult.data[varName] !== undefined) ? lastResult.data[varName][0].toString() : match;
    });

    console.log("text", text)
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
    switch(calc) {
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

const applyFormatToRes = (res: number, format: ExtraCalcFormat, selectedDate?: DateTime, process?: string) => {
    if (format !== ExtraCalcFormat.raw) {
        if (process) {
            const code = process.replace(/\$res/g, res.toString())
            res = executeString(code) as number
        }
        if(format === ExtraCalcFormat.addDays && selectedDate) {
            let copyDate = dateTime(selectedDate)
            return copyDate.add(res, 'days').toDate().toLocaleDateString('en-EN', { year: 'numeric', month: 'long', day: 'numeric' }) + " (" + res + "d)"
        }
    }
    return res.toString()
}

export const extraCalcCollection = async (model: IModel, col: IDataCollection, dyn?: number): Promise<IDataCollection> => {
    if (model.extraCalc && model.tags.some((tag: ITag) => tag.id === model.extraCalc?.tag)) {
        const tag = model.extraCalc.tag
        let data: IDataPred = prepareInitialData(col, model.numberOfValues)
        const iniResult: IResult = {
            id: "extraCalc", 
            data: {...data},
            correspondsWith: { tag: tag, intervalValue: getMean(data[tag])}
        }
        let results: IResult[] = await predictResults(model, [iniResult])

        let num_iter = 0
        let condition = replaceVariables(model.extraCalc.until, results, dyn)
        const calcValue = executeString(replaceVariables(model.extraCalc.calcValue, results, dyn))

        while (!executeString(condition)) {
            num_iter += 1
            const mean = getMean(data[tag])
            let newValue = applyCalcValue(mean, calcValue, model.extraCalc.calc)
            data = {
                ...data,
                [tag]: getListValuesFromNew(newValue, mean, data[tag])
            }
            let newRes: IResult[] = await predictResults(model, [{
                id: ("extraCalc_" + num_iter), 
                data: {...data}, 
                correspondsWith: {
                    tag: tag,
                    intervalValue: newValue
                }
            }])

            results = [...results, ...newRes]
            condition = replaceVariables(model.extraCalc.until, results, dyn)
        }
        col.resultsExtraCalc = results
        col.conclusionExtraCalc = applyFormatToRes(num_iter, model.extraCalc.resFormat, col.dateTime ,model.extraCalc.resProcess)
    } else {
        col.conclusionExtraCalc = "ERROR"
    }
    return col
}

const prepareInitialData = (dataCollection: IDataCollection, numberOfValues?: number): IDataPred => {
    const hasInterval = dataCollection.interval.max !== undefined && dataCollection.interval.min !== undefined && dataCollection.interval.steps !== undefined
    return newDataToObject(dataCollection.data, hasInterval, numberOfValues) 
}
