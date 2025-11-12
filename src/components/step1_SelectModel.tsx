import { SelectableValue } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Select, useTheme2 } from '@grafana/ui';
import React, { useState, useEffect, useContext } from 'react';
import { Steps } from 'utils/constants';
import { saveVariableValue } from 'utils/datasources/grafana';
import log from 'utils/logger';
import { IModel, ISelect } from 'utils/types';
import { Context, futureDate, modelsToSelect } from 'utils/utils';

interface Props {
    models: IModel[],
    setModel: any
}

export const SelectModel: React.FC<Props> = ({ models, setModel }) => {

    const theme = useTheme2();
    const context = useContext(Context);

    const disabled = (context.actualStep) ? context.actualStep > Steps.step_2 : false

    const [value, setValue] = useState<SelectableValue<number>>()
    const [modelsOptions, setModelsOptions] = useState<ISelect[]>([])

    useEffect(() => {
        log.info("[Select model] Models updated");
        log.debug("[Select model] Incoming models:", models);
        setModelsOptions(modelsToSelect(models))
    }, [models])


    useEffect(() => {
        log.info("[Select model] Model selection changed");
        log.debug("[Select model] Selected value:", value);
        setModel(value?.value)
        if (value != null && context.setActualStep) {
            log.info("[Select model] Valid model selected, moving to Step 2");
            saveVariableValue(locationService, value.varTime, futureDate())
            context.setActualStep(Steps.step_2)
        } else {
            log.warn("[Select model] No model selected, reverting to Step 1");
            context.setActualStep(Steps.step_1)
        }
    }, [value])

    // HTML
    // -------------------------------------------------------------------------------------------------------------

    return <div style={{ backgroundColor: theme.colors.background.secondary, padding: '10px' }}>
        <p style={{ color: theme.colors.text.secondary, paddingBottom: '0px', marginBottom: '2px' }}>{context.messages._panel.step} 1</p>
        <h4>{context.messages._panel._step1.selectModel}</h4>
        <Select
            options={modelsOptions}
            value={value}
            onChange={(v) => setValue(v)}
            placeholder={""}
            disabled={disabled}
        />
    </div>
}
