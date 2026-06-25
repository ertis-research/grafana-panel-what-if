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
    } else if (a.set_percentage === b.set_percentage && (a.new_value === undefined) === (b.new_value === undefined)) {
        return 0
    } else {
        return 1
    }
}

export const dataToCSV = (collection: IDataCollection, isMultiModel: boolean) => {
    const has_interval = Boolean(collection.interval?.max && collection.interval?.min && collection.interval?.steps);
    
    // 1. Construcción eficiente de diccionarios (mutación directa = O(N))
    const _int: Record<string, string> = {};
    const _def: Record<string, any> = {};
    const _new: Record<string, any> = {};

    collection.data.sort(compare).forEach((d: IData) => {
        if (has_interval) _int[d.id] = d.set_percentage ? "YES" : "NO";
        _def[d.id] = d.raw_values;
        _new[d.id] = (has_interval && d.set_percentage) ? "" : d.new_value;
    });

    // 2. Helper para generar filas, manteniendo el orden estricto de columnas
    // La columna MODEL_ID se omite por completo si isMultiModel es false
    const createRow = (id: string, modelId: string, resultVal: any, dataRow: any) => ({
        ID: id,
        ...(isMultiModel ? { MODEL_ID: modelId } : {}),
        _RESULT: resultVal !== undefined ? resultVal : "",
        ...dataRow
    });

    let res: any[] = [];

    // Fila de intervalos (siempre la primera para definir cabeceras si existe)
    if (has_interval) {
        res.push(createRow("_INTERVAL", "", "", _int));
    }

    // 3. Procesar resultados
    if (collection.results !== undefined && collection.results.length > 0) {
        const def = collection.results.find((r: IResult) => r.id === idDefault);
        const ne = collection.results.find((r: IResult) => r.id === idNew);

        // Función auxiliar para procesar DEFAULT_VALUE y NEW_VALUE
        const processBaseResult = (resultObj: IResult | undefined, idLabel: string, baseData: any) => {
            if (resultObj?.result && resultObj.result.length > 0) {
                return resultObj.result.map(m => createRow(idLabel, m.modelId, m.result, baseData));
            }
            return [createRow(idLabel, "", "", baseData)]; // Fallback
        };

        // Añadir defaults y news al resultado global
        res = res.concat(
            processBaseResult(def, "DEFAULT_VALUE", _def),
            processBaseResult(ne, "NEW_VALUE", _new)
        );

        // Procesar las filas dinámicas generadas por los intervalos
        const others: any[] = [];
        const intervalTypeStr = collection.interval?.type === IntervalTypeEnum.percentage ? "%" : "";

        collection.results.forEach((r: IResult) => {
            if (!r.correspondsWith) return;

            Object.entries(r.correspondsWith).forEach(([tag, intervalValue]) => {
                if (intervalValue === 0) return;

                const id = `${tag} ${intervalValue < 0 ? "-" : "+"} ${Math.abs(intervalValue)}${intervalTypeStr}`;
                
                // OPTIMIZACIÓN: Pre-calcular rowData una sola vez por intervalo, no por modelo
                const rowData: any = {};
                Object.entries(r.data).forEach(([key, value]) => {
                    rowData[key] = (tag === key || value !== _def[key]) ? value : "";
                });

                if (r.result && r.result.length > 0) {
                    r.result.forEach(m => {
                        others.push(createRow(id, m.modelId, m.result, rowData));
                    });
                } else {
                    others.push(createRow(id, "", "", rowData));
                }
            });
        });

        res = res.concat(others);
    } else {
        // Fallback global por si collection.results está vacío
        res = res.concat([
            createRow("DEFAULT_VALUE", "", "", _def),
            createRow("NEW_VALUE", "", "", _new)
        ]);
    }

    // 4. Metadata y conversión final
    let meta = "";
    if (collection.dateTime) {
        meta += `# DateTime: ${collection.dateTime.toISOString()}\n`;
    }
    if (has_interval) {
        meta += `# Interval: ${collection.interval.min} ${collection.interval.max} ${collection.interval.steps} ${intervalModeToString(collection.interval.type)}\n`;
    }

    const blob = new Blob([meta + Papa.unparse(res)], { type: 'text/csv;charset=utf-8,' });
    return URL.createObjectURL(blob);
};

export const stringToIntervalMode = (str: string) => {
    return str.toLowerCase().trim() === "units" ? IntervalTypeEnum.units : IntervalTypeEnum.percentage
}

export const intervalModeToString = (intMode: IntervalTypeEnum) => {
    return intMode === IntervalTypeEnum.units ? "units" : "percentage"
}

export const getIntervalCSV = (csv: string[][]): IInterval => {
    const comment: string[] | undefined = csv.find((v: string[]) => v.length > 0 && v.join("").replace(/ /g, '').toUpperCase().startsWith('#INTERVAL:'))
    if (comment !== undefined && comment.length > 0) {
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
    if (comment !== undefined && comment.length > 0) {
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
    const ids: string[] | undefined = fixEnd(csv.find((v: string[]) => v.length > 0 && v[0].toUpperCase().trim() === "ID"))
    const def: string[] | undefined = fixEnd(csv.find((v: string[]) => v.length > 0 && v[0].toUpperCase().trim() === "DEFAULT_VALUE"))
    let nw: string[] | undefined = fixEnd(csv.find((v: string[]) => v.length > 0 && v[0].toUpperCase().trim() === "NEW_VALUE"))
    let interval: string[] | undefined = fixEnd(csv.find((v: string[]) => v.length > 0 && v[0].toUpperCase().trim() === "_INTERVAL"))

    if (ids && def && ids.length === def.length) {
        if (nw && nw.length !== ids.length) nw = undefined
        if (interval && interval.length !== ids.length) interval = undefined

        ids.forEach((d: string, idx: number) => {
            if (model.tags.some((t: ITag) => t.id === d)) {
                let raw_values: number[] = []
                if (def[idx].trim() !== "") {
                    raw_values = def[idx].split(",").map((v: string) => Number(v))
                }
                fileData.push({
                    id: d,
                    default_value: getMean(raw_values),
                    raw_values: raw_values,
                    new_value: (nw && nw[idx].trim() !== "") ? nw[idx] : undefined,
                    set_percentage: (interval) ? interval[idx] === "YES" : undefined
                })
            }
        })
    }
    return fileData
}
