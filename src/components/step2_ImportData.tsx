import { Button, DateTimePicker, Select, useTheme2, VerticalGroup } from '@grafana/ui'
import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { Context, dateTimeLocalToString, dateTimeToString, deepCopy, disabledByJS } from 'utils/utils'
import { IData, IDataCollection, IModel } from 'utils/types'
import { saveVariableValue } from 'utils/handleGrafanaVariable'
import { DataFrame, DateTime, LoadingState, PanelData, SelectableValue } from '@grafana/data'
import Papa from 'papaparse'
import { DefaultImportData, ImportDataEnum, ImportDataOptions, Steps, VariablesGrafanaOptions } from 'utils/constants'
import { IntervalDefault } from 'utils/default'
import { locationService } from '@grafana/runtime'
import { CSVtoData, getDateTimeCSV, getIntervalCSV } from 'utils/csv'

interface Props {
    model ?: IModel,
    collections : IDataCollection[],
    addCollection : (newCollection: IDataCollection) => void,
    data : PanelData
}

export const ImportData: React.FC<Props> = ({ model, collections, addCollection, data }) => {

    const theme = useTheme2()
    const context = useContext(Context)

    const fieldTag = "tag" // provisional
    const fieldValue = "value" // provisional

    //const idFileUpload = "fileUpload"
    const idDateTimeSet = "dateTimeSet"

    const [dateTimeInput, setDateTimeInput] = useState<DateTime>()
    const [mode, setMode] = useState<SelectableValue<number>>(DefaultImportData(context.messages))
    const [selectedGrafanaVariable, setSelectedGrafanaVariable] = useState<SelectableValue<DateTime>>()
    const [fileCSV, setFileCSV] = useState<File>()
    const [disabled, setDisabled] = useState(true)
    const [disabledButton, setDisabledButton] = useState(true)
    const [hasToSaveNewData, setHasToSaveNewData] = useState<DateTime|undefined>(undefined)

    const getArrayOfData = (data:PanelData, idQuery:string) => {
        let res:IData[] = []
        const serieData:DataFrame|undefined = data.series.find((serie) => serie.refId == 'A')
        if(serieData){
            const fieldTagData = serieData.fields.find((field) => field.name == fieldTag)
            const fieldValueData = serieData.fields.find((field) => field.name == fieldValue)
            if(fieldTagData && fieldValueData) {
                fieldTagData.values.toArray().forEach((d:string, idx:number) => {
                    res.push({
                        id : d,
                        default_value : fieldValueData.values.get(idx)
                    })
                })
            }
        }
        return res
    }

    // Para imitar el bug: añadir varias veces data del mismo tiempo, eliminarlos todos y añadir otro
    const importDataFromDateTime = (dt ?: DateTime) => {
        if(dt != undefined && model != undefined) { 
            const indx = collections.findIndex((col:IDataCollection) => col.id.includes(dateTimeLocalToString(dt)))
            if(indx < 0){
                console.log("NO encuentra")
                console.log("HOLA")
                setHasToSaveNewData(dt)
                saveVariableValue(locationService, context.options.varTime, dateTimeToString(dt))
                context.refresh(context.options)
                // Para arreglar bug: actualizar query
            } else {
                console.log("SI encuentra")
                console.log(collections)
                var copyColData:IData[] = deepCopy(collections[indx].data)
                copyColData = copyColData.map((d:IData) => {delete d.new_value; delete d.set_percentage; return d})
                addCollection({
                    id: "DateTime: " + dateTimeLocalToString(dt) + " (" + (collections.length+1) + ")",
                    name : "Data " + (collections.length+1) + " (DateTime)",
                    dateTime : dt,
                    interval: IntervalDefault,
                    data : copyColData
                })
            }
        }
    }

    const importDataFromCSV = () => {
        console.log("EXCEL")
        if(fileCSV && model != undefined){
            Papa.parse(fileCSV, {
                header: false,
                skipEmptyLines: 'greedy',
                complete: function (results) {
                    const d = results.data as string[][]
                    addCollection({
                        id: "csv_" + fileCSV.name + " (" + (collections.length+1) + ")",
                        name : "Data " + (collections.length+1) + " (CSV)",
                        dateTime: getDateTimeCSV(d),
                        interval: getIntervalCSV(d),
                        data: CSVtoData(d, model),
                    })
                }
            })
        }
    }

    const handleOnChangeDateTime = (newDatetime:DateTime) => {
        setDateTimeInput(newDatetime)
        console.log(dateTimeInput?.toISOString())
    }

    const handleOnFileUploadCSV = (event:FormEvent<HTMLInputElement>) => {
        const currentTarget = event.currentTarget
        if(currentTarget?.files && currentTarget.files.length > 0){
            setFileCSV(currentTarget.files[0])
        }
    }

    const handleButtonFileUpload = () => {
        const ele = document.getElementById("selectedFile")
        if(ele != null) ele.click()
    }

    const handleOnClickAddData = () => {
        if (context.actualStep != undefined && context.actualStep < Steps.step_3) context.setActualStep(Steps.step_3)

        console.log("addDATA")
        switch(mode.value) {
            case ImportDataEnum.EXCEL:
                importDataFromCSV()
                break
            case ImportDataEnum.DATETIME_VARIABLE_GRAFANA:
                if(selectedGrafanaVariable){
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
        let newDisabled:boolean = true
        let newDisabledButton:boolean = true

        if(context.actualStep) {
            newDisabled = context.actualStep !== Steps.step_2 && context.actualStep !== Steps.step_3
            if(!newDisabled) newDisabledButton = !((mode.value == ImportDataEnum.EXCEL && fileCSV != undefined) || (dateTimeInput != undefined))
        }
        setDisabled(newDisabled)
        setDisabledButton(newDisabledButton)
    }, [context.actualStep, fileCSV, dateTimeInput, mode])
    
    useEffect(() => {
        disabledByJS(disabled, idDateTimeSet, document)
    }, [disabled, mode])

    useEffect(() => {
        console.log('dateTimeFormat', dateTimeInput?.utc().format('YYYY-MM-DDTHH:mm:ss'))
    }, [dateTimeInput])
    
    useEffect(() => {
        console.log("LLEGAN DATA")
        if(hasToSaveNewData !== undefined && hasToSaveNewData === dateTimeInput && model != undefined && (data.state == LoadingState.Done || data.state == LoadingState.Error)){
            console.log("data", data)
            addCollection({
                id: "DateTime: " + dateTimeLocalToString(dateTimeInput) + " (" + (collections.length+1) + ")",
                name : "Data " + (collections.length+1) + " (DateTime)",
                dateTime : dateTimeInput,
                interval: IntervalDefault,
                data : getArrayOfData(data, model.queryId)
            })
            setHasToSaveNewData(undefined)
        }
    }, [data])

    useEffect(() => {
    }, [collections])
    
    
    const ImportExcel = <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }} >
        <input type="file" id="selectedFile" hidden style={{display: 'none'}} onChange={handleOnFileUploadCSV} />
        <Button icon='upload' fullWidth disabled={disabled} onClick={handleButtonFileUpload}>{context.messages._panel._step2.uploadFile}</Button>
        <div className='wrap-elipsis' style={{ marginLeft: '10px' }}>{(fileCSV == undefined) ? context.messages._panel._step2.noFile : fileCSV.name}</div>
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
        if(mode && mode.value) {
            switch(mode.value) {
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

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel.step} 2</p>
        <h4>{context.messages._panel._step2.importData}</h4>
        <VerticalGroup justify='center'>
            <Select
                options={ImportDataOptions(context.messages)}
                value={mode}
                onChange={(v) => setMode(v)}
                disabled={disabled}
            />
            {importConfiguration()}
            <Button fullWidth disabled={disabledButton} onClick={handleOnClickAddData}>{context.messages._panel._step2.addData}</Button>
        </VerticalGroup>
    </div>
}