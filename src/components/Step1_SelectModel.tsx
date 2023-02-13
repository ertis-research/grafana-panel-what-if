import { SelectableValue } from '@grafana/data';
import { Select, useTheme2 } from '@grafana/ui';
import React, { useState } from 'react';

interface Props {
}

export const SelectModel: React.FC<Props> = () => {

    const theme = useTheme2();

    const options = [
        { label: 'Modelo 1', value: 0 },
        { label: 'Modelo 2', value: 1 },
        { label: 'Modelo 3', value: 2 }
    ];

    const [value, setValue] = useState<SelectableValue<number>>();

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'7px'}}>
        <Select
            options={options}
            value={value}
            onChange={(v) => setValue(v)}
        />
    </div>
}