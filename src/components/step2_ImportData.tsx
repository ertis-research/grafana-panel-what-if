import { Button, FileUpload, Input, Select, useTheme2, VerticalGroup } from '@grafana/ui'
import React, { ChangeEvent, FormEvent, useContext, useEffect, useState } from 'react'
import { Context, dateTimeToString, disabledByJS, saveVariableValue } from 'utils/utils'
import { IData, IDataCollection, IModel } from 'utils/types'
import { DateTime, dateTime, SelectableValue } from '@grafana/data'
import Papa from 'papaparse'
import { DefaultImportData, ImportDataEnum, ImportDataOptions, Steps } from 'utils/constants'
import { IntervalDefault } from 'utils/default'
import { locationService } from '@grafana/runtime'

interface Props {
    model ?: IModel,
    setModel ?: any,
    collections ?: IDataCollection[],
    addCollection ?: any
}

export const ImportData: React.FC<Props> = ({ model, setModel, collections, addCollection }) => {

    const theme = useTheme2()
    const context = useContext(Context)

    const [dateTimeInput, setDateTimeInput] = useState<DateTime>()
    const [value, setValue] = useState<SelectableValue<number>>(DefaultImportData)
    const [fileCSV, setFileCSV] = useState<File>()
    const [disabled, setDisabled] = useState(true)
    const [disabledButton, setDisabledButton] = useState(true)

    const importDataFromDateTime = () => {
        if(dateTimeInput != undefined) { 
            saveVariableValue(locationService, context.options.varTime, dateTimeToString(dateTimeInput)) 
        }
    }

    const importDataFromCSV = () => {
        console.log("EXCEL")
        if(fileCSV && model != undefined){
            Papa.parse(fileCSV, {
                header: false,
                skipEmptyLines: true,
                complete: function (results) {
                    console.log(results.data)
                    const fileData:IData[] = []
                    results.data.forEach((d:any) => {
                        if(model.tags.some((t) => t.id == d[0])){
                            fileData.push({
                                id: d[0],
                                default_value: d[1]
                            })
                        }
                    })
                    console.log(fileData)
                    addCollection({
                        id: "csv_" + fileCSV.name + "_" + Math.random(),
                        name : "CSV: " + fileCSV.name,
                        data: fileData,
                        interval: IntervalDefault
                    })
                }
            })
        }
    }

    const handleOnChangeDateTime = (event:ChangeEvent<HTMLInputElement>) => {
        setDateTimeInput(dateTime(event.target.value))
        console.log(dateTimeInput?.toISOString())
    }

    const handleOnFileUploadCSV = (event:FormEvent<HTMLInputElement>) => {
        const currentTarget = event.currentTarget
        if(currentTarget?.files && currentTarget.files.length > 0){
            setFileCSV(currentTarget.files[0])
        }
    }

    const handleOnClickAddData = () => {
        if (context.actualStep != undefined && context.actualStep < Steps.step_3) context.setActualStep(Steps.step_3)

        console.log("addDATA")
        switch(value.value) {
            case ImportDataEnum.EXCEL:
                importDataFromCSV()
                break
            default: // Datetime
                importDataFromDateTime()
                break
        }
    }

    useEffect(() => {
        var newDisabled:boolean = true
        var newDisabledButton:boolean = true

        if(context.actualStep) {
            newDisabled = context.actualStep < Steps.step_2
            if(!newDisabled) newDisabledButton = !((value.value == ImportDataEnum.EXCEL && fileCSV != undefined) || (dateTimeInput != undefined))
        }
        setDisabled(newDisabled)
        setDisabledButton(newDisabledButton)
    }, [context.actualStep, fileCSV, dateTimeInput, value])
    
    useEffect(() => {
        disabledByJS(document, 'fileUpload', disabled)
    }, [disabled])

    useEffect(() => {
      console.log('dateTimeFormat', dateTimeInput?.utc().format('YYYY-MM-DDTHH:mm:ss'))
    }, [dateTimeInput])
    
    
    const ImportExcel = <div>
        <FileUpload
            showFileName
            onFileUpload={handleOnFileUploadCSV}
            accept='.csv'
        />
    </div>

    const ImportDatetimeSet = <div>
        <Input value={dateTimeInput?.format('YYYY-MM-DDTHH:mm:ss')} type='datetime-local' disabled={disabled} onChange={handleOnChangeDateTime}/>
    </div>

    const ImportDatetimeVarGrafana = <div>
        <p>AAA</p>
    </div>

    const importConfiguration = () => {
        console.log(value)
        if(value && value.value) {
            switch(value.value) {
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
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>Step 2</p>
        <h4>Import data</h4>
        <VerticalGroup justify='center'>
            <Select
                options={ImportDataOptions}
                value={value}
                onChange={(v) => setValue(v)}
                disabled={disabled}
            />
            {importConfiguration()}
            <Button fullWidth disabled={disabledButton} onClick={handleOnClickAddData}>Añadir datos</Button>
        </VerticalGroup>
    </div>
}