import { Button, useTheme2, VerticalGroup } from '@grafana/ui'
import React, { useContext } from 'react'
import { Steps } from 'utils/constants'
import { dataToCSV } from 'utils/csv'
import { IDataCollection, IModel } from 'utils/types'
import { Context } from 'utils/utils'
import { saveAs } from 'file-saver'

interface Props {
    model ?: IModel,
    collections : IDataCollection[],
    currentCollection ?: IDataCollection
}

export const ExportData: React.FC<Props> = ({model, collections, currentCollection}) => {

    const theme = useTheme2()
    const context = useContext(Context)

    const disabled_data = (context.actualStep) ? context.actualStep < Steps.step_3 : false
        //|| !currentCollection?.data.some((d:IData) => d.new_value || d.set_percentage) 
    const disabled_results =  (context.actualStep) ? context.actualStep < Steps.step_5 : false

    const handleOnClickDownloadData = () => {
        if(currentCollection){
            saveAs(dataToCSV(currentCollection), (currentCollection.id + ".csv").replace(/ /g, '_'))
        }
    }

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px', display: 'block'}}>
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel.step} 5</p>
        <h4>{context.messages._panel._step5.exportData}</h4>
        <VerticalGroup justify='center' style={{ margin: '0px', padding: '0px' }}>
            <Button fullWidth disabled={disabled_data} onClick={handleOnClickDownloadData}>{context.messages._panel._step5.downloadData}</Button>
            <Button fullWidth disabled={disabled_results}>{context.messages._panel._step5.downloadResults}</Button>
        </VerticalGroup>
    </div>
}