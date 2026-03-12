import { Button, DatePickerWithInput, HorizontalGroup, IconButton, InlineLabel, Input, Modal, Pagination, useTheme2, VerticalGroup } from '@grafana/ui'
import React, { Fragment, useContext, useEffect, useRef, useState } from 'react'
import { Context, dateTimeLocalToString, getMean, round, groupBy, dateToString, stringToDate } from 'utils/utils'
import { IData, IDataCollection, IModel, IntervalTypeEnum, IResult, ITag, IDynamicField, TypeDynamicField, IExtraCalc } from 'utils/types'
import { idDefault, idNew, Steps } from 'utils/constants'
import { predictCollection } from 'utils/datasources/predictions'
import Plot from 'react-plotly.js'
import { Config, Icons, Layout, ModeBarButtonAny, PlotlyHTMLElement, toImage } from 'plotly.js'
import { getAppEvents } from '@grafana/runtime'
import { AppEvents, isDateTime, PanelData } from '@grafana/data'
import { extraCalcCollection } from 'utils/datasources/extraCalc'
import log from 'utils/logger'

interface Props {
    model?: IModel,
    collections: IDataCollection[],
    updateCollections: any,
    currentCollIdx?: number,
    data: PanelData
}

enum StatePredict {
    EMPTY,
    LOADING,
    DONE
}

export const PredictModel: React.FC<Props> = ({ model, collections, updateCollections, currentCollIdx, data }) => {

    const theme = useTheme2()
    const context = useContext(Context)
    const msgs = context.messages._panel._step4

    const [state, setState] = useState<StatePredict>(StatePredict.EMPTY)
    const [sizePlot, setSizePlot] = useState<{ width: number, height: number }>({ width: 0, height: 0 })
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isCollapseExtraInfo, setIsCollapseExtraInfo] = useState(false)
    const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string[]>>({})
    const [currentPage, setCurrentPage] = useState(1)

    const abortControllerRef = useRef<AbortController | null>(null);

    const disabled = (context.actualStep) ? (context.actualStep < Steps.step_3 || state === StatePredict.LOADING) : false
    const disabledModifyAgain = (context.actualStep) ? (context.actualStep < Steps.step_4 || state === StatePredict.LOADING) : false

    const validate = () => {
        log.debug("[Predict result] Running validation before prediction...");
        let msg = ""

        if (model && currentCollIdx !== undefined) {
            const col = collections[currentCollIdx]
            //collections.forEach((col: IDataCollection) => {
            let error_tags: string[] = col.data.filter((d: IData) => d.default_value === undefined && (d.new_value === undefined || d.new_value.trim() === "")).map((d: IData) => d.id)
            error_tags = error_tags.concat(model.tags.filter((t: ITag) => !col.data.some((d: IData) => d.id === t.id)).map((t: ITag) => t.id))
            if (error_tags.length > 0) {
                msg = msg + "Data missing in " + col.name + ": " + error_tags.join(", ") + "\n"
            }
            //})
        }

        if (msg === "") {
            log.info("[Predict result] Validation successful.");
            return true
        } else {
            log.warn("[Predict result] Validation failed with missing data:", msg);
            const appEvents = getAppEvents();
            appEvents.publish({
                type: AppEvents.alertError.name,
                payload: [msg]
            })
            return false
        }
    }

    const handleOnClickPredict = () => {
        log.info("[Predict result] Predict button clicked.");
        if (validate()) {
            if (model && currentCollIdx !== undefined) {
                if (abortControllerRef.current) abortControllerRef.current.abort();
                abortControllerRef.current = new AbortController();
                const signal = abortControllerRef.current.signal;

                log.info("[Predict result] Starting prediction for collections...");
                setState(StatePredict.LOADING)
                predictCollection(model, collections[currentCollIdx], signal).then((res: IDataCollection) => {
                    if (signal.aborted) {
                        setState(StatePredict.DONE)
                        return
                    }

                    log.info("[Predict result] Prediction completed successfully.");
                    log.debug("[Predict result] Updated collection:", res);
                    let aux = [...collections]
                    aux[currentCollIdx] = res
                    updateCollections(aux)
                    setCurrentPage(1)

                    if (context.setActualStep) {
                        context.setActualStep(Steps.step_5)
                        log.debug("[Predict result] Advanced to step 5.");
                    }
                }).catch((err) => {
                    if (err.name === 'AbortError') {
                        log.warn("[Predict result] Prediction process aborted by user.");
                    } else {
                        log.error("[Predict result] Prediction failed:", err);
                    }
                    setState(StatePredict.DONE)
                }).finally(() => {
                    if (abortControllerRef.current?.signal === signal) {
                        abortControllerRef.current = null;
                    }
                });
            }

        }
    }

    const handleOnClickExtraCalc = (extraCalc: IExtraCalc) => {
        log.info("[Predict result] Extra calculation button clicked.");

        if (validate()) {
            console.log("A")
            if (model && currentCollIdx !== undefined && currentCollIdx < collections.length) {
                console.log("A2")
                if (abortControllerRef.current) abortControllerRef.current.abort();
                abortControllerRef.current = new AbortController();
                const signal = abortControllerRef.current.signal;
                console.log("A3")
                setState(StatePredict.LOADING)
                let col: IDataCollection = { ...collections[currentCollIdx] }
                delete col.resultsExtraCalc
                delete col.conclusionExtraCalc
                extraCalcCollection(model, extraCalc, col, dynamicFieldValues[extraCalc.id], signal).then((res: IDataCollection) => {
                    if (signal.aborted) {
                        setState(StatePredict.DONE)
                        return
                    }
                    console.log("A4")
                    let aux = [...collections]
                    aux[currentCollIdx] = res
                    updateCollections(aux)
                    setCurrentPage(2)
                }).catch((err) => {
                    if (err.name === 'AbortError') {
                        log.info("[Predict result] Calculation was successfully aborted.");
                    } else {
                        log.error("[Predict result] Extra calculation failed:", err);
                    }
                    setState(StatePredict.DONE)
                }).finally(() => {
                    // Limpiamos la referencia al terminar (con éxito o error)
                    if (abortControllerRef.current?.signal === signal) {
                        abortControllerRef.current = null;
                    }
                });
            } else {
                log.warn("[Predict result] Skipped extra calculation — invalid collection index or missing model.");
            }
        }
    }

    const handleOnClickModifyAgain = () => {
        log.info("[Predict result] Modify again button clicked. Resetting results...");
        let newCollections: IDataCollection[] = []
        collections.forEach((col: IDataCollection) => {
            let newCol = { ...col }
            delete newCol.results
            delete newCol.resultsExtraCalc
            delete newCol.conclusionExtraCalc
            newCollections.push(newCol)
        })
        updateCollections(newCollections)
        setState(StatePredict.EMPTY)
        context.setActualStep(Steps.step_3)
        log.info("[Predict result] Returned to step 3 with clean results.");
    }

    const handleOnCancelCalculation = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort(); // ← primero abortar
            abortControllerRef.current = null;
            log.warn("[Predict result] User cancelled the calculation.");
            // setState al final, no bloquea el abort
            setState(StatePredict.DONE);
        }
    };

    const handleOnChangeDynField = (v: string | Date, idx: number, extraCalcId: string) => {
        const currentValues = dynamicFieldValues[extraCalcId] || [];
        let aux = [...currentValues]
        console.log(aux)
        aux[idx] = (v instanceof Date) ? dateToString(v) : v
        setDynamicFieldValues(prev => ({
            ...prev,
            [extraCalcId]: aux
        }))
    }

    const setDecimals = (value: any) => {
        if (!value || typeof value !== 'number' || !model || !model.decimals) return value
        return round(value, model.decimals)
    }

    useEffect(() => {
        if (state === StatePredict.LOADING) {
            log.info("[Predict result] Prediction processing complete. State → DONE");
            setState(StatePredict.DONE)
        }
    }, [collections])

    useEffect(() => {
        if (model) {
            const calcs = model.extraCalc ? (Array.isArray(model.extraCalc) ? model.extraCalc : [model.extraCalc]) : [];
            console.log("calcs", calcs)
            calcs.forEach((c: IExtraCalc) => {
                if (c.dynamicFieldList !== undefined) {
                    setDynamicFieldValues(prev => ({ ...prev, [c.id]: Array(c.dynamicFieldList?.length).fill(undefined) }))
                    log.debug("[Predict result] Initialized dynamic field values for extra calc " + c.name);
                }
            })
        }
    }, [model])


    useEffect(() => {
    }, [currentCollIdx])

    useEffect(() => {
    }, [state])

    useEffect(() => {
        const divResults = document.getElementById('id-results')
        const divResultsBase = document.getElementById('id-results-base')
        const divHeaders = document.getElementById('idResultsHeaders')
        const divPagination = document.getElementById('id-pagination')
        if (divResults && divHeaders && divResultsBase) {
            setSizePlot({
                height: context.height - divHeaders.offsetHeight - divResultsBase.offsetHeight - 41.5 - ((divPagination) ? (divPagination.offsetHeight + 9.5) : 0),//- 47,
                width: (divResults.offsetWidth < context.width) ? divResults.offsetWidth : context.width
            })
            //console.log('width', divResults.offsetWidth)
            //console.log('height', divHeaders.offsetHeight + divResultsBase.offsetHeight)
        }
    }, [context.width, context.height, state, currentCollIdx, isCollapseExtraInfo, currentPage])



    // HTML
    // -------------------------------------------------------------------------------------------------------------

    const showPlot = (results: IResult[], intervalType: IntervalTypeEnum) => {
        const filterResults = results.filter((r: IResult) => r.id !== idDefault && r.id !== idNew && r.correspondsWith !== undefined && r.result !== 'ERROR' && r.result !== undefined)
        if (filterResults.length < 1) return <div></div>

        const tagsGroup: { [tag: string]: IResult[] } = groupBy(filterResults, "tag")
        //console.log("tagGroup", tagsGroup)

        const dataArray: any[] = Object.entries(tagsGroup).map(([tag, resultsOfTag]) => {
            // No pongo la x global por si alguna falla que no se rompa toda la grafica
            let values_x: number[] = [], values_y: number[] = [], text: number[] = []
            resultsOfTag.forEach((r: IResult) => {
                if (r.result !== undefined && r.result !== 'ERROR'
                    && r.correspondsWith !== undefined && r.data[r.correspondsWith.tag] !== undefined && typeof r.result === 'number') {
                    values_x.push(r.correspondsWith.intervalValue)
                    values_y.push(r.result)
                    text.push(setDecimals(getMean(r.data[r.correspondsWith.tag])))
                }
            })

            values_y = values_y.map((v: number) => setDecimals(v))
            //console.log("text", text)
            return {
                x: values_x,
                y: values_y,
                text: text,
                type: 'scatter',
                name: tag
            }
        })

        //console.log('dataArrayPLOT', dataArray)

        const layoutObj: Partial<Layout> = {
            width: sizePlot.width,
            height: sizePlot.height,
            showlegend: true,
            legend: {
                orientation: 'h',
                font: {
                    color: theme.colors.text.primary
                }
            },
            margin: {
                t: 30,
                b: 80,
                l: 80,
                r: 50
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: {
                tickcolor: theme.colors.text.primary,
                zerolinecolor: theme.colors.text.primary,
                gridcolor: theme.colors.text.primary,
                color: theme.colors.text.primary,
                ticksuffix: (intervalType === IntervalTypeEnum.percentage) ? "%" : ""
            },
            yaxis: {
                tickcolor: theme.colors.text.primary,
                zerolinecolor: theme.colors.text.primary,
                gridcolor: theme.colors.text.primary,
                color: theme.colors.text.primary
            }
        }

        const newButton: ModeBarButtonAny = {
            title: 'Download plot as png',
            name: 'Download plot as png',
            icon: Icons.camera,
            click: async (gd: PlotlyHTMLElement) => {
                //console.log("AAA")
                await toImage(gd, {
                    width: 900,
                    height: 900,
                    format: 'png'
                }).then((img: string) => {
                    //let image = new Image()
                    //image.src = img
                    let w = window.open("")
                    if (w !== null) w.document.write('<iframe src="' + img + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');

                    //w.document.write(image.outerHTML)
                })
            }
        }

        const config: Partial<Config> = {
            //modeBarButtonsToAdd: [btnCapture],
            modeBarButtonsToRemove: ['toImage'],
            modeBarButtonsToAdd: [newButton]
        }

        return <Plot style={{ margin: '0px', padding: '0px' }} layout={layoutObj} data={dataArray} config={config} />
    }

    const defaultValue = (col: IDataCollection) => {
        let res = <div></div>
        if (col.results) {
            const def = col.results.find((r: IResult) => r.id === idDefault)
            if (def) res = <div className='horizontal-item-1' style={{ backgroundColor: theme.colors.background.secondary, padding: '10px', width: '50%', marginRight: '10px' }}>
                <p style={{ color: theme.colors.text.secondary, paddingBottom: '0px', marginBottom: '2px' }}>{msgs.originalValue}</p>
                <h1 style={{ textAlign: 'center' }}>{(typeof def.result === 'number') ? setDecimals(def.result) : 'ERROR'}</h1>
            </div>
        }
        return res
    }

    const newValue = (col: IDataCollection) => {
        let res = <div></div>
        if (col.results) {
            const nw = col.results.find((r: IResult) => r.id === idNew)
            if (nw) res = <div style={{ backgroundColor: theme.colors.background.secondary, padding: '10px', width: '50%' }}>
                <p style={{ color: theme.colors.text.secondary, paddingBottom: '0px', marginBottom: '2px' }}>{msgs.newValue}</p>
                <h1 style={{ textAlign: 'center' }}>{(typeof nw.result === 'number') ? setDecimals(nw.result) : 'ERROR'}</h1>
            </div>
        }
        return res
    }

    const processExtraInfo = (extraInfo: { [key: string]: any }) => {
        let res: JSX.Element[] = []
        Object.entries(extraInfo).map(([key, value]) => {
            if (isDateTime(value)) {
                value = dateTimeLocalToString(value)
            } else if (!isNaN(value) && model !== undefined && model.decimals) {
                value = round(value, model.decimals)
            }
            res.push(<div className='wrap-elipsis' title={key + ": " + value}>{key + ": " + value}</div>)
        })
        if (res.length < 3) {
            return res
        } else {
            return <div className='containerType' style={{ width: '100%' }}>
                <div className="row justify-content-between align-items-end">
                    <div className="col-12 col-sm-9">
                        {res.slice(0, 2)}
                        <Modal title={msgs.extraInfo} children={res} isOpen={isOpenModal} onDismiss={() => setIsOpenModal(false)} />
                    </div>
                    <div className="col-12 col-sm-3">
                        <Button variant='secondary' style={{ width: '100%', marginTop: '5px' }} fullWidth onClick={() => setIsOpenModal(!isOpenModal)}>{msgs.seeMore}</Button>
                    </div>
                </div>
            </div>
        }
    }

    const divExtraInfo = () => {
        if (currentCollIdx !== undefined && currentCollIdx < collections.length) {
            const col: IDataCollection = collections[currentCollIdx]
            if (col.extraInfo && Object.keys(col.extraInfo).length > 0) {
                return <div style={{ backgroundColor: theme.colors.background.secondary, padding: '10px', marginTop: '10px', width: '100%' }}>
                    <HorizontalGroup align='center'>
                        <IconButton aria-label='t' variant='secondary' name={(isCollapseExtraInfo) ? 'angle-right' : 'angle-down'} onClick={() => setIsCollapseExtraInfo(!isCollapseExtraInfo)} style={{ marginRight: '0px', paddingRight: '0px' }} />
                        <div style={{ color: theme.colors.text.secondary, marginLeft: '0px' }}>{msgs.extraInfo}</div>
                    </HorizontalGroup>
                    {(!isCollapseExtraInfo) ? <div style={{ marginTop: '2px' }}>{processExtraInfo(col.extraInfo)}</div> : <div></div>}
                </div>
            }
        }
        return <div></div>
    }

    const resultExtraCalc = (col: IDataCollection) => {
        if (col.conclusionExtraCalc !== undefined) {
            return <div className='horizontal-item-1' style={{ backgroundColor: theme.colors.background.secondary, padding: '10px', width: '100%' }}>
                <p style={{ color: theme.colors.text.secondary, paddingBottom: '0px', marginBottom: '2px' }}>{msgs.resultCalc}</p>
                {(col.conclusionExtraCalc.subtitle !== undefined && col.conclusionExtraCalc.subtitle.trim() !== '') ?
                    <div>
                        <h3 style={{ textAlign: 'center', marginBottom: '0px' }}>{col.conclusionExtraCalc.title}</h3>
                        <p style={{ textAlign: 'center', marginTop: '5px' }}>{col.conclusionExtraCalc.subtitle}</p>
                    </div>
                    : <h1 style={{ textAlign: 'center' }}>{col.conclusionExtraCalc.title}</h1>
                }
            </div>
        }
        return <div></div>
    }

    const getInputByType = (extraCalcId: string, fieldType: TypeDynamicField, idx: number) => {
        let val = (dynamicFieldValues[extraCalcId] !== undefined) ? dynamicFieldValues[extraCalcId][idx] : undefined
        switch (fieldType) {
            case TypeDynamicField.num:
                return <Input style={{ width: 'calc(100% - 15px)' }} disabled={disabled} value={(!val) ? '' : Number(val)} type='number' step="any" onChange={(e) => handleOnChangeDynField(e.currentTarget.value, idx, extraCalcId)} />
            case TypeDynamicField.date:
                return <div style={{ width: '100%' }}>
                    <DatePickerWithInput placeholder='' onChange={(d) => handleOnChangeDynField(d, idx, extraCalcId)} value={(val === undefined) ? val : stringToDate(val)} disabled={disabled} closeOnSelect />
                </div>
            default: // string
                return <Input style={{ width: 'calc(100% - 15px)' }} value={val} onChange={(e) => handleOnChangeDynField(e.currentTarget.value, idx, extraCalcId)} />
        }
    }

    const dynamicFields = (extraCalcId: string, fields: IDynamicField[]) => {
        return <div style={{ width: '50%', display: 'block', marginRight: '10px' }}>
            {fields.map((field: IDynamicField, idx: number) => {
                return <div style={{ display: 'flex', marginTop: '5px', marginBottom: '5px' }}>
                    <InlineLabel width={15} transparent>{field.name}</InlineLabel>
                    {getInputByType(extraCalcId, field.type, idx)}
                </div>
            }
            )}
        </div>

    }

    const divExtraCalcs = () => {
        if (model) {
            const calcs = model.extraCalc ? (Array.isArray(model.extraCalc) ? model.extraCalc : [model.extraCalc]) : [];
            return calcs.map((c: IExtraCalc) => divExtraCalc(c))
        }
        return <div></div>
    }

    const divExtraCalc = (extraCalc: IExtraCalc) => {
        //console.log("dyn", dynamicFieldValues)
        return <div style={{ marginTop: '10px', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            {(extraCalc.dynamicFieldList !== undefined) ? dynamicFields(extraCalc.id, extraCalc.dynamicFieldList) : <div></div>}
            <div style={{ width: (extraCalc.dynamicFieldList !== undefined) ? 'calc(50% - 10px)' : '100%', display: 'flex', justifyItems: 'center' }}>
                <Button fullWidth disabled={disabled || (dynamicFieldValues[extraCalc.id] !== undefined
                    && dynamicFieldValues[extraCalc.id].some((v) => v === undefined || v.trim() === ''))}
                    onClick={() => handleOnClickExtraCalc(extraCalc)}>{extraCalc.name}</Button>
            </div>
        </div>
    }

    const getButton = (currentCollIdx !== undefined && currentCollIdx < collections.length && collections[currentCollIdx].results) ?
        <Button fullWidth icon='repeat' variant='destructive' disabled={disabledModifyAgain} onClick={handleOnClickModifyAgain}>{msgs.modifyAgain}</Button>
        : <Button fullWidth disabled={disabled} onClick={handleOnClickPredict}>{msgs.predict}</Button>


    const extraCalcResult = (col: IDataCollection) => {
        if (col.resultsExtraCalc || col.conclusionExtraCalc) {
            return <div style={{ marginTop: '10px', width: '100%' }}>
                <div id="id-results-base" style={{ display: 'flex' }}>
                    {resultExtraCalc(col)}
                </div>
                <div id='id-results' style={{ width: '100%', backgroundColor: theme.colors.background.secondary, marginTop: '10px', padding: '0px' }}>
                    {(col.resultsExtraCalc) ? showPlot(col.resultsExtraCalc, IntervalTypeEnum.units) : <div></div>}
                </div>
            </div>
        } else {
            return <div></div>
        }
    }

    const predictResult = (col: IDataCollection) => {
        if (col.results) {
            return <div style={{ marginTop: '10px', width: '100%' }}>
                <div id="id-results-base" style={{ display: 'flex' }}>
                    {defaultValue(col)}
                    {newValue(col)}
                </div>
                <div id='id-results' style={{ width: '100%', backgroundColor: theme.colors.background.secondary, marginTop: '10px', padding: '0px' }}>
                    {(col.results) ? showPlot(col.results, col.interval.type) : <div></div>}
                </div>
            </div>
        } else {
            return <div></div>
        }
    }

    const showResults = () => {
        if (currentCollIdx !== undefined && currentCollIdx < collections.length) {
            const col: IDataCollection = collections[currentCollIdx]
            if (col.results && col.resultsExtraCalc) {
                return <div style={{ width: '100%', display: 'block' }}>
                    <div className='paginationBlock' id='id-pagination'>
                        <Pagination currentPage={currentPage} numberOfPages={2} onNavigate={(num: number) => setCurrentPage(num)} />
                    </div>
                    {(currentPage === 1) ? predictResult(col) : extraCalcResult(col)}
                </div>
            } else if (col.results) {
                return predictResult(col)
            } else if (col.resultsExtraCalc) {
                return extraCalcResult(col)
            }
        }
        return <div></div>
    }

    const viewResults = () => {
        switch (state) {
            case StatePredict.LOADING:
                return (
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                        <Button
                            variant='destructive'
                            fill='outline'
                            icon='fa fa-spinner'
                            onPointerDown={(e) => {  // ← onPointerDown en vez de onClick
                                e.preventDefault();
                                e.stopPropagation();
                                handleOnCancelCalculation();
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                )
            case StatePredict.DONE:
                return showResults()
            case StatePredict.EMPTY:
                return <div></div>
        }
    }

    return <Fragment>
        <div id="idResultsHeaders">
            <div style={{ backgroundColor: theme.colors.background.secondary, padding: '10px' }}>
                <p style={{ color: theme.colors.text.secondary, paddingBottom: '0px', marginBottom: '2px' }}>{context.messages._panel.step} 4</p>
                <h4>{msgs.predictResult}</h4>
                <VerticalGroup justify='center'>
                    {getButton}
                </VerticalGroup>
                {divExtraCalcs()}
            </div>
            {divExtraInfo()}
        </div>
        {viewResults()}
    </Fragment>
}
