import React from 'react'
import { StandardEditorProps } from "@grafana/data";
import { IFormat } from 'utils/types';
import { ControlledCollapse, useTheme2 } from '@grafana/ui';
import { Mode } from 'utils/constants';
import { FormatForm } from './formatForm';
import { FormatDefault } from 'utils/default';
import { css } from '@emotion/css';


interface Props extends StandardEditorProps<IFormat[]> {}

export const FormatEditor: React.FC<Props> = ({ value: elements, onChange, context }) => {

    if (!elements || !elements.length) {
        elements = [];
    }

    const addElement = (newFormat : IFormat) => {
        const updated = [...elements, newFormat]
        onChange(updated)
    }

    const updateElement = (idx : number, formatUpdated : IFormat) => {
        const updated = [...elements]
        updated[idx] = formatUpdated
        onChange(updated)
    }

    const deleteElement = (idx:number) => {
        const updated = [...elements]
        updated.splice(idx, 1)
        onChange(updated)
    }

    const listFormats = elements.map((element:IFormat, idx:number) => {
        return <div>
            <ControlledCollapse label={element.id} collapsible>
                <FormatForm format={element} 
                    mode={Mode.EDIT} 
                    updateFunction={(m:IFormat) => updateElement(idx, m)} 
                    deleteFunction={() => deleteElement(idx)}
                    context={context}/>
            </ControlledCollapse>
        </div>
    })

    return (<div style={{ marginRight: '15px'}}>
        {listFormats}
        <ControlledCollapse label="Add new format" collapsible isOpen={false} className={css({color: useTheme2().colors.info.main})}>
            <FormatForm format={FormatDefault} updateFunction={addElement} mode={Mode.CREATE} context={context}/>
        </ControlledCollapse>
    </div>)
}