import { Button, Spinner, useTheme2, VerticalGroup } from '@grafana/ui'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { Context, round } from 'utils/utils'
import { IData, IDataCollection, IModel, IntervalTypeEnum, IResult, ITag } from 'utils/types'
import { idDefault, idNew, Steps } from 'utils/constants'
import { predictAllCollections } from 'utils/predictions'
import Plot from 'react-plotly.js'
import { groupBy } from 'utils/utils'
import { Config, Icons, Layout, ModeBarButtonAny, PlotlyHTMLElement, toImage } from 'plotly.js'
import { getAppEvents } from '@grafana/runtime'
import { AppEvents } from '@grafana/data'

interface Props {
    model ?: IModel,
    collections : IDataCollection[],
    updateCollections : any,
    currentCollIdx ?: number
}

enum StatePredict {
    EMPTY,
    LOADING,
    DONE
}

export const PredictModel: React.FC<Props> = ({model, collections, updateCollections, currentCollIdx}) => {

    const theme = useTheme2()
    const context = useContext(Context)

    const [state, setState] = useState<StatePredict>(StatePredict.EMPTY)
    const [sizePlot, setSizePlot] = useState<{width: number, height: number}>({width: 0, height: 0})

    const disabled = (context.actualStep) ? context.actualStep < Steps.step_3 : false
    const disabledModifyAgain = (context.actualStep) ? context.actualStep < Steps.step_4 : false

    const validate = () => {
        let msg:string = ""
        if(model){
            collections.forEach((col:IDataCollection) => {
                let error_tags:string[] = col.data.filter((d:IData) => d.default_value == undefined && (d.new_value == undefined || d.new_value.trim() == "")).map((d:IData) => d.id)
                error_tags = error_tags.concat(model.tags.filter((t:ITag) => !col.data.some((d:IData) => d.id == t.id)).map((t:ITag) => t.id))
                if (error_tags.length > 0) {
                    msg = msg + "Data missing in " + col.name + ": " + error_tags.join(", ") + "\n"
                }
            })
        }
        
        if (msg == "") {
            return true
        } else {
            const appEvents = getAppEvents();
            appEvents.publish({
                type: AppEvents.alertError.name,
                payload: [msg]
            })
            return false
        }
    }

    const onClickPredictHandle = () => {
        if(validate()){
            console.log("COLLECTIONS PREDICT", collections) 
            if(model) {
                setState(StatePredict.LOADING)
                predictAllCollections(model, collections).then((res:IDataCollection[]) => {
                    updateCollections(res)
                })
            }
            if (context.setActualStep) {
                context.setActualStep(Steps.step_5)
            }
        } 
    }

    const onClickModifyAgainHandle = () => {
        let newCollections:IDataCollection[] = []
        collections.forEach((col:IDataCollection) => {
            let newCol = {...col}
            delete newCol.results
            newCollections.push(newCol)
        })
        updateCollections(newCollections)
        setState(StatePredict.EMPTY)
        context.setActualStep(Steps.step_3)
    }

    const setDecimals = (value:any) => {
        if(!value || typeof value !== 'number' || !context.options.decimals) return value
        return round(value, context.options.decimals)
    }

    useEffect(() => {
        if(state == StatePredict.LOADING){
            setState(StatePredict.DONE)
        }
    }, [collections])

    useEffect(() => {
    }, [currentCollIdx])

    useEffect(() => {
    }, [state])

    useEffect(() => {
        const divResults = document.getElementById('id-results')
        if(divResults) {
            setSizePlot({
                height: context.height-220,
                width: (divResults.offsetWidth < context.width) ? divResults.offsetWidth : context.width
            })
            console.log('width', divResults.offsetWidth)
        }
    }, [context.width, context.height, state])
    
    
    const showPlot = (col:IDataCollection) => {
        //{col.results.filter((r:IResult) => r.id != idDefault && r.id != idNew).map((r:IResult) => <p>{r.id} = {setDecimals(r.result)}</p>)}
        if(col.results){
            const results = col.results.filter((r:IResult) => r.id != idDefault && r.id != idNew && r.correspondsWith != undefined && r.result != 'ERROR' && r.result != undefined)
            if(results.length < 1) return <div></div>
            
            const tagsGroup : { [tag:string] : IResult[] } = groupBy(results, "tag")
            console.log("tagGroup", tagsGroup)

            const dataArray:any[] = Object.entries(tagsGroup).map(([tag, resultsOfTag]) => {
                // No pongo la x global por si alguna falla que no se rompa toda la grafica
                var values_x:number[] = [], values_y:number [] = [], text:number[] = []
                resultsOfTag.forEach((r:IResult) => { 
                    if (r.result != undefined && r.result != 'ERROR' 
                        && r.correspondsWith !== undefined && r.data[r.correspondsWith.tag] !== undefined) {
                        values_x.push(r.correspondsWith.intervalValue)
                        values_y.push(r.result)
                        text.push(setDecimals(r.data[r.correspondsWith.tag]))
                    }
                })

                values_y = values_y.map((v:number) => setDecimals(v))
                console.log("text", text)
                return {
                    x : values_x,
                    y : values_y,
                    text : text,
                    type : 'scatter',
                    name : tag
                }
            })

            console.log('dataArrayPLOT', dataArray)

            const layoutObj:Partial<Layout> = {
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
                    ticksuffix: (col.interval.type == IntervalTypeEnum.percentage) ? "%" : ""
                },
                yaxis: {
                    tickcolor: theme.colors.text.primary,
                    zerolinecolor: theme.colors.text.primary,
                    gridcolor: theme.colors.text.primary,
                    color: theme.colors.text.primary
                }
            }

            const newButton:ModeBarButtonAny = {
                title: 'Download plot as png',
                name: 'Download plot as png',
                icon: Icons.camera,
                click: async (gd:PlotlyHTMLElement) => {
                    console.log("AAA")
                    await toImage(gd, {
                        width: 900,
                        height: 900,
                        format: 'png'
                    }).then((img:string) => {
                        //var image = new Image()
                        //image.src = img
                        var w = window.open("")
                        if (w != null) w.document.write('<iframe src="' + img  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');

                         //w.document.write(image.outerHTML)
                    })
                }
            }

            const config:Partial<Config> = {
                //modeBarButtonsToAdd: [btnCapture],
                modeBarButtonsToRemove: ['toImage'],
                modeBarButtonsToAdd: [newButton]
            }

            return <Plot layout={layoutObj} data={dataArray} config={config}/>
        } else {
            return <div></div>
        }
    }

    const defaultValue = (col:IDataCollection) => {
        var res = <div></div>
        if(col.results){
            const def = col.results.find((r:IResult) => r.id == idDefault)
            if(def) res = <div className='horizontal-item-1' style={{backgroundColor:theme.colors.background.secondary, padding:'10px', width: '50%', marginRight: '10px'}}>
                    <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel._step4.originalValue}</p>
                    <h1 style={{ textAlign: 'center'}}>{setDecimals(def.result)}</h1>
            </div>
        }
        return res
    } 

    const newValue = (col:IDataCollection) => {
        var res = <div></div>
        if(col.results){
            const nw = col.results.find((r:IResult) => r.id == idNew)
            if(nw) res = <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px', width: '50%'}}>
                <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel._step4.newValue}</p>
                <h1 style={{ textAlign: 'center'}}>{setDecimals(nw.result)}</h1>
            </div>
        }
        return res
    }

    const getButton = (currentCollIdx != undefined && currentCollIdx < collections.length && collections[currentCollIdx].results) ? 
        <Button fullWidth icon='repeat' variant='destructive' disabled={disabledModifyAgain} onClick={onClickModifyAgainHandle}>{context.messages._panel._step4.modifyAgain}</Button>
        : <Button fullWidth disabled={disabled} onClick={onClickPredictHandle}>{context.messages._panel._step4.predict}</Button>


    const showResults = () => {
        if(currentCollIdx != undefined && currentCollIdx < collections.length && collections[currentCollIdx].results){
            const col:IDataCollection = collections[currentCollIdx]
            return <div style={{ marginTop: '10px', width: '100%' }}>
                <div style={{ display: 'flex'}}>
                    {defaultValue(col)}
                    {newValue(col)}
                </div>
                <div id='id-results' style={{ width: '100%', backgroundColor:theme.colors.background.secondary, marginTop: '10px' }}>
                    {showPlot(col)}
                </div>
            </div>
        } else {
            return <div></div>
        }
    }
    
    const viewResults = () => {
        switch(state){
            case StatePredict.LOADING:
                return <VerticalGroup align='center'><Spinner size={30}/></VerticalGroup>
            case StatePredict.DONE:
                return showResults()
            case StatePredict.EMPTY:
                return <div></div>
        }
    }

    return <Fragment>
        <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
            <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel.step} 4</p>
            <h4>{context.messages._panel._step4.predictResult}</h4>
            <VerticalGroup justify='center'>
                {getButton}
            </VerticalGroup>
        </div>
        {viewResults()}
    </Fragment>
}