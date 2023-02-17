import { SelectableValue } from '@grafana/data';
import { Select, useTheme2 } from '@grafana/ui';
import React, { useState, useEffect, useContext } from 'react';
import { IModel, ISelect, Steps } from 'utils/types';
import { Context, modelsToSelect } from 'utils/utils';

interface Props {
    models : IModel[],
    setModel : any
}

export const SelectModel: React.FC<Props> = ({ models, setModel }) => {

    const theme = useTheme2();
    const context = useContext(Context);

    const [value, setValue] = useState<SelectableValue<number>>()
    const [modelsOptions, setModelsOptions] = useState<ISelect[]>([])

    useEffect(() => {
        setModelsOptions(modelsToSelect(models))
    }, [models])
    

    useEffect(() => {
        setModel(value?.value)
        if(value != null && context.setActualStep){
            context.setActualStep(Steps.step_2)
        } else {
            context.setActualStep(Steps.step_1)
        }
    }, [value])

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>Step 1</p>
        <h4>Select model</h4>
        <Select
            options={modelsOptions}
            value={value}
            onChange={(v) => setValue(v)}
        />
    </div>
}