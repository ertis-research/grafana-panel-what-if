import { SelectableValue } from '@grafana/data';
import { Icon, Legend, Select, useTheme2 } from '@grafana/ui';
import React, { useState } from 'react';

interface Props {
    width: number,
    height: number
}

export const ModifyData: React.FC<Props> = ({width, height}) => {

    const theme = useTheme2();

    const options = [
        { label: 'Modelo 1', value: 0 },
        { label: 'Modelo 2', value: 1 },
        { label: 'Modelo 3', value: 2 }
    ];

    const [value, setValue] = useState<SelectableValue<number>>();

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'7px'}}>
        <Legend>Modify data</Legend>
        <Select
            options={options}
            value={value}
            onChange={(v) => setValue(v)}
            prefix={<Icon name="search"/>} 
            placeholder="Search tags"
            isMulti
        />
    </div>
}