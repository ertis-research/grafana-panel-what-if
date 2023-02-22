import { Button, FileUpload, Input, Select, useTheme2, VerticalGroup } from '@grafana/ui'
import React, { ChangeEvent, FormEvent, useContext, useEffect, useState } from 'react'
import { Context } from 'utils/utils'
import { IData, IFile, IModel } from 'utils/types'
import { SelectableValue } from '@grafana/data'
import Papa from 'papaparse'
import { ImportDataEnum, ImportDataOptions, Steps } from 'utils/constants'

interface Props {
    model ?: IModel,
    setModel ?: any,
    files ?: IFile[],
    addFile ?: any
}

export const ImportData: React.FC<Props> = ({ model, setModel, files, addFile }) => {

    const theme = useTheme2()
    const context = useContext(Context)

    const [dateTime, setDateTime] = useState<string>()
    const [value, setValue] = useState<SelectableValue<number>>(ImportDataOptions[0])
    const [fileCSV, setFileCSV] = useState<File>()
    const [disabled, setDisabled] = useState(true)
    const [disabledButton, setDisabledButton] = useState(true)

    const handleOnChangeDateTime = (event:ChangeEvent<HTMLInputElement>) => {
        setDateTime(event.target.value)
        console.log(event.target.value)
    }

    const handleOnFileUploadCSV = (event:FormEvent<HTMLInputElement>) => {
        const currentTarget = event.currentTarget
        if(currentTarget?.files && currentTarget.files.length > 0){
            setFileCSV(currentTarget.files[0])
        }
    }

    const handleOnClickAddData = () => {
        if (context.setActualStep && context.setActualStep < Steps.step_3) context.setActualStep(Steps.step_3)

        console.log("addDATA")
        switch(value.value) {
            case ImportDataEnum.EXCEL:
                console.log("EXCEL")
                if(fileCSV){
                    Papa.parse(fileCSV, {
                        header: false,
                        skipEmptyLines: true,
                        complete: function (results) {
                            console.log(results.data)
                            const fileData:IData[] = results.data.map((d:any) => {
                                return {
                                    id: d[0],
                                    default_value: d[1]
                                }
                            })
                            console.log(fileData)
                            addFile({
                                id: "aaa",
                                data: fileData
                            })
                        }
                    });
                    console.log("DATOS DE CSV")
                }
        }
    }

    useEffect(() => {
        var newDisabled:boolean = true
        var newDisabledButton:boolean = true

        if(context.actualStep) {
            newDisabled = context.actualStep < Steps.step_2
            if(!newDisabled) newDisabledButton = !((value.value == ImportDataEnum.EXCEL && fileCSV != undefined) || (dateTime != undefined && dateTime != ''))
        }
        setDisabled(newDisabled)
        setDisabledButton(newDisabledButton)
    }, [context.actualStep, fileCSV, dateTime, value])
    
    
    const ImportExcel = <div>
        <FileUpload
            showFileName
            onFileUpload={handleOnFileUploadCSV}
            accept='.csv'
        />
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
                    return <Input value={dateTime} type='datetime-local' onChange={handleOnChangeDateTime}/>
                
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
                defaultValue={ImportDataOptions[0]}
                disabled={disabled}
            />
            {importConfiguration()}
            <Button fullWidth disabled={disabledButton} onClick={handleOnClickAddData}>Añadir datos</Button>
        </VerticalGroup>
    </div>
}