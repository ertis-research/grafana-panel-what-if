import { Button, useTheme2, VerticalGroup } from '@grafana/ui';
import React, { useContext } from 'react';
import { Context, Steps } from './Utils';

interface Props {}

export const ImportData: React.FC<Props> = () => {

    const theme = useTheme2();
    const context = useContext(Context);

    const disabled = (context.actualStep) ? context.actualStep  < Steps.step_2 : false

    const finalFunc = () => {
        if (context.setActualStep) {
            context.setActualStep(Steps.step_3)
        }
    }

    const onClickDateHandle = () => {
        finalFunc()
    }

    const onClickExcelHandle = () => {
        finalFunc()
    }

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>Step 2</p>
        <h4>Import data</h4>
        <VerticalGroup justify='center'>
            <Button fullWidth disabled={disabled} onClick={onClickDateHandle}>Date</Button>
            <Button fullWidth disabled={disabled} onClick={onClickExcelHandle}>Excel</Button>
        </VerticalGroup>
    </div>
}