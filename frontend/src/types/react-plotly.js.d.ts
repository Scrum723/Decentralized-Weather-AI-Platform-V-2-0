declare module 'react-plotly.js' {
  import { Component } from 'react';

  interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    frames?: any[];
    onInitialized?: (figure: any, graphDiv: any) => void;
    onUpdate?: (figure: any, graphDiv: any) => void;
    onPurge?: (figure: any, graphDiv: any) => void;
    onError?: (err: any) => void;
    debug?: boolean;
    style?: React.CSSProperties;
    className?: string;
    useResizeHandler?: boolean;
    divId?: string;
    revision?: number;
  }

  export default class Plot extends Component<PlotParams> {}
}