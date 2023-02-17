import { Button, Input, useTheme2, VerticalGroup } from '@grafana/ui';
import React, { ChangeEvent, useContext, useState } from 'react';
import { Context, Steps } from './utils';

interface Props {}

export const ImportData: React.FC<Props> = () => {

    const theme = useTheme2()
    const context = useContext(Context)

    const [dateTime, setDateTime] = useState<string>()

    const disabled = (context.actualStep) ? context.actualStep  < Steps.step_2 : false

    const finalFunc = () => {
        if (context.setActualStep) {
            context.setActualStep(Steps.step_3)
        }
    }

    const handleOnChangeDateTime = (event:ChangeEvent<HTMLInputElement>) => {
        setDateTime(event.target.value)
        console.log(event.target.value)
    }

    const handleOnClickDate = () => {
        finalFunc()
    }

    const handleOnClickExcel = () => {
        finalFunc()
    }
    

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>Step 2</p>
        <h4>Import data</h4>
        <VerticalGroup justify='center'>
            <Input value={dateTime} type='datetime-local' onChange={handleOnChangeDateTime}/>
            <Button fullWidth disabled={disabled || !dateTime} onClick={handleOnClickDate}>Date</Button>
            <Button fullWidth disabled={disabled} onClick={handleOnClickExcel}>Excel</Button>
        </VerticalGroup>
    </div>
}