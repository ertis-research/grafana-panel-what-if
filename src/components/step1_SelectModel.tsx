import { SelectableValue } from '@grafana/data';
import { Select, useTheme2 } from '@grafana/ui';
import React, { useState, useEffect, useContext } from 'react';
import { Steps } from 'utils/types';
import { Context } from 'utils/utils';

interface Props {}

export const SelectModel: React.FC<Props> = ({}) => {

    const theme = useTheme2();
    const context = useContext(Context);

    const options = [
        { label: 'Modelo 1', value: 0 },
        { label: 'Modelo 2', value: 1 },
        { label: 'Modelo 3', value: 2 }
    ];

    const [value, setValue] = useState<SelectableValue<number>>();

    useEffect(() => {
        if(value != null && context.setActualStep){
            context.setActualStep(Steps.step_2)
        }
    }, [value])

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>Step 1</p>
        <h4>Select model</h4>
        <Select
            options={options}
            value={value}
            onChange={(v) => setValue(v)}
        />
    </div>
}