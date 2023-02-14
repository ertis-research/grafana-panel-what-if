import { Button, useTheme2, VerticalGroup } from '@grafana/ui';
import React, { useContext } from 'react';
import { Context, Steps } from './Utils';

interface Props {
}

export const PredictModel: React.FC<Props> = () => {

    const theme = useTheme2();
    const context = useContext(Context);

    const disabled = (context.actualStep) ? context.actualStep < Steps.step_3 : false

    const onClickPredictHandle = () => {
        if (context.setActualStep) {
            context.setActualStep(Steps.step_5)
        }
    }

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>Step 4</p>
        <h4>Predict result</h4>
        <VerticalGroup justify='center'>
            <Button fullWidth disabled={disabled} onClick={onClickPredictHandle}>Predict</Button>
        </VerticalGroup>
    </div>
}