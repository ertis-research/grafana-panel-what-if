import { Button, Spinner, useTheme2, VerticalGroup } from '@grafana/ui'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { Context, round } from 'utils/utils'
import { IDataCollection, IModel, IResult } from 'utils/types'
import { idDefault, idNew, Steps } from 'utils/constants'
import { predictAllCollections } from 'utils/predictions'
import Plot from 'react-plotly.js'
import { groupBy } from 'utils/utils'

interface Props {
    model ?: IModel,
    collections : IDataCollection[],
    updateCollections : any,
    currentCollection ?: IDataCollection
}

enum StatePredict {
    EMPTY,
    LOADING,
    DONE
}

export const PredictModel: React.FC<Props> = ({model, collections, updateCollections, currentCollection}) => {

    const theme = useTheme2();
    const context = useContext(Context);

    const [state, setState] = useState<StatePredict>(StatePredict.EMPTY)

    const disabled = (context.actualStep) ? context.actualStep < Steps.step_3 : false

    const onClickPredictHandle = () => {
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

    const setDecimals = (value:any) => {
        if(!value || typeof value !== 'number' || !context.options.decimals) return value
        return round(value, context.options.decimals)
    }

    useEffect(() => {
        if(state == StatePredict.LOADING){
            setState(StatePredict.DONE)
        }
    }, [collections])
    
    const showPlot = (col:IDataCollection) => {
        //{col.results.filter((r:IResult) => r.id != idDefault && r.id != idNew).map((r:IResult) => <p>{r.id} = {setDecimals(r.result)}</p>)}
        if(col.results){
            const results = col.results.filter((r:IResult) => r.id != idDefault && r.id != idNew && r.correspondsWith != undefined && r.result != 'ERROR' && r.result != undefined)
            const tagsGroup : { [tag:string] : IResult[] } = groupBy(results, "tag")
            console.log("tagGroup", tagsGroup)

            const dataArray:any[] = Object.entries(tagsGroup).map(([tag, resultsOfTag]) => {
                // No pongo la x global por si alguna falla que no se rompa toda la grafica
                var values_x:number[] = [], values_y:number [] = []
                resultsOfTag.forEach((r:IResult) => { if (r.correspondsWith != undefined) values_x.push(r.correspondsWith.porcentage)})
                resultsOfTag.forEach((r:IResult) => { if (r.result != undefined && r.result != 'ERROR') values_y.push(r.result)})

                return {
                    x : values_x,
                    y : values_y,
                    type : 'scatter',
                    name : tag
                }
            })

            console.log('dataArrayPLOT', dataArray)

            const layoutObj = {
                autosize: true
            }

            return <Plot layout={layoutObj} data={dataArray} />
        } else {
            return <div></div>
        }
    }

    const defaultValue = (col:IDataCollection) => {
        var res = <div></div>
        if(col.results){
            const def = col.results.find((r:IResult) => r.id == idDefault)
            if(def) res = <div>
                <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
                    <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel._step4.originalValue}</p>
                    <h1 style={{ textAlign: 'center'}}>{setDecimals(def.result)}</h1>
                </div>
            </div>
        }
        return res
    } 

    const newValue = (col:IDataCollection) => {
        var res = <div></div>
        if(col.results){
            const def = col.results.find((r:IResult) => r.id == idNew)
            if(def) res = <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
                <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel._step4.newValue}</p>
                <h1 style={{ textAlign: 'center'}}>{setDecimals(def.result)}</h1>
            </div>
        }
        return res
    }

    const showResults = collections.filter((col:IDataCollection) => col.id == currentCollection?.id).map((col:IDataCollection) => {
        if(col.results){
            return <div>
                {defaultValue(col)}
                {newValue(col)}
                {showPlot(col)}
            </div>
        } else {
            return <div></div>
        }
    })

    const viewResults = () => {
        switch(state){
            case StatePredict.LOADING:
                return <VerticalGroup align='center'><Spinner size={30}/></VerticalGroup>
            case StatePredict.DONE:
                return showResults
            case StatePredict.EMPTY:
                return <div></div>
        }
    }

    return <Fragment>
        <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
            <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel.step} 4</p>
            <h4>{context.messages._panel._step4.predictResult}</h4>
            <VerticalGroup justify='center'>
                <Button fullWidth disabled={disabled} onClick={onClickPredictHandle}>{context.messages._panel._step4.predict}</Button>
            </VerticalGroup>
        </div>
        {viewResults()}
    </Fragment>
}