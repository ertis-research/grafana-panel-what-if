import { Button, useTheme2, VerticalGroup } from '@grafana/ui';
import React from 'react';

interface Props {
    width: number,
    height: number
}

export const PredictModel: React.FC<Props> = ({width, height}) => {

    const theme = useTheme2();

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'7px'}}>
        <VerticalGroup justify='center'>
            <Button fullWidth>Predict</Button>
        </VerticalGroup>
    </div>
}