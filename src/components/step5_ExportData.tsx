import { Button, useTheme2, VerticalGroup } from '@grafana/ui';
import React, { useContext } from 'react';
import { Steps } from 'utils/constants';
import { IModel } from 'utils/types';
import { Context } from 'utils/utils';

interface Props {
    model ?: IModel
}

export const ExportData: React.FC<Props> = () => {

    const theme = useTheme2();
    const context = useContext(Context);

    const disabled_data = (context.actualStep) ? context.actualStep < Steps.step_3 : false
    const disabled_results = (context.actualStep) ? context.actualStep < Steps.step_5 : false

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}>
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel.step} 5</p>
        <h4>{context.messages._panel._step5.exportData}</h4>
        <VerticalGroup justify='center'>
            <Button fullWidth disabled={disabled_data}>{context.messages._panel._step5.downloadData}</Button>
            <Button fullWidth disabled={disabled_results}>{context.messages._panel._step5.downloadResults}</Button>
        </VerticalGroup>
    </div>
}