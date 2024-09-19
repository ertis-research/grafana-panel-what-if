import { Calc, DateRes, ExtraCalcFormat, IDataCollection, IDataPred, IModel, IResult, ITag } from "utils/types"
import { getListValuesFromNew, newDataToObject, predictResults } from "./predictions"
import vm from 'vm'
import { getMean } from "utils/utils"
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

const createRequests = (num: number, calcValue: number, data: IDataPred, tag: string, calc: Calc, idNumber: number) => {
    let res: IResult[] = []
    for (let i = 0; i < num; i++) {
        let mean = getMean(data[tag])
        let newValue = applyCalcValue(mean, calcValue, calc)
        data = {
            ...data,
            [tag]: getListValuesFromNew(newValue, mean, data[tag])
        }
        res.push({
            id: ("extraCalc_" + (idNumber + i)),
            data: { ...data },
            correspondsWith: { tag: tag, intervalValue: newValue }
        })
    }
    return res
}

export const extraCalcCollection = async (model: IModel, col: IDataCollection, dyn?: number[]): Promise<IDataCollection> => {
    if (model.extraCalc && model.tags.some((tag: ITag) => tag.id === model.extraCalc?.tag)) {
        let res: IResult[] = []
        const tag = model.extraCalc.tag

        // Preparamos los datos iniciales y obtenemos el valor para los calculos
        let data: IDataPred = prepareInitialData(col, model.numberOfValues)
        const calcValue = executeString(replaceVariables(model.extraCalc.calcValue, data, dyn))

        // Creamos el resultado inicial
        const iniResult: IResult = {
            id: "extraCalc",
            data: { ...data },
            correspondsWith: { tag: tag, intervalValue: getMean(data[tag]) }
        }
        
        // Generamos el resto de resultados sumando calc de forma recursiva al tag correspondiente y predecimos 
        let results = [iniResult, ...createRequests((model.extraCalc.numRequests-1), calcValue, data, tag, model.extraCalc.calc, 1)]
        results = await predictResults(model, results)

        // Comprobamos si se cumple la condicion en alguno
        const check = (r: IResult) => {
            if(r.result && model.extraCalc && typeof r.result === 'number') {
                const condition = replaceVariables(model.extraCalc.until, r.data, dyn, r.result)
                return executeString(condition)
            }
            return false
        }
        let idxFin = results.findIndex(check)

        while (idxFin < 0) { // Probamos hasta que se cumpla alguna condicion
            data = results[results.length-1].data
            res = [...res, ...results]
            results = [...createRequests(model.extraCalc.numRequests, calcValue, data, tag, model.extraCalc.calc, res.length)]
            results = await predictResults(model, results)
            idxFin = results.findIndex(check)
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
