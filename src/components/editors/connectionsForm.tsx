import React, { useEffect, useState } from 'react';
import { Button, InlineField, InlineFieldRow, Input, Select, useTheme2, RadioButtonGroup, DeleteButton } from '@grafana/ui';
import { css } from '@emotion/css';
import { IModelConnection, Method, ICredentials, ConnectionType } from 'utils/types';
import { enumToSelect } from 'utils/utils';
import { getDataSourceSrv } from '@grafana/runtime';
import { SelectableValue } from '@grafana/data';
import { infinityDatasourceType } from 'utils/constants';

interface Props {
    connections: IModelConnection[];
    setConnections: (connections: IModelConnection[]) => void;
    disabled: boolean;
}

export const ConnectionsForm: React.FC<Props> = ({ connections, setConnections, disabled }) => {
    const methodList = enumToSelect(Method);
    const [infinityDatasources, setInfinityDatasources] = useState<Array<SelectableValue<string>>>([]);

    const connectionTypeOptions = [
        { label: 'Infinity Data Source', value: ConnectionType.Infinity },
        { label: 'Direct URL', value: ConnectionType.Insecure }
    ];

    useEffect(() => {
        const dsList = getDataSourceSrv().getList();
        const infinityDs = dsList
            .filter(ds => ds.type === infinityDatasourceType || ds.meta.id === infinityDatasourceType)
            .map(ds => ({ label: ds.name, value: ds.uid }));

        setInfinityDatasources(infinityDs);
    }, []);

    const handleAddConnection = () => {
        // Por defecto lo creamos como 'infinity' si hay datasources disponibles, sino 'insecure'
        const defaultType = infinityDatasources.length > 0 ? ConnectionType.Infinity : ConnectionType.Insecure;
        setConnections([...connections, { url: "", method: Method.GET, type: defaultType }]);
    }

    const handleRemoveConnection = (index: number) => {
        const newConns = [...connections];
        newConns.splice(index, 1);
        setConnections(newConns);
    }

    const handleChangeConnection = (index: number, field: keyof IModelConnection, value: any) => {
        const newConns = [...connections];
        newConns[index] = { ...newConns[index], [field]: value } as IModelConnection;

        // Limpiamos datos residuales si cambiamos de tipo
        if (field === 'type') {
            if (value === ConnectionType.Infinity) {
                newConns[index].credentials = undefined; // Infinity maneja sus propias credenciales
            } else {
                newConns[index].datasourceUid = undefined;
            }
        }

        setConnections(newConns);
    }

    const handleConnectionCredentials = (index: number, field: keyof ICredentials, value: string) => {
        const newConns = [...connections];
        const currentCreds = newConns[index].credentials || { username: "", password: "" };
        newConns[index].credentials = { ...currentCreds, [field]: value };
        setConnections(newConns);
    }

    const checkValueField = (value?: string) => {
        return value !== undefined && value.trim() !== "";
    }

    return (
        <div className={css({ color: useTheme2().colors.text.primary })}>
            {connections.map((conn, index) => {
                const currentType = conn.type || ConnectionType.Insecure; 
                return (
                    <div key={index} style={{ width: '100%', display: 'flex', marginBottom: '15px' }}>
                        <b style={{ width: '20px', height: '30px', display: 'flex', alignItems: 'center' }}>{index + 1}</b>
                        <div className='verticalDiv' style={{ width: '100%' }}>
                            <InlineFieldRow>
                                <InlineField label="Name" labelWidth={14} grow disabled={disabled}>
                                    <Input
                                        disabled={disabled}
                                        value={conn.name}
                                        onChange={(e) => handleChangeConnection(index, 'name', e.currentTarget.value)}
                                    />
                                </InlineField>
                            </InlineFieldRow>

                            <div style={{ marginBottom: '5px' }}>
                                <RadioButtonGroup
                                    options={connectionTypeOptions}
                                    value={currentType}
                                    onChange={(v) => handleChangeConnection(index, 'type', v)}
                                    disabled={disabled}
                                />
                            </div>

                            {/* MODO INFINITY */}
                            {currentType === ConnectionType.Infinity && (
                                <>
                                    <InlineFieldRow>
                                        <InlineField label="Data Source" labelWidth={14} required grow disabled={disabled}>
                                            <Select
                                                value={infinityDatasources.find(ds => ds.value === conn.datasourceUid)}
                                                options={infinityDatasources}
                                                onChange={(v) => handleChangeConnection(index, 'datasourceUid', v.value)}
                                                disabled={disabled}
                                                menuPosition='fixed'
                                                placeholder="Select Infinity DS..."
                                            />
                                        </InlineField>
                                    </InlineFieldRow>
                                    <InlineFieldRow>
                                        <InlineField label="Method" labelWidth={14} required disabled={disabled}>
                                            <Select
                                                value={methodList.find(m => m.value === conn.method) || { label: Method.GET, value: Method.GET }}
                                                width={14}
                                                options={methodList}
                                                onChange={(v) => handleChangeConnection(index, 'method', v.value)}
                                                disabled={disabled}
                                                menuPosition='fixed'
                                            />
                                        </InlineField>
                                        <InlineField label="Path" labelWidth={16} grow required disabled={disabled} tooltip="Ej: /api/v1/status">
                                            <Input disabled={disabled} value={conn.url} onChange={(e) => handleChangeConnection(index, 'url', e.currentTarget.value)} required placeholder="/relative-path" />
                                        </InlineField>
                                    </InlineFieldRow>
                                </>
                            )}

                            {/* MODO INSEGURO (Legacy) */}
                            {currentType === ConnectionType.Insecure && (
                                <>
                                    <InlineFieldRow>
                                        <InlineField label="Method" labelWidth={14} required disabled={disabled}>
                                            <Select
                                                value={methodList.find(m => m.value === conn.method) || { label: Method.GET, value: Method.GET }}
                                                width={14}
                                                options={methodList}
                                                onChange={(v) => handleChangeConnection(index, 'method', v.value)}
                                                disabled={disabled}
                                                menuPosition='fixed'
                                            />
                                        </InlineField>
                                        <InlineField label="Full URL" labelWidth={12} grow required disabled={disabled}>
                                            <Input disabled={disabled} value={conn.url} onChange={(e) => handleChangeConnection(index, 'url', e.currentTarget.value)} required placeholder="https://..." />
                                        </InlineField>
                                    </InlineFieldRow>
                                    <InlineFieldRow>
                                        <InlineField label="Username" labelWidth={14} grow disabled={disabled}>
                                            <Input disabled={disabled} required={checkValueField(conn.credentials?.password)}
                                                value={conn.credentials?.username || ''} onChange={(e) => handleConnectionCredentials(index, 'username', e.currentTarget.value)} />
                                        </InlineField>
                                        <InlineField label="Password" labelWidth={12} grow disabled={disabled}>
                                            <Input type='password' disabled={disabled} required={checkValueField(conn.credentials?.username)}
                                                value={conn.credentials?.password || ''} onChange={(e) => handleConnectionCredentials(index, 'password', e.currentTarget.value)} />
                                        </InlineField>
                                    </InlineFieldRow>
                                </>
                            )}
                        </div>
                        <div style={{ height: '30px', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                            <DeleteButton
                                disabled={disabled || connections.length === 1}
                                onConfirm={() => handleRemoveConnection(index)}
                            />
                        </div>
                    </div>
                );
            })}

            <Button variant='secondary' icon='plus' disabled={disabled} onClick={handleAddConnection} style={{ marginTop: '10px' }}>
                Add connection
            </Button>
        </div>
    );
}



