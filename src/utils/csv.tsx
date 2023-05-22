import Papa from "papaparse";
import { ICSVScheme, IData, IDataCollection, IResult } from "./types";
import { idDefault, idNew } from "./constants";

export const dataToCSV = (collection:IDataCollection) => {
    let res:any[] = collection.data.map((d:IData) => {
        return {
            ID : d.id,
            _INTERVAL : (d.set_percentage) ? "YES" : "NO",
            DEFAULT_VALUE : d.default_value,
            NEW_VALUE : d.new_value
        }
    })
    
    console.log("COLECCION?", collection)

    if (collection.results !== undefined) {
        const def = collection.results.find((r:IResult) => r.id == idDefault)
        const ne = collection.results.find((r:IResult) => r.id == idNew)
        let result = {
            ID: "_result",
            _INTERVAL : "",
            DEFAULT_VALUE : (def !== undefined && def.result !== undefined) ? def.result : "",
            NEW_VALUE : (ne !== undefined && ne.result !== undefined) ? ne.result : ""
        }

        console.log("AAA", "collection.results")
        collection.results.filter((r:IResult) => r.correspondsWith !== undefined).forEach((r:any, idx:number) => {
            if(r.correspondsWith.porcentage !== 0){
                const id:string = r.correspondsWith.tag +  " " + ((r.correspondsWith.porcentage < 0) ? "- " : "+") + " " + Math.abs(r.correspondsWith.porcentage) + "%"
                res = res.map((row:ICSVScheme) => {
                    return {
                        ...row,
                        [id] : (r.data[row.ID] !== row.DEFAULT_VALUE || r.correspondsWith.tag == row.ID) ? r.data[row.ID] : ""
                    }
                })
                result = {
                    ...result,
                    [id] : r.result
                }
                console.log("AAA", res)
            }
        })

        res.unshift(result)
    }
    //const dateTime = "# DateTime: "
    const interval = "# Interval: " + collection.interval.min + "," + collection.interval.max + "," + collection.interval.steps + "\n"
    const blob = new Blob([interval + Papa.unparse(res)], { type: 'text/csv;charset=utf-8,' })
    return URL.createObjectURL(blob)
}