import React, {useMemo} from "react";
import {AvlMap} from '~/modules/avl-maplibre/src';
import {ChoroplethCountyFactory} from "./layers/choroplethCountyLayer.jsx";
import {format as d3format} from "d3-format";
import * as d3scale from "d3-scale";
import {d3Formatter, fnumIndex} from "../../../../../../utils/macros.jsx";

const widths = {
    '1/3': 290,
    '2/3': 370,
    '1/2': 370,
    '2': 370,
    '1': 370,
    [undefined]: 370
}
const DrawLegend = ({domain=[], range=[], title, type = 'quantile', format = '0.2s', size}) => {
    let scale;
    switch (type) {
        case "quantile":
            scale = d3scale.scaleQuantile()
                .domain(domain)
                .range(range);
            break;
        case "quantize":
            scale = d3scale.scaleQuantize()
                .domain(domain)
                .range(range);
            break;
        case "threshold":
            scale = d3scale.scaleThreshold()
                .domain(domain)
                .range(range);
            break;
    }

    const fmt = (typeof format === "function") ? format : d3Formatter(format);

    const RenderLegendBox = ({value, color, fmt, className}) => {
        const width = `${widths[size] / (range.length + 1)}px`,
            heightParent = '40px',
            heightChild = '20px';
        return (
            <div className={`flex flex-col h-[${heightParent}] ${className}`} style={{width}}>
                <div className={`h-[${heightChild}]`} style={{backgroundColor: color, width}}/>
                <div className={`h-[${heightChild}] text-xs text-right`} style={{width}}>
                    { fmt ? fmt(value) : value }
                </div>
            </div>
        )
    }
    return (
        <div className={'flex flex-row justify-center inline-block align-middle pt-2.5'}>
            {
                range.map((r, i) => {
                    return <RenderLegendBox value={domain[i]} color={r} fmt={fmt}/>
                })
            }
            <RenderLegendBox value={'N/A'} color={'#CCC'} className={'ml-1'}/>
        </div>
    )
}
export const RenderMap = ({falcor, layerProps, legend}) => {
    const map_layers = useMemo(() => [ChoroplethCountyFactory()], []);
    return (
        <>
            <div className={`relative w-[${widths[legend?.size]}px] bg-white float-right mt-[20px] m-5 -mb-[100px] rounded-md`}
                 style={{zIndex: 10}}>
                {
                    legend.title && <label className={'font-sm pl-2'}>{legend.title}</label>
                }
                <DrawLegend {...legend} />
            </div>
            <AvlMap
                falcor={falcor}
                mapOptions={{
                    styles: [
                        {
                            name: 'blank',
                            style: {
                                sources: {},
                                version: 8,
                                layers: [{
                                    "id": "background",
                                    "type": "background",
                                    "layout": {"visibility": "visible"},
                                    "paint": {"background-color": 'rgba(0,0,0,0)'}
                                }]
                            }
                        },
                        {
                            name: "Light",
                            style: "https://api.maptiler.com/maps/dataviz-light/style.json?key=mU28JQ6HchrQdneiq6k9"
                        }]

                }}
                layers={map_layers}
                layerProps={layerProps}
                CustomSidebar={() => <div/>}
            />
        </>
    )
}