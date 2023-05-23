import Papa from "papaparse";
import { IData, IDataCollection, IModel, IResult } from "./types";
import { idDefault, idNew } from "./constants";
import { IntervalDefault } from "./default";

const compare = (a:IData, b:IData) => {
    if ((a.new_value !== undefined && b.new_value === undefined) 
        || (a.set_percentage === true && b.set_percentage !== true && b.new_value === undefined && a.new_value === undefined)){
        return -1
    } else if (a.set_percentage == b.set_percentage && (a.new_value === undefined) == (b.new_value === undefined)) {
        return 0
    } else {
        return 1 
    }
}

export const dataToCSV = (collection:IDataCollection) => {
    let res : any[] = [], others : any[] = []
    let _int:any = {}, _def:any = {}, _new:any = {}
    const has_interval = collection.interval.max && collection.interval.min && collection.interval.steps

    collection.data.sort(compare).forEach((d:IData) => {
        if(has_interval) {
            _int = {
                ..._int,
                [d.id] : (d.set_percentage) ? "YES" : "NO"
            }
        }

        _def = {
            ..._def,
            [d.id] : d.default_value
        }

        _new = {
            ..._new,
            [d.id] : (has_interval && d.set_percentage) ? "" :  d.new_value
        }
    })

    
    console.log("COLECCION?", collection)

    if (collection.results !== undefined) {
        const def = collection.results.find((r:IResult) => r.id == idDefault)
        const ne = collection.results.find((r:IResult) => r.id == idNew)

        _int = { _RESULT : "", ..._int }
        _def = {
            _RESULT : (def !== undefined && def.result !== undefined) ? def.result : "",
            ..._def
        }
        _new = {
            _RESULT : (ne !== undefined && ne.result !== undefined) ? ne.result : "",
            ..._new
        }

        console.log("AAA", "collection.results")
        collection.results.filter((r:IResult) => r.correspondsWith !== undefined).forEach((r:IResult, idx:number) => {
            if(r.correspondsWith && r.correspondsWith.porcentage !== 0){
                const id:string = r.correspondsWith.tag +  " " + ((r.correspondsWith.porcentage < 0) ? "-" : "+") + " " + Math.abs(r.correspondsWith.porcentage) + "%"
                let row:any = {
                    ID : id,
                    _RESULT : r.result
                }
                
                Object.entries(r.data).forEach(([key, value]:[key:string, value:number]) => {
                    row = {
                        ...row,
                        [key] : ((r.correspondsWith && r.correspondsWith.tag == key) || value !== _def[key]) ? value : ""
                    }
                })

                others.push(row)
            }
        })
    }

    if (has_interval) {
        res = [
            {
                ID : "_INTERVAL",
                ..._int
            }
        ]
    }

    // Lo junto todo
    res = [
        ...res,
        {
            ID : "DEFAULT_VALUE",
            ..._def
        },
        {
            ID : "NEW_VALUE",
            ..._new
        },
        ...others
    ]

    // Metadata
    const dateTime = (collection.dateTime) ? "# DateTime: " + collection.dateTime.toISOString() + "\n" : ""
    const interval = (collection.interval.max && collection.interval.min && collection.interval.steps) ? "# Interval: " + collection.interval.min + " " + collection.interval.max + " " + collection.interval.steps + "\n" : ""
    
    // Convertir a CSV
    const blob = new Blob([dateTime + interval + Papa.unparse(res)], { type: 'text/csv;charset=utf-8,' })
    return URL.createObjectURL(blob)
}

export const getIntervalCSV = (csv:any) => {
    return IntervalDefault
}

export const getDateTimeCSV = (csv:any) => {
    return undefined
}

export const CSVtoData = (csv:any, model:IModel) : IData[] => {
    const fileData:IData[] = []
    csv.forEach((d:any) => {
        if(model.tags.some((t) => t.id == d[0])){
            fileData.push({
                id: d[0],
                default_value: d[1]
            })
        }
    })
    return fileData
}