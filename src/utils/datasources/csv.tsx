import Papa from "papaparse";
import { IData, IDataCollection, IInterval, IModel, IResult, ITag, IntervalTypeEnum } from "../types";
import { idDefault, idNew } from "../constants";
import { IntervalDefault } from "../default";
import { DateTime, dateTime } from "@grafana/data";
import { getMean } from "utils/utils";

const compare = (a: IData, b: IData) => {
    if ((a.new_value !== undefined && b.new_value === undefined)
        || (a.set_percentage === true && b.set_percentage !== true && b.new_value === undefined && a.new_value === undefined)) {
        return -1
    } else if (a.set_percentage == b.set_percentage && (a.new_value === undefined) == (b.new_value === undefined)) {
        return 0
    } else {
        return 1
    }
}

export const dataToCSV = (collection: IDataCollection) => {
    let res: any[] = [], others: any[] = []
    let _int: any = {}, _def: any = {}, _new: any = {}
    const has_interval = collection.interval.max && collection.interval.min && collection.interval.steps

    collection.data.sort(compare).forEach((d: IData) => {
        if (has_interval) {
            _int = {
                ..._int,
                [d.id]: (d.set_percentage) ? "YES" : "NO"
            }
        }

        _def = {
            ..._def,
            [d.id]: d.raw_values
        }

        _new = {
            ..._new,
            [d.id]: (has_interval && d.set_percentage) ? "" : d.new_value
        }
    })


    //console.log("COLECCION?", collection)

    if (collection.results !== undefined) {
        const def = collection.results.find((r: IResult) => r.id == idDefault)
        const ne = collection.results.find((r: IResult) => r.id == idNew)

        _int = { _RESULT: "", ..._int }
        _def = {
            _RESULT: (def !== undefined && def.result !== undefined) ? def.result : "",
            ..._def
        }
        _new = {
            _RESULT: (ne !== undefined && ne.result !== undefined) ? ne.result : "",
            ..._new
        }

        //console.log("AAA", "collection.results")
        collection.results.filter((r: IResult) => r.correspondsWith !== undefined).forEach((r: IResult, idx: number) => {
            if (r.correspondsWith && r.correspondsWith.intervalValue !== 0) {
                const id: string = r.correspondsWith.tag + " " + ((r.correspondsWith.intervalValue < 0) ? "-" : "+") + " " + Math.abs(r.correspondsWith.intervalValue) + ((collection.interval.type === IntervalTypeEnum.percentage) ? "%" : "")
                let row: any = {
                    ID: id,
                    _RESULT: r.result
                }

                Object.entries(r.data).forEach(([key, value]: [key: string, value: number|number[]]) => {
                    row = {
                        ...row,
                        [key]: ((r.correspondsWith && r.correspondsWith.tag == key) || value !== _def[key]) ? value : ""
                    }
                })

                others.push(row)
            }
        })
    }

    if (has_interval) {
        res = [
            {
                ID: "_INTERVAL",
                ..._int
            }
        ]
    }

    // Lo junto todo
    res = [
        ...res,
        {
            ID: "DEFAULT_VALUE",
            ..._def
        },
        {
            ID: "NEW_VALUE",
            ..._new
        },
        ...others
    ]

    // Metadata
    const dateTime = (collection.dateTime) ? "# DateTime: " + collection.dateTime.toISOString() + "\n" : ""
    const interval = (collection.interval.max && collection.interval.min && collection.interval.steps) ?
        "# Interval: " + collection.interval.min + " " + collection.interval.max + " " + collection.interval.steps + " " + intervalModeToString(collection.interval.type) + "\n" : ""

    // Convertir a CSV
    const blob = new Blob([dateTime + interval + Papa.unparse(res)], { type: 'text/csv;charset=utf-8,' })
    return URL.createObjectURL(blob)
}

export const stringToIntervalMode = (str: string) => {
    return str.toLowerCase().trim() == "units" ? IntervalTypeEnum.units : IntervalTypeEnum.percentage
}

export const intervalModeToString = (intMode: IntervalTypeEnum) => {
    return intMode == IntervalTypeEnum.units ? "units" : "percentage"
}

export const getIntervalCSV = (csv: string[][]): IInterval => {
    const comment: string[] | undefined = csv.find((v: string[]) => v.length > 0 && v.join("").replace(/ /g, '').toUpperCase().startsWith('#INTERVAL:'))
    if (comment != undefined && comment.length > 0) {
        const interval: string[] = comment.join("").toUpperCase().replace("#", "").replace("INTERVAL", "").replace(":", "").trim().split(" ")
        if (interval.length >= 3) {
            return {
                min: Number(interval[0]),
                max: Number(interval[1]),
                steps: Number(interval[2]),
                type: (interval.length >= 4) ? stringToIntervalMode(interval[3]) : IntervalTypeEnum.percentage
            }
        }
    }
    return IntervalDefault
}

export const getDateTimeCSV = (csv: string[][]): DateTime | undefined => {
    const comment: string[] | undefined = csv.find((v: string[]) => v.length > 0 && v.join("").replace(/ /g, '').toUpperCase().startsWith('#DATETIME:'))
    if (comment != undefined && comment.length > 0) {
        const dt: string = comment.join("").toUpperCase().replace(/ /g, '').replace("#DATETIME:", "").trim()
        //console.log("getDateTime", dt)
        const timestamp = Date.parse(dt)
        if (!isNaN(timestamp)) return dateTime(timestamp)
    }
    return undefined
}

const fixEnd = (list: string[] | undefined) => {
    if (list && list.length > 0) {
        if (list[list.length - 1].endsWith("\n")) list[list.length - 1] = list[list.length - 1].slice(0, -1)
        if (list[list.length - 1].endsWith("\r")) list[list.length - 1] = list[list.length - 1].slice(0, -1)
    }
    return list
}

export const CSVtoData = (csv: string[][], model: IModel): IData[] => {
    const fileData: IData[] = []

    //const noComments:string[][] = csv.filter((v:string[]) => v.length > 0 && !v.join("").replace(/ /g,'').toUpperCase().startsWith('#'))
    const ids: string[] | undefined = fixEnd(csv.find((v: string[]) => v.length > 0 && v[0].toUpperCase().trim() == "ID"))
    const def: string[] | undefined = fixEnd(csv.find((v: string[]) => v.length > 0 && v[0].toUpperCase().trim() == "DEFAULT_VALUE"))
    let nw: string[] | undefined = fixEnd(csv.find((v: string[]) => v.length > 0 && v[0].toUpperCase().trim() == "NEW_VALUE"))
    let interval: string[] | undefined = fixEnd(csv.find((v: string[]) => v.length > 0 && v[0].toUpperCase().trim() == "_INTERVAL"))

    if (ids && def && ids.length == def.length) {
        if (nw && nw.length != ids.length) nw = undefined
        if (interval && interval.length != ids.length) interval = undefined

        ids.forEach((d: string, idx: number) => {
            if (model.tags.some((t: ITag) => t.id == d)) {
                let raw_values:number[] = []
                if (def[idx].trim() != "") {
                    raw_values = def[idx].split(",").map((v:string) => Number(v))
                }
                fileData.push({
                    id: d,
                    default_value: getMean(raw_values),
                    raw_values: raw_values,
                    new_value: (nw && nw[idx].trim() != "") ? nw[idx] : undefined,
                    set_percentage: (interval) ? interval[idx] == "YES" : undefined
                })
            }
        })
    }
    return fileData
}