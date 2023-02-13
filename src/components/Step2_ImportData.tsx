import { Button, Legend, useTheme2, VerticalGroup } from '@grafana/ui';
import React from 'react';

interface Props {
    width: number,
    height: number
}

export const ImportData: React.FC<Props> = ({width, height}) => {

    const theme = useTheme2();

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'7px'}}>
        <Legend>Import data</Legend>
        <VerticalGroup justify='center'>
            <Button fullWidth>Date</Button>
            <Button fullWidth>Excel</Button>
        </VerticalGroup>
    </div>
}