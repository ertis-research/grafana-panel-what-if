import { Calc, ConclusionRes, ExtraCalcFormat, IDataCollection, IDataPred, IECTagIter, IExtraCalc, IModel, IResult, ITag, PostChangeIDataPred, TypeDynamicField, WhenApplyEnum } from "utils/types"
import { getListValuesFromNew, newDataToObject, predictResults, prepareAndPredictResults, prepareToPredict } from "./predictions"
import vm from 'vm'
import { checkAbort, dateToString, deepCopy, getMean } from "utils/utils"
import { dateTime, DateTime } from "@grafana/data"

const pulse = () => new Promise(resolve => setTimeout(resolve, 0));

const replaceVariables = (extraCalc: IExtraCalc, col: IDataCollection, text: string, data: IDataPred, dyn?: string[], lastResult?: number | string, iter?: number): string => {

    //console.log("data", JSON.stringify(data))
    // $out
    if (lastResult !== undefined) text = text.replace(/\$out/g, lastResult.toString())

    // $dyn
    if (extraCalc.dynamicFieldList) {

        if (!dyn) {
            throw new Error("dynamic fields are required but not provided")
        }

        if (extraCalc.dynamicFieldList.length !== dyn.length) {
            throw new Error(`Expected ${extraCalc.dynamicFieldList.length} dynamic fields, got ${dyn.length}`)
        }

        const dynList = extraCalc.dynamicFieldList
        for (let idx = 0; idx < dyn.length; idx++) {
            if (dyn[idx] === undefined || dyn[idx] === null) {
                throw new Error(`dyn${idx + 1} is undefined`)
            }

            let searchValue = new RegExp('\\$dyn' + (idx + 1), 'g'); //  /\$dyn/g
            //check type
            switch (dynList[idx].type) {
                case TypeDynamicField.num:
                    text = text.replace(searchValue, dyn[idx])
                    break
                default: // text and date are the same
                    text = text.replace(searchValue, "'" + dyn[idx] + "'")
                    break
            }
        }
    }

    // $[X]
    text = text.replace(/\$\[(\w+)\]/g, (match, varName) => {
        console.log(match)
        console.log(varName)
        if (!data.hasOwnProperty(varName)) {
            throw new Error(`Tag "${varName}" not found in data`)
        }

        if (data[varName] === undefined || data[varName] === null) {
            throw new Error(`Tag "${varName}" is undefined/null`)
        }

        if (!Array.isArray(data[varName]) || data[varName].length === 0) {
            throw new Error(`Tag "${varName}" is not a valid`)
        }
        return data[varName][0].toString();
    });
    console.log(text)

    // $date
    if (col.dateTime !== undefined) text = text.replace(/\$date/g, "'" + dateToString(col.dateTime.toDate()) + "'")

    // $dateStart
    //if(col.dateTimeStart !== undefined) text = text.replace(/\$dateStart/g, dateToString(col.dateTimeStart.toDate()))

    // $iter
    //console.log("iter", iter)
    if (iter !== undefined) text = text.replace(/\$iter/g, iter.toString())

    //console.log("res replace", text)
    if (/\$\[|\$dyn|\$out|\$date|\$iter/.test(text)) {
        throw new Error(`Unresolved variables remain in text: ${text}`)
    }

    return text
}

const executeString = async (code: string, signal?: AbortSignal) => {
    await pulse()
    checkAbort(signal)
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

const applyFormatToRes = (res: string, format: ExtraCalcFormat, selectedDate?: DateTime): string => {
    if (format === ExtraCalcFormat.addDays && selectedDate) {
        console.log('res', res)
        const num = Number(res)
        console.log('num', num)
        let copyDate = dateTime(selectedDate)
        return copyDate.add(num, 'days').toDate().toLocaleDateString('en-EN', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return res
}

const createRequests = (iniRes: IResult, num: number, calcValues: Record<string, number>, tags: IECTagIter[], data: IDataPred, idNumber: number, isProcessed = false): PostChangeIDataPred => {
    let res: IResult[] = []
    let allData: IDataPred[] = []
    for (let i = 0; i < num; i++) {
        let newResult: IResult = deepCopy(iniRes)
        newResult.id = newResult.id + "_" + (idNumber + i)

        for (let t = 0; t < tags.length; t++) {
            const tagIter = tags[t]
            let mean = getMean(data[tagIter.tag])
            let newValue = applyCalcValue(mean, calcValues[tagIter.tag], tagIter.calc)
            data = {
                ...data,
                [tagIter.tag]: getListValuesFromNew(newValue, mean, data[tagIter.tag])
            }
            if (tagIter.showPlot === undefined || tagIter.showPlot) {
                newResult.correspondsWith = {
                    ...newResult.correspondsWith,
                    [tagIter.tag]: newValue
                }
            }
        }

        const copyData = { ...data }
        allData.push(copyData)
        if (isProcessed) {
            newResult.processedData = { ...copyData }
        } else {
            newResult.data = { ...copyData }
        }

        res.push(newResult)
    }
    return { newData: allData, newResults: res }
}

const check = async (r: IResult, extraCalc: IExtraCalc, col: IDataCollection, isAfter: boolean, dyn?: string[], iter?: number, signal?: AbortSignal) => {
    if (r.result) {
        let condition = ""
        if (isAfter && r.processedData) {
            condition = replaceVariables(extraCalc, col, extraCalc.until, r.processedData, dyn, r.result, iter)
        } else {
            condition = replaceVariables(extraCalc, col, extraCalc.until, r.data, dyn, r.result, iter)
        }
        return await executeString(condition, signal)
    }
    return false
}

/**
 * Executes an extra calculation over a data collection using a given model and configuration.
 * Iteratively generates prediction requests until a termination condition is met,
 * then computes and attaches the final result to the collection.
 *
 * @param model - The ML model used for predictions, including its tags and configuration.
 * @param extraCalc - Configuration for the extra calculation (tag, formula, condition, format, etc.).
 * @param col - The data collection to operate on; results are attached to it in-place.
 * @param dyn - Optional dynamic variable values used in formula evaluation.
 * @param signal - Optional AbortSignal to allow cancellation mid-execution.
 * @returns The mutated data collection with `resultsExtraCalc` and `conclusionExtraCalc` populated.
 */
export const extraCalcCollection = async (model: IModel, extraCalc: IExtraCalc, col: IDataCollection, dyn?: string[], signal?: AbortSignal): Promise<IDataCollection> => {

    // Only proceed if the model contains all tags referenced by this extra calculation.
    const missingTags = extraCalc.tagsIter.map((t: IECTagIter) => t.tag).filter((tagId: string) => !model.tags.some((t: ITag) => t.id === tagId))

    if (missingTags.length > 0) {
        // The model does not contain the required tag — mark the result as an error.
        //col.conclusionExtraCalc = new ConclusionRes("ERROR", `Missing tags in model: ${missingTags.join(", ")}`)
        throw new Error(`Missing tags in model: ${missingTags.join(", ")}`)
    } else {
        let res: IResult[] = []
        let calcValues: Record<string, number> = {}
        const tagsIter = extraCalc.tagsIter
        let results: IResult[] = []
        const isAfter = extraCalc.whenApply === WhenApplyEnum.afterPreprocess

        // Step 1: Prepare the initial input data from the collection,
        // trimmed/padded to the model's expected input length.
        let data: IDataPred = prepareInitialData(col, model.numberOfValues)

        // Step 2: Build the seed result using the mean of the target tag as the initial reference value.
        const iniResult: IResult = {
            id: "extraCalc",
            data: { ...data },
            correspondsWith: Object.fromEntries(
                tagsIter.filter((t: IECTagIter) => t.showPlot === undefined || t.showPlot).map((t: IECTagIter) => [t.tag, getMean(data[t.tag])])
            )
        }

        checkAbort(signal)

        // Step 3: Generate the initial batch of prediction results.
        // The approach differs depending on whether the calculation is applied before or after preprocessing.
        if (isAfter) {
            // "After preprocessing" mode: preprocess the seed result first, then compute
            // the calc value using the preprocessed data, and build subsequent requests from it.
            const prep = await prepareToPredict(model, [iniResult])
            checkAbort(signal)
            for (let i = 0; i < tagsIter.length; i++) {
                const ti = tagsIter[i]
                calcValues[ti.tag] = await executeString(replaceVariables(extraCalc, col, ti.calcValue, prep.newData[0], dyn, undefined, 0))
            }
            const requests = createRequests(iniResult, (extraCalc.numRequests - 1), calcValues, tagsIter, prep.newData[0], 1, true)
            results = await predictResults(model, [...prep.newData, ...requests.newData], [...prep.newResults, ...requests.newResults], signal)
        } else {
            // "Before preprocessing" mode: compute the calc value directly from raw data,
            // then create requests and run preprocessing + prediction in a single pass.
            for (let i = 0; i < tagsIter.length; i++) {
                const ti = tagsIter[i]
                calcValues[ti.tag] = await executeString(replaceVariables(extraCalc, col, ti.calcValue, data, dyn, undefined, 0))
            }
            results = [iniResult, ...createRequests(iniResult, (extraCalc.numRequests - 1), calcValues, tagsIter, data, 1).newResults]
            results = await prepareAndPredictResults(model, results, signal)
        }

        checkAbort(signal)

        // Step 4: Scan the initial batch to find the first result that satisfies the stop condition.
        let idxFin = -1;
        for (let i = 0; i < results.length; i++) {
            checkAbort(signal)
            if (await check(results[i], extraCalc, col, isAfter, dyn, i)) {
                idxFin = i;
                break;
            }
        }

        // Step 5: If no result satisfies the condition, keep generating and checking new batches
        // iteratively until one does. Each iteration extends from the last predicted data point.
        while (idxFin < 0) {
            await pulse()
            checkAbort(signal)

            if (res.length >= extraCalc.maxIterations) {
                console.warn(`[Extra calc]: maxIterations (${extraCalc.maxIterations}) reached without meeting stop condition.`)
                break
            }

            console.log("idxFin", idxFin)

            const lastRes = results[results.length - 1]
            res.push(...results);

            // Generate the next batch of requests, starting from the last predicted state.
            if (isAfter && lastRes.processedData) {
                data = lastRes.processedData
                results = [...createRequests(iniResult, extraCalc.numRequests, calcValues, tagsIter, data, res.length).newResults]
                const requests = createRequests(iniResult, extraCalc.numRequests, calcValues, tagsIter, data, res.length, true)
                results = await predictResults(model, [...requests.newData], [...requests.newResults], signal)
            } else {
                data = lastRes.data
                results = [...createRequests(iniResult, extraCalc.numRequests, calcValues, tagsIter, data, res.length).newResults]
                results = await prepareAndPredictResults(model, results, signal)
            }

            // Re-scan the new batch for the termination condition.
            idxFin = -1;
            for (let i = 0; i < results.length; i++) {
                checkAbort(signal)
                if (await check(results[i], extraCalc, col, isAfter, dyn, (res.length + i))) {
                    idxFin = i;
                    break;
                }
            }
        }

        checkAbort(signal)

        // Step 6: Trim the accumulated results up to (but not including) the terminating result.
        // If no intermediate results were collected, keep at least the first one to avoid an empty set.
        res = [...res, ...results.slice(0, idxFin)]
        if (res.length === 0) res = [results[0]]
        col.resultsExtraCalc = res

        // Step 7: Compute the final output value from the last result using the configured formula,
        // apply the specified format, and optionally compute a subtitle.
        const finalResult = res[res.length - 1]
        console.log("finalResult", finalResult)
        const finalDataPred = (isAfter && finalResult.processedData && finalResult.result) ? finalResult.processedData : finalResult.data
        let processedRes = await executeString(replaceVariables(extraCalc, col, extraCalc.resValue, finalDataPred, dyn, finalResult.result, res.length - 1))
        processedRes = applyFormatToRes(processedRes, extraCalc.resFormat, col.dateTime)
        let subtitleRes = (extraCalc.resSubtitle) ? await executeString(replaceVariables(extraCalc, col, extraCalc.resSubtitle, finalDataPred, dyn, finalResult.result, res.length - 1)) : ''
        col.conclusionExtraCalc = new ConclusionRes(processedRes, subtitleRes)
    }
    console.log("Result col extra calc", col)
    return col
}

const prepareInitialData = (dataCollection: IDataCollection, numberOfValues?: number): IDataPred => {
    const hasInterval = dataCollection.interval.max !== undefined && dataCollection.interval.min !== undefined && dataCollection.interval.steps !== undefined
    return newDataToObject(dataCollection.data, hasInterval, numberOfValues)
}
