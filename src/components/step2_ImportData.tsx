import { Button, DateTimePicker, Select, useTheme2, VerticalGroup } from '@grafana/ui'
import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { Context, dateTimeLocalToString, dateTimeToString, dateTimeToTimestamp, disabledByJS } from 'utils/utils'
import { IData, IDataCollection, IInterval, IModel } from 'utils/types'
import { getExtraInfo, saveVariableValue } from 'utils/datasources/grafana'
import { AppEvents, DataFrame, dateTime, DateTime, LoadingState, PanelData, SelectableValue } from '@grafana/data'
import Papa, { ParseError } from 'papaparse'
import { DefaultImportData, ImportDataEnum, ImportDataOptions, Steps, VariablesGrafanaOptions } from 'utils/constants'
import { IntervalDefault } from 'utils/default'
import { getAppEvents, locationService } from '@grafana/runtime'
import { CSVtoData, getDateTimeCSV, getIntervalCSV } from 'utils/datasources/csv'

interface Props {
    model?: IModel,
    collections: IDataCollection[],
    addCollection: (newCollection: IDataCollection) => void,
    data: PanelData
}

export const ImportData: React.FC<Props> = ({ model, collections, addCollection, data }) => {

    const theme = useTheme2()
    const context = useContext(Context)

    const fieldTag = context.options.columnTag 
    const fieldValue = context.options.columnValue 
    const fieldValueExtraInfo = context.options.columnValueExtraInfo
    const fieldNameInfo = context.options.columnNameExtraInfo

    //const idFileUpload = "fileUpload"
    const idDateTimeSet = "dateTimeSet"

    const [dateTimeInput, setDateTimeInput] = useState<DateTime>()
    const [mode, setMode] = useState<SelectableValue<number>>(DefaultImportData(context.messages))
    const [selectedGrafanaVariable, setSelectedGrafanaVariable] = useState<SelectableValue<DateTime>>()
    const [fileCSV, setFileCSV] = useState<File>()
    const [disabled, setDisabled] = useState(true)
    const [disabledButton, setDisabledButton] = useState(true)
    const [hasToSaveNewData, setHasToSaveNewData] = useState<DateTime | undefined>(undefined)

    const addCollectionWithName = (key: string, name: string, from: string, data: IData[], dTime?: DateTime, int?: IInterval, extraInfo?:any) => {
        let rep = collections.filter((col: IDataCollection) => col.id.includes(key)).length
        let id = from + ":" + key + ((rep != 0) ? "_" + rep : "")
        while (collections.some((col: IDataCollection) => col.id === id)) {
            rep = rep + + 1
            id = from + ":" + key + ((rep != 0) ? "_" + rep : "")
        }
        addCollection({
            id: id,
            name: "Data from " + from + ": " + name + ((rep != 0) ? " (" + rep + ")" : ""),
            dateTime: dTime,
            interval: (int !== undefined) ? int : IntervalDefault,
            data: data,
            extraInfo: extraInfo
        })
        const appEvents = getAppEvents();
        appEvents.publish({
            type: AppEvents.alertSuccess.name,
            payload: [context.messages._panel._step2.alertCollectionAdded]
        })
        if (context.actualStep != undefined && context.actualStep < Steps.step_3) context.setActualStep(Steps.step_3)
    }

    const getArrayOfData = (data: PanelData, idQuery: string) => {
        let res: IData[] = []
        const serieData: DataFrame | undefined = data.series.find((serie) => serie.refId == idQuery)
        if (serieData) {
            const fieldTagData = serieData.fields.find((field) => field.name == fieldTag)
            const fieldValueData = serieData.fields.find((field) => field.name == fieldValue)
            if (fieldTagData && fieldValueData) {
                fieldTagData.values.toArray().forEach((d: string, idx: number) => {
                    res.push({
                        id: d,
                        default_value: fieldValueData.values.get(idx)
                    })
                })
            }
        }
        return res
    }

    // Para imitar el bug: añadir varias veces data del mismo tiempo, eliminarlos todos y añadir otro
    const importDataFromDateTime = (dt?: DateTime) => {
        if (dt != undefined && model != undefined) {
            // Lo comentado hace que se dupliquen los datos de la coleccion que tenga la misma key en lugar de pedirlo de nuevo
            //const timestamp = dateTimeToTimestamp(dt).toString()
            //const indx = collections.findIndex((col: IDataCollection) => col.id.includes(timestamp))
            //if (indx < 0) {
            setHasToSaveNewData(dt)
            saveVariableValue(locationService, context.options.varTime, dateTimeToString(dt))
            /*} else {
                var copyColData: IData[] = deepCopy(collections[indx].data)
                copyColData = copyColData.map((d: IData) => { 
                    if (d.default_value !== undefined) delete d.new_value; 
                    delete d.set_percentage 
                    return d 
                })
                addCollectionWithName(timestamp, dateTimeLocalToString(dt), "DateTime", copyColData, dateTimeInput)
            }*/
        }
    }

    const importDataFromCSV = () => {
        console.log("EXCEL")
        if (fileCSV && model != undefined) {
            Papa.parse(fileCSV, {
                header: false,
                skipEmptyLines: 'greedy',
                complete: function (results) {
                    const d = results.data as string[][]
                    results.errors.forEach((e: ParseError) => {
                        const appEvents = getAppEvents();
                        appEvents.publish({
                            type: AppEvents.alertError.name,
                            payload: [e.type + ": " + e.code, e.message + ((e.row != undefined) ? " (Row: " + e.row + ")" : "")]
                        })
                    })
                    const dt = getDateTimeCSV(d)
                    const data = CSVtoData(d, model)
                    const name = fileCSV.name + ((dt !== undefined) ? " (" + dateTimeLocalToString(dt) + ")" : "")
                    if (data.length > 0) {
                        addCollectionWithName(fileCSV.name, name, "CSV", data, dt, getIntervalCSV(d))
                        setFileCSV(fileCSV)
                    } else {
                        const appEvents = getAppEvents();
                        appEvents.publish({
                            type: AppEvents.alertError.name,
                            payload: [context.messages._panel._step2.alertCSVnoData]
                        })
                    }

                }
            })
        }
    }

    const handleOnChangeDateTime = (newDatetime: DateTime) => {
        setDateTimeInput(newDatetime)
        console.log(dateTimeInput?.toISOString())
    }

    const handleOnFileUploadCSV = (event: FormEvent<HTMLInputElement>) => {
        const currentTarget = event.currentTarget
        if (currentTarget?.files && currentTarget.files.length > 0) {
            setFileCSV(currentTarget.files[0])
        }
    }

    const handleButtonFileUpload = () => {
        const ele = document.getElementById("selectedFile")
        if (ele != null) ele.click()
    }

    const handleOnClickAddData = () => {
        console.log("addDATA")
        switch (mode.value) {
            case ImportDataEnum.EXCEL:
                importDataFromCSV()
                break
            case ImportDataEnum.DATETIME_VARIABLE_GRAFANA:
                if (selectedGrafanaVariable) {
                    importDataFromDateTime(selectedGrafanaVariable.value)
                    break
                }
            default: // Datetime
                importDataFromDateTime(dateTimeInput)
                break
        }
    }

    useEffect(() => {
    }, [context.messages])


    useEffect(() => {
        let newDisabled: boolean = true
        let newDisabledButton: boolean = true

        if (context.actualStep) {
            newDisabled = context.actualStep !== Steps.step_2 && context.actualStep !== Steps.step_3
            if (!newDisabled) newDisabledButton = !(
                (mode.value === ImportDataEnum.EXCEL && fileCSV != undefined) || 
                (mode.value === ImportDataEnum.DATETIME_VARIABLE_GRAFANA && selectedGrafanaVariable && selectedGrafanaVariable.value !== undefined) || 
                (mode.value === ImportDataEnum.DATETIME_SET && dateTimeInput != undefined))
        }
        setDisabled(newDisabled)
        setDisabledButton(newDisabledButton)
    }, [context.actualStep, fileCSV, dateTimeInput, mode, selectedGrafanaVariable])

    useEffect(() => {
        disabledByJS(disabled, idDateTimeSet, document)
    }, [disabled, mode])

    useEffect(() => {
        console.log('dateTimeFormat', dateTimeInput?.utc().format('YYYY-MM-DDTHH:mm:ss'))
    }, [dateTimeInput])

    useEffect(() => {
        console.log("LLEGAN DATA")
        if (hasToSaveNewData !== undefined 
            && (hasToSaveNewData === dateTimeInput || (selectedGrafanaVariable && hasToSaveNewData === selectedGrafanaVariable.value)) 
            && model != undefined 
            && (data.state == LoadingState.Done || data.state == LoadingState.Error)) {

            if (data.state == LoadingState.Done) {
                console.log("Done")
                console.log("Data", data)
                let extraInfo = undefined
                const arrayData = getArrayOfData(data, model.queryId)
                if(model && model.extraInfo !== undefined) extraInfo = getExtraInfo(data, model.extraInfo, fieldNameInfo, fieldValueExtraInfo)
                if (arrayData.length > 0) {
                    addCollectionWithName(dateTimeToTimestamp(hasToSaveNewData).toString(), dateTimeLocalToString(hasToSaveNewData), "DateTime", arrayData, hasToSaveNewData, IntervalDefault, extraInfo)
                } else {
                    const appEvents = getAppEvents();
                    appEvents.publish({
                        type: AppEvents.alertError.name,
                        payload: [context.messages._panel._step2.alertDateTimenoData]
                    })
                }
            } else {
                const appEvents = getAppEvents();
                appEvents.publish({
                    type: AppEvents.alertError.name,
                    payload: [data.error]
                })
            }
            saveVariableValue(locationService, context.options.varTime, dateTimeToString(dateTime()))
            setHasToSaveNewData(undefined)
        }
    }, [data])

    useEffect(() => {
    }, [collections])


    // HTML
    // -------------------------------------------------------------------------------------------------------------

    const ImportExcel = <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }} >
        <input type="file" accept='.csv, text/csv' id="selectedFile" hidden style={{ display: 'none' }} onChange={handleOnFileUploadCSV} />
        <Button icon='upload' fullWidth disabled={disabled} onClick={handleButtonFileUpload}>{context.messages._panel._step2.uploadFile}</Button>
        <div className='wrap-elipsis' title={(fileCSV) ? fileCSV.name : undefined} style={{ marginLeft: '10px' }}>{(fileCSV == undefined) ? context.messages._panel._step2.noFile : fileCSV.name}</div>
    </div>

    /*<FileUpload
            showFileName
            onFileUpload={handleOnFileUploadCSV}
            accept='.csv'
    />*/

    /*
        <Input 
            value={dateTimeInput?.local().format('YYYY-MM-DDTHH:mm:ss')} 
            type='datetime-local' 
            disabled={disabled} 
            onChange={handleOnChangeDateTime}
        />
    */

    const ImportDatetimeSet = <div id={idDateTimeSet} className='fullWidthChildren' style={{ width: '100%' }}>
        <DateTimePicker
            onChange={handleOnChangeDateTime}
            date={dateTimeInput}
            maxDate={new Date()}
        />
    </div>

    const ImportDatetimeVarGrafana =
        <Select
            options={VariablesGrafanaOptions(context.replaceVariables)}
            value={selectedGrafanaVariable}
            onChange={(v) => setSelectedGrafanaVariable(v)}
            disabled={disabled}
            className='fullWidth'
        />

    const importConfiguration = () => {
        if (mode && mode.value) {
            switch (mode.value) {
                case ImportDataEnum.EXCEL:
                    return ImportExcel

                case ImportDataEnum.DATETIME_SET:
                    return ImportDatetimeSet

                case ImportDataEnum.DATETIME_VARIABLE_GRAFANA:
                    return ImportDatetimeVarGrafana

                case ImportDataEnum.DATETIME_QUERY:
                    return <div></div>
            }
        }
        return ImportExcel
    }

    return <div style={{ backgroundColor: theme.colors.background.secondary, padding: '10px' }}>
        <p style={{ color: theme.colors.text.secondary, paddingBottom: '0px', marginBottom: '2px' }}>{context.messages._panel.step} 2</p>
        <h4>{context.messages._panel._step2.importData}</h4>
        <VerticalGroup justify='center'>
            <Select
                options={ImportDataOptions(context.messages)}
                value={mode}
                onChange={(v) => setMode(v)}
                disabled={disabled}
            />
            {importConfiguration()}
            <Button fullWidth disabled={disabledButton || hasToSaveNewData !== undefined} icon={(hasToSaveNewData !== undefined) ? 'fa fa-spinner' : undefined} onClick={handleOnClickAddData}>{context.messages._panel._step2.addData}</Button>
        </VerticalGroup>
    </div>
}