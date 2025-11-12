import { Button, DatePickerWithInput, InlineLabel, Select, TimeOfDayPicker, useTheme2, VerticalGroup } from '@grafana/ui'
import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { Context, dateTimeLocalToString, dateTimeToString, dateTimeToTimestamp, dateToString, disabledByJS, futureDate } from 'utils/utils'
import { IData, IDataCollection, IInterval, IModel } from 'utils/types'
import { getArrayOfData, getExtraInfo, saveVariableValue } from 'utils/datasources/grafana'
import { AppEvents, DataQueryError, dateTime, DateTime, EventBus, LoadingState, PanelData, SelectableValue } from '@grafana/data'
import Papa, { ParseError } from 'papaparse'
import { DefaultImportData, ImportDataEnum, ImportDataOptions, Steps, VariablesGrafanaOptions } from 'utils/constants'
import { IntervalDefault, ModelDefault } from 'utils/default'
import { getAppEvents, locationService } from '@grafana/runtime'
import { CSVtoData, getDateTimeCSV, getIntervalCSV } from 'utils/datasources/csv'
import log from 'utils/logger'

interface Props {
    model?: IModel,
    collections: IDataCollection[],
    addCollection: (newCollection: IDataCollection) => void,
    data: PanelData,
    eventBus: EventBus
}

export const ImportData: React.FC<Props> = ({ model, collections, addCollection, data }) => {

    const theme = useTheme2()
    const context = useContext(Context)

    const fieldTag = (model !== undefined) ? model.columnTag : ModelDefault.columnTag
    const fieldValueExtraInfo = (model !== undefined) ? model.columnValueExtraInfo : ModelDefault.columnValueExtraInfo
    const fieldNameInfo = (model !== undefined) ? model.columnNameExtraInfo : ModelDefault.columnNameExtraInfo

    //const idFileUpload = "fileUpload"
    const idDateTimeSet = "dateTimeSet"

    const [dateTimeInput, setDateTimeInput] = useState<DateTime>(dateTime())
    const [dateTimeInputStart, setDateTimeInputStart] = useState<DateTime>(dateTime().subtract(1, 'hour'))
    const [mode, setMode] = useState<SelectableValue<number>>(DefaultImportData(context.messages))
    const [selectedGrafanaVariable, setSelectedGrafanaVariable] = useState<SelectableValue<DateTime>>()
    const [fileCSV, setFileCSV] = useState<File>()
    const [disabled, setDisabled] = useState(true)
    const [disabledButton, setDisabledButton] = useState(true)
    const [hasToSaveNewData, setHasToSaveNewData] = useState<DateTime | undefined>(undefined)

    const hasRange = model !== undefined && model.varTimeStart !== undefined && model.queryRangeId !== undefined

    const addCollectionWithName = (key: string, name: string, from: string, data: IData[], dTime?: DateTime, int?: IInterval, extraInfo?: any, dTimeStart?: DateTime) => {
        log.info(`[Import data] Adding new data collection from source: ${from}`);

        let rep = collections.filter((col: IDataCollection) => col.id.includes(key)).length
        let id = from + ":" + key + ((rep !== 0) ? "_" + rep : "")
        log.debug(`[Import data] Initial ID generated: ${id} (duplicates found: ${rep})`);

        while (collections.some((col: IDataCollection) => col.id === id)) {
            rep = rep + + 1
            id = from + ":" + key + ((rep !== 0) ? "_" + rep : "")
            log.warn(`[Import data] Duplicate ID detected, generating new one: ${id}`);
        }
        addCollection({
            id: id,
            name: "Data from " + from + ": " + name + ((rep !== 0) ? " (" + rep + ")" : ""),
            dateTime: dTime,
            dateTimeStart: dTimeStart,
            interval: (int !== undefined) ? int : IntervalDefault,
            data: data,
            extraInfo: extraInfo
        })

        log.info(`[Import data] Collection added successfully: ${id}`);

        const appEvents = getAppEvents();
        appEvents.publish({
            type: AppEvents.alertSuccess.name,
            payload: [context.messages._panel._step2.alertCollectionAdded]
        })
        if (context.actualStep !== undefined && context.actualStep < Steps.step_3) {
            log.debug("[Import data] Advancing to step 3.");
            context.setActualStep(Steps.step_3)
        }
    }

    // Para imitar el bug: añadir varias veces data del mismo tiempo, eliminarlos todos y añadir otro
    const importDataFromDateTime = (dt?: DateTime) => {
        log.info("[Import data] Importing data from a single DateTime value.");
        log.debug("[Import data] Provided DateTime:", dt?.toISOString());

        if (dt !== undefined && model !== undefined) {
            setHasToSaveNewData(dt)
            let dateStr = (model.onlyDate) ? dateToString(dt.toDate()) : dateTimeToString(dt)
            saveVariableValue(locationService, model.varTime, dateStr)
        }
    }

    const importDataFromDateTimeRange = (start: DateTime, stop: DateTime) => {
        log.info("[Import data] Importing data from a DateTime range.");
        log.debug("[Import data] Range start:", start?.toISOString(), "Range stop:", stop?.toISOString());

        if (model !== undefined && model.varTimeStart !== undefined) {
            const startStr = (model.onlyDateRange) ? dateToString(start.toDate()) : dateTimeToString(start)
            const stopStr = (model.onlyDateRange) ? dateToString(stop.toDate()) : dateTimeToString(stop)

            saveVariableValue(locationService, model.varTimeStart, startStr)
            setHasToSaveNewData(stop)
            saveVariableValue(locationService, model.varTime, stopStr)
            log.info(`[Import data] Variables updated for range: start='${startStr}', stop='${stopStr}'`);
        } else {
            log.warn("[Import data] Skipping range import — model or varTimeStart is undefined.");
        }
    }

    const importDataFromCSV = () => {
        log.info("[Import data] Importing data from CSV file.");
        if (fileCSV && model !== undefined) {
            log.debug("[Import data] Parsing CSV:", { fileName: fileCSV.name, size: fileCSV.size });
            Papa.parse(fileCSV, {
                header: false,
                skipEmptyLines: 'greedy',
                complete: function (results) {
                    const d = results.data as string[][]
                    results.errors.forEach((e: ParseError) => {
                        log.error("[Import data] CSV parsing error:", e);
                        const appEvents = getAppEvents();
                        appEvents.publish({
                            type: AppEvents.alertError.name,
                            payload: [e.type + ": " + e.code, e.message + ((e.row !== undefined) ? " (Row: " + e.row + ")" : "")]
                        })
                    })
                    const dt = getDateTimeCSV(d)
                    const data = CSVtoData(d, model)
                    const name = fileCSV.name + ((dt !== undefined) ? " (" + dateTimeLocalToString(dt) + ")" : "")
                    log.debug("[Import data] Data conversion complete:", { extractedRows: data.length, timestampDetected: dt?.toISOString() });

                    if (data.length > 0) {
                        addCollectionWithName(fileCSV.name, name, "CSV", data, dt, getIntervalCSV(d))
                        setFileCSV(fileCSV)
                    } else {
                        log.warn("[Import data] No valid data rows found in CSV.");
                        const appEvents = getAppEvents();
                        appEvents.publish({
                            type: AppEvents.alertError.name,
                            payload: [context.messages._panel._step2.alertCSVnoData]
                        })
                    }

                }
            })
        } else {
            log.warn("[Import data] No CSV file or model provided. Skipping import.");
        }
    }

    const handleOnChangeDate = (newDate: string | Date, current: DateTime, set: any) => {
        let newDateTime: Date = new Date(newDate)
        //console.log(newDateTime)
        //console.log(newDate)
        if (current.hour !== undefined) newDateTime.setHours(current.hour())
        if (current.minute !== undefined) newDateTime.setMinutes(current.minute())
        set(dateTime(newDateTime))
        log.info("[Import data] Date updated successfully.", {
            current: current?.toISOString()
        });
    }

    const handleOnChangeTime = (newTime: DateTime, current: DateTime, set: any) => {
        let date: Date = newTime.toDate()
        let newDateTime = current.toDate()
        newDateTime.setHours(date.getHours())
        newDateTime.setMinutes(date.getMinutes())
        set(dateTime(newDateTime))
        log.info("[Import data] Time updated successfully.", {
            current: current?.toISOString()
        });
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
        switch (mode.value) {
            case ImportDataEnum.EXCEL:
                importDataFromCSV()
                break
            case ImportDataEnum.DATETIME_VARIABLE_GRAFANA:
                if (selectedGrafanaVariable) {
                    importDataFromDateTime(selectedGrafanaVariable.value)
                    break
                }
            case ImportDataEnum.DATETIME_RANGE:
                importDataFromDateTimeRange(dateTimeInputStart, dateTimeInput)
                break
            default: // Datetime
                importDataFromDateTime(dateTimeInput)
                break
        }
    }

    useEffect(() => {
    }, [context.messages])


    useEffect(() => {
        let newDisabled = true
        let newDisabledButton = true

        if (context.actualStep) {
            newDisabled = context.actualStep !== Steps.step_2 && context.actualStep !== Steps.step_3
            if (!newDisabled) newDisabledButton = !(
                (mode.value === ImportDataEnum.EXCEL && fileCSV !== undefined) ||
                (mode.value === ImportDataEnum.DATETIME_VARIABLE_GRAFANA && selectedGrafanaVariable && selectedGrafanaVariable.value !== undefined) ||
                (mode.value === ImportDataEnum.DATETIME_RANGE && dateTimeInput !== undefined && dateTimeInputStart !== undefined && dateTimeInputStart.isBefore(dateTimeInput)) && !dateTimeInputStart.isSame(dateTimeInput) ||
                (mode.value === ImportDataEnum.DATETIME_SET && dateTimeInput !== undefined))
        }
        setDisabled(newDisabled)
        setDisabledButton(newDisabledButton)
    }, [context.actualStep, fileCSV, dateTimeInput, dateTimeInputStart, mode, selectedGrafanaVariable])

    useEffect(() => {
        disabledByJS(disabled, idDateTimeSet, document)
    }, [disabled, mode])

    useEffect(() => {
        if (dateTimeInput) {
            log.debug("[Import data] dateTimeInput changed.", {
                formatted: dateTimeInput.utc().format("YYYY-MM-DDTHH:mm:ss"),
                raw: dateTimeInput?.toISOString(),
            });
        } else {
            log.warn("[Import data] dateTimeInput is undefined or null.");
        }
    }, [dateTimeInput])

    /*
    useEffect(() => {
        handleOnChangeDateTime(dateTime())
    }, [])*/

    useEffect(() => {
        log.info("[Import data] Data received, checking conditions to save new data");
        log.debug("[Import data] Condition check values:", {
            hasToSaveNewData: hasToSaveNewData,
            dateTimeInput: dateTimeInput,
            selectedGrafanaVariableValue: selectedGrafanaVariable?.value,
            modelDefined: model !== undefined,
            dataState: data.state
        });

        if (hasToSaveNewData !== undefined
            && (hasToSaveNewData === dateTimeInput || (selectedGrafanaVariable && hasToSaveNewData === selectedGrafanaVariable.value))
            && model !== undefined
            && (data.state === LoadingState.Done || data.state === LoadingState.Error)) {

            log.debug("[Import data] All conditions met. Proceeding with data state check.");

            if (data.state === LoadingState.Done) {
                log.info("[Import data] Data state is 'Done'. Proceeding with data extraction.");
                log.debug("[Import data] Full data object received:", data);

                let extraInfo = undefined
                let arrayData: IData[] = []
                let name = ((model.onlyDate && mode.value === ImportDataEnum.DATETIME_SET)
                    || (model.onlyDateRange && mode.value === ImportDataEnum.DATETIME_RANGE)) ? dateToString(hasToSaveNewData.toDate()) : dateTimeLocalToString(hasToSaveNewData)
                let text = "DateTime"
                let key = dateTimeToTimestamp(hasToSaveNewData).toString()
                let dtStart: DateTime | undefined = undefined

                if (mode.value === ImportDataEnum.DATETIME_RANGE && model.queryRangeId) {
                    log.debug("[Import data] Processing as DATETIME_RANGE.");
                    arrayData = getArrayOfData(data, model.queryRangeId, fieldTag, model.isListValues, model.numberOfValues)
                    name = ((model.onlyDateRange) ? dateToString(dateTimeInputStart.toDate()) : dateTimeLocalToString(dateTimeInputStart)) + " to " + name
                    text = text + " range"
                    dtStart = dateTimeInputStart
                    key = dateTimeToTimestamp(dateTimeInputStart).toString() + "+" + key
                } else {
                    log.debug("[Import data] Processing as single DATETIME_SET.");
                    arrayData = getArrayOfData(data, model.queryId, fieldTag, model.isListValues, model.numberOfValues)
                }

                if (model && model.extraInfo !== undefined) {
                    log.debug("[Import data] Extracting extra info.");
                    extraInfo = getExtraInfo(data, model.extraInfo, fieldNameInfo, fieldValueExtraInfo)
                }

                if (arrayData.length > 0) {
                    log.info(`[Import data] Successfully extracted ${arrayData.length} data points. Adding to collection with key: ${key}`);
                    addCollectionWithName(key, name, text, arrayData, hasToSaveNewData, IntervalDefault, extraInfo, dtStart)
                } else {
                    log.warn("[Import data] Data state was 'Done' but no data points were extracted. Publishing 'no data' alert.");
                    const appEvents = getAppEvents();
                    appEvents.publish({
                        type: AppEvents.alertError.name,
                        payload: [context.messages._panel._step2.alertDateTimenoData]
                    })
                }
            } else {
                log.error("[Import data] Data state is 'Error'. Publishing error alert.");
                const appEvents = getAppEvents();
                const msgsError = data.errors?.map((v: DataQueryError) => v.message)

                log.error("[Import data] Error messages from query:", msgsError);
                log.debug("[Import data] Full error data object:", data); // Debug for full context

                appEvents.publish({
                    type: AppEvents.alertError.name,
                    payload: msgsError
                })
            }

            log.info("[Import data] Processing complete. Resetting 'hasToSaveNewData' flag.");
            saveVariableValue(locationService, model.varTime, futureDate())
            setHasToSaveNewData(undefined)
        } else {
            log.debug("[Import data] Conditions not met. Skipping data processing.");
        }
    }, [data])

    useEffect(() => {
    }, [collections])

    useEffect(() => {
        if (model !== undefined) {
            saveVariableValue(locationService, model.varTime, futureDate())
        }
    }, [])


    // HTML
    // -------------------------------------------------------------------------------------------------------------

    const ImportExcel = <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }} >
        <input type="file" accept='.csv, text/csv' id="selectedFile" hidden style={{ display: 'none' }} onChange={handleOnFileUploadCSV} />
        <Button icon='upload' fullWidth disabled={disabled} onClick={handleButtonFileUpload}>{context.messages._panel._step2.uploadFile}</Button>
        <div className='wrap-elipsis' title={(fileCSV) ? fileCSV.name : undefined} style={{ marginLeft: '10px' }}>{(fileCSV === undefined) ? context.messages._panel._step2.noFile : fileCSV.name}</div>
    </div>

    const ImportDatetimeSet = <div style={{ width: '100%' }}>
        <DatePickerWithInput
            onChange={(d) => handleOnChangeDate(d, dateTimeInput, setDateTimeInput)}
            value={dateTimeInput?.toDate()}
            maxDate={new Date()}
            disabled={disabled}
            className='fullWidth'
            closeOnSelect
        />
        <div className='timePicker fullWidth' style={{ marginTop: '8px' }} hidden={model?.onlyDate || disabled}>
            <TimeOfDayPicker
                onChange={(d) => handleOnChangeTime(d, dateTimeInput, setDateTimeInput)}
                showSeconds={false}
                value={dateTimeInput.local()}
                size='auto'
                disabled={disabled}
            />
        </div>
    </div>

    const ImportDatetimeRange = <div style={{ width: '100%', display: 'flex' }}>
        <div style={{ width: '50%' }}>
            <InlineLabel transparent style={{ justifyContent: 'center' }}>{context.messages._panel._step2.startRange}</InlineLabel>
            <DatePickerWithInput onChange={(d) => handleOnChangeDate(d, dateTimeInputStart, setDateTimeInputStart)} value={dateTimeInputStart?.toDate()} maxDate={new Date()} disabled={disabled} className='fullWidth' closeOnSelect />
            <div className='timePicker fullWidth' style={{ marginTop: '8px' }} hidden={model?.onlyDateRange || disabled}>
                <TimeOfDayPicker onChange={(d) => handleOnChangeTime(d, dateTimeInputStart, setDateTimeInputStart)} showSeconds={false} value={dateTimeInputStart.local()} size='auto' disabled={disabled} />
            </div>
        </div>
        <div style={{ width: '50%' }}>
            <InlineLabel transparent style={{ justifyContent: 'center' }}>{context.messages._panel._step2.stopRange}</InlineLabel>
            <DatePickerWithInput onChange={(d) => handleOnChangeDate(d, dateTimeInput, setDateTimeInput)} value={dateTimeInput?.toDate()} maxDate={new Date()} disabled={disabled} className='fullWidth' closeOnSelect />
            <div className='timePicker fullWidth' style={{ marginTop: '8px' }} hidden={model?.onlyDateRange || disabled}>
                <TimeOfDayPicker onChange={(d) => handleOnChangeTime(d, dateTimeInput, setDateTimeInput)} showSeconds={false} value={dateTimeInput.local()} size='auto' disabled={disabled} />
            </div>
        </div>
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

                case ImportDataEnum.DATETIME_RANGE:
                    return ImportDatetimeRange

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
                options={ImportDataOptions(context.messages, hasRange)}
                value={mode}
                onChange={(v) => setMode(v)}
                disabled={disabled}
            />
            {importConfiguration()}
            <Button fullWidth disabled={disabledButton || hasToSaveNewData !== undefined} icon={(hasToSaveNewData !== undefined) ? 'fa fa-spinner' : undefined} onClick={handleOnClickAddData}>{context.messages._panel._step2.addData}</Button>
        </VerticalGroup>
    </div>
}
