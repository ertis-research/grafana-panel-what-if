import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { SelectModel } from './Step1_SelectModel';
import { ImportData } from './Step2_ImportData';
import { ModifyData } from './Step3_ModifyData';
import { PredictModel } from './Step4_PredictModel';
import { SaveData } from './Step5_SaveData';
//import { css, cx } from '@emotion/css';
//import { useStyles2, useTheme2 } from '@grafana/ui';

interface Props extends PanelProps<SimpleOptions> {}

/*
const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
      position: relative;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
  };
};*/

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  //const theme = useTheme2();
  //const styles = useStyles2(getStyles);
  return <div className="container">
    <div className="main-grid">
      <div className="item-0">
        <SelectModel/>
      </div>
      <div className="item-1">
        <ImportData width={width} height={height} />
      </div>
      <div className="item-2">
        <ModifyData width={width} height={height} />
      </div>
      <div className="item-3">
        <PredictModel width={width} height={height} />
      </div>
      <div className="item-4">
        <SaveData width={width} height={height} />
      </div>
    </div>
  </div>
};


/*
return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <svg
        className={styles.svg}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`-${width / 2} -${height / 2} ${width} ${height}`}
      >
        <g>
          <circle style={{ fill: theme.colors.primary.main }} r={100} />
        </g>
      </svg>

      <div className={styles.textBox}>
        {options.showSeriesCount && <div>Number of series: {data.series.length}</div>}
        <div>Text option value: {options.text}</div>
      </div>
    </div>
  );
  */
