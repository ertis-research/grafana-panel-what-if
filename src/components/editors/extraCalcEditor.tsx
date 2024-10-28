import React from 'react'
import { StandardEditorProps } from "@grafana/data";
import { IExtraCalc } from 'utils/types';
import { ControlledCollapse, useTheme2 } from '@grafana/ui';
import { Mode } from 'utils/constants';
import { ExtraCalcDefault } from 'utils/default';
import { css } from '@emotion/css';
import { ExtraCalcForm } from './extraCalcForm';
import { deepCopy } from 'utils/utils';


interface Props extends StandardEditorProps<IExtraCalc[]> { }

export const ExtraCalcEditor: React.FC<Props> = ({ value: elements, onChange, context }) => {

    if (!elements || !elements.length) {
        elements = [];
    }

    const addElement = (newExtraCalc: IExtraCalc) => {
        const updated = [...elements, newExtraCalc]
        onChange(updated)
    }

    const updateElement = (idx: number, extraCalcUpdated: IExtraCalc) => {
        const updated = [...elements]
        updated[idx] = extraCalcUpdated
        onChange(updated)
    }

    const deleteElement = (idx: number) => {
        const updated = [...elements]
        updated.splice(idx, 1)
        onChange(updated)
    }

    const listExtraCalcs = elements.map((element: IExtraCalc, idx: number) => {
        return <div>
            <ControlledCollapse label={element.id} collapsible>
                <ExtraCalcForm extraCalc={element}
                    mode={Mode.EDIT}
                    updateFunction={(m: IExtraCalc) => updateElement(idx, m)}
                    deleteFunction={() => deleteElement(idx)}
                    context={context} />
            </ControlledCollapse>
        </div>
    })

    return (<div style={{ marginRight: '15px' }}>
        <p>This is an <b>optional</b> feature. For now only recursive calculations are allowed.</p>
        {listExtraCalcs}
        <ControlledCollapse label="Add new extra calculation" collapsible isOpen={false} className={css({ color: useTheme2().colors.info.main })}>
            <ExtraCalcForm extraCalc={deepCopy(ExtraCalcDefault)} updateFunction={addElement} mode={Mode.CREATE} context={context} />
        </ControlledCollapse>
    </div>)
}
