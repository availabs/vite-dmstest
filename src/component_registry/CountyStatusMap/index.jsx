import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import VersionSelectorSearchable from "../shared/versionSelector/searchable.jsx";
import GeographySearch from "../shared/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {ButtonSelector} from "../shared/buttonSelector.jsx";
import {RenderColorPicker} from "../shared/colorPicker.jsx";
import {scaleThreshold} from "d3-scale";
import {getColorRange} from "~/pages/DataManager/utils/color-ranges.js";
import ckmeans from '~/utils/ckmeans';
import {RenderMap} from "../shared/Map/RenderMap.jsx";
import {HazardSelectorSimple} from "../shared/HazardSelector/hazardSelectorSimple.jsx";
import {hazardsMeta} from "~/utils/colors.jsx";
import {Attribution} from "../shared/attribution.jsx";
import {useNavigate} from "react-router-dom";


/*

Expired
Date is null || > 5 years :  Red
> 4 years : ..
> 3 years : ..
> 2 years : ..
> 1 years : orange

Approved
-----------
approved > 4 years : yellow
approved > 3 years : ..
approved > 2 years : ..
approved > 1 years : green

*/

// const colors = ['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']
const getDomain = (data = [], range = []) => {
    return [-5,-4,-3,-2,-1,0,1,2,3,4,5];
}

const getColorScale = (data, colors) => {
    
    return scaleThreshold()
        .domain([-5,-4,-3,-2,-1,0,1,2,3,4,5])
        .range(['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']);
    
    
}

const getDateDiff = (date) => {
    if(!date || date === 'NULL') return null;
    const date1 = new Date();
    const date2 = new Date(date);
    date2.setFullYear(date2.getFullYear() + 5);

    // console.log(date1.getFullYear(), date2.getFullYear(), date2.getFullYear() - date1.getFullYear() )
    return (Math.ceil( (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)) / 365)
};

const getGeoColors = ({geoid, data = [], columns = [], geoAttribute, paintFn, colors = [], ...rest}) => {
    if (!data?.length || !colors?.length) return {};

    const geoids = data.map(d => d[geoAttribute]);
    const stateFips = (geoid?.substring(0, 2) || geoids[0] || '00').substring(0, 2);
    const geoColors = {}
    const geoLayer = geoids[0]?.toString().length === 5 ? 'counties' : 'tracts';

    const diffData = data.map((d) => {
        return getDateDiff(d[columns?.[0]]) || -5
    })

    console.log('data diff', diffData)


    const colorScale = scaleThreshold()
        .domain([-5,-4,-3,-2,-1,0,1,2,3,4,5])
        .range(['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']);
    
    const domain = [-5,-4,-3,-2,-1,0,1,2,3,4,5]

    data.forEach(record => {
        const value = paintFn ? paintFn(record) : (getDateDiff(record[columns?.[0]]) || -5);
        geoColors[record[geoAttribute]] = value ? colorScale(value) : '#d0d0ce';
    })

    return {geoColors, domain, geoLayer};
}


const Edit = ({value, onChange, size}) => {

    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [dataSources, setDataSources] = useState(cachedData?.dataSources || []);
    const [dataSource, setDataSource] = useState(cachedData?.dataSource);
    const [version, setVersion] = useState(cachedData?.version);

    // const [attribute, setAttribute] = useState(/*cachedData?.attribute ||*/ 'plan_approval_date');
    const attribute = 'plan_approval_date';
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute);


    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [data, setData] = useState(cachedData?.data);
    const [mapFocus, setMapfocus] = useState(cachedData?.mapFocus);
    const [numColors, setNumColors] = useState(cachedData?.numColors || 5);
    const [shade, setShade] = useState(cachedData?.shade || 'Oranges');
    const [colors, setColors] = useState(['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']);
    const [title, setTitle] = useState(cachedData?.title);
    const [height, setHeight] = useState(cachedData?.height || 500);
    const stateView = 285; // need to pull this based on categories
    const category = 'County Descriptions';

    const options = JSON.stringify({
        filter: {...geoAttribute && {[`substring(${geoAttribute}::text, 1, ${geoid?.toString()?.length})`]: [geoid]}},
    });
    const lenPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'length'];
    const dataPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'databyIndex'];
    const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];
    const attributionPath = ['dama', pgEnv, 'views', 'byId', version, 'attributes'],
        attributionAttributes = ['source_id', 'view_id', 'version', '_modified_timestamp'];

    const navigate = useNavigate();

    useEffect(() => {
        async function getData() {
            setLoading(true);
            setStatus(undefined);

            // fetch data sources from categories that match passed prop
            await falcor.get(dataSourceByCategoryPath);
            setDataSources(get(falcor.getCache(), [...dataSourceByCategoryPath, 'value'], []))
            // fetch columns, data

            setLoading(false);

        }

        getData()
    }, []);

    useEffect(() => {
        const geoAttribute =
            (
                dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns  ||
                dataSources.find(ds => ds.source_id === dataSource)?.metadata ||
                [])
                .find(c => c.display === 'geoid-variable');
        geoAttribute?.name && setGeoAttribute(geoAttribute?.name);
    }, [dataSources, dataSource]);

    useEffect(() => {
        async function getData() {
            if(!attribute || !geoAttribute || !version || !dataSource) {
                !dataSource && setStatus('Please select a Datasource.');
                !version && setStatus('Please select a version.');
                !geoAttribute?.length && setStatus('No geo attribute found.');
                !attribute?.length && setStatus('Please select columns.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setStatus(undefined);
            // setTitle(metaData.title(hazardsMeta[hazard]?.name, attribute, consequence))

            await falcor.get(lenPath);
            const len = get(falcor.getCache(), lenPath, 0);

            await falcor.get([...dataPath, {from: 0, to: len - 1}, [geoAttribute, attribute]]);
            await falcor.get([...attributionPath, attributionAttributes]);

            setLoading(false);

        }

        getData()
    }, [dataSource, version, geoAttribute, attribute, geoid]);

    useEffect(() => {
        setData(Object.values(get(falcorCache, dataPath, {})));
    }, [falcorCache, dataSource, version, geoAttribute, attribute])

    useEffect(() => {
        async function getData() {
            if (!geoid || !attribute) {
                !geoid && setStatus('Please Select a Geography.');
                return Promise.resolve();
            } else {
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);

            const geomColTransform = [`st_asgeojson(st_envelope(ST_Simplify(geom, ${false && geoid?.toString()?.length === 5 ? `0.1` : `0.5`})), 9, 1) as geom`],
            geoIndices = {from: 0, to: 0},
            stateFips = get(data, [0, 'geoid']) || geoid?.substring(0, 2),
            geoPath = (view_id) =>
                ['dama', pgEnv, 'viewsbyId', view_id,
                    'options', JSON.stringify({filter: {geoid: [false && geoid?.toString()?.length === 5 ? geoid : stateFips.substring(0, 2)]}}),
                    'databyIndex'
                ];
            const geomRes = await falcor.get([...geoPath(stateView), geoIndices, geomColTransform]);
            const geom = get(geomRes, ["json", ...geoPath(stateView), 0, geomColTransform]);

            if (geom) {
                setMapfocus(get(JSON.parse(geom), 'bbox'));
            }

            setLoading(false);
        }

        getData()
    }, [geoid, numColors, shade, colors, attribute, dataSource]);

    const attributionData = get(falcorCache, attributionPath, {});

    const {geoColors, domain, geoLayer} =
        getGeoColors({geoid, data, columns: [attribute], geoAttribute, colors});

    // console.log('testing', geoColors, domain, geoLayer)

    const layerProps =
        useMemo(() => ({
            ccl: {
                data,
                geoColors,
                domain,
                mapFocus,
                colors,
                title,
                attribute,
                geoAttribute,
                dataSource,
                version,
                geoLayer,
                height,
                size,
                onClick: (layer, features) => {
                    return navigate(`/drafts/county/${features?.[0]?.properties?.geoid}`) && navigate(0)
                    // window.location = `/drafts/edit/county/${features?.[0]?.properties?.geoid}`
                },
                change: e => onChange(JSON.stringify({
                    ...e,
                    data,
                    geoColors,
                    domain,
                    dataSource,
                    version,
                    geoLayer,
                    geoid,
                    status,
                    attribute,
                    geoAttribute,
                    attributionData,
                    mapFocus,
                    numColors,
                    colors,
                    height
                }))
            }
        }), [geoid, attribute, colors, data, geoColors, height, dataSource, version, geoLayer]);

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 m-1'}>
                    Edit Controls
                    <ButtonSelector
                        label={'Data Source:'}
                        types={dataSources.map(ds => ({label: ds.name, value: ds.source_id}))}
                        type={dataSource}
                        setType={e => {
                            // setAttribute(undefined);
                            setGeoAttribute(undefined);
                            setVersion(undefined);
                            setData([]);

                            setDataSource(e);
                        }}
                    />
                    <VersionSelectorSearchable
                        source_id={dataSource}
                        view_id={version}
                        onChange={setVersion}
                        className={'flex-row-reverse'}
                    />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'}/>

                    {/*<div className={`flex justify-between`}>*/}
                    {/*    <label*/}
                    {/*        className={`shrink-0 pr-2 py-1 my-1 w-1/4`}*/}
                    {/*    >*/}
                    {/*        Attribute:*/}
                    {/*    </label>*/}
                    {/*    <select*/}
                    {/*        className={`bg-white w-full pl-3 rounded-md my-1`}*/}
                    {/*        value={attribute}*/}
                    {/*        onChange={e => setAttribute(e.target.value)}*/}
                    {/*    >*/}
                    {/*        <option value={undefined} key={''}>Please select an attribute</option>*/}
                    {/*        {*/}
                    {/*            (*/}
                    {/*                dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns  ||*/}
                    {/*                dataSources.find(ds => ds.source_id === dataSource)?.metadata ||*/}
                    {/*                [])*/}
                    {/*                .filter(c => ['data-variable', 'meta-variable'].includes(c.display))*/}
                    {/*                .map(c => <option  value={c.name} key={c.name}>{c.display_name || c.name}</option>)*/}
                    {/*        }*/}
                    {/*    </select>*/}
                    {/*</div>*/}
                    {/*<RenderColorPicker
                        title={'Colors: '}
                        numColors={numColors}
                        setNumColors={setNumColors}
                        shade={shade}
                        setShade={setShade}
                        colors={colors}
                        setColors={setColors}
                    />*/}
                    <ButtonSelector
                        label={'Size:'}
                        types={[{label: 'Small', value: 500}, {label: 'Medium', value: 700}, {
                            label: 'Large',
                            value: 900
                        }]}
                        type={height}
                        setType={e => {
                            setHeight(e)
                        }}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <React.Fragment>
                                <div className={`flex-none w-full p-1`} style={{height: `${height}px`}}>
                                    <RenderMap
                                        falcor={falcor}
                                        layerProps={layerProps}
                                        legend={{domain, range: colors, title, size}}
                                        layers={['Choropleth']}
                                    />
                                </div>
                                <Attribution baseUrl={baseUrl} attributionData={attributionData}/>
                            </React.Fragment>
                }
            </div>
        </div>
    )
}

Edit.settings = {
    hasControls: true,
    name: 'ElementEdit'
}

const View = ({value}) => {
    if (!value) return ''

    let data = typeof value === 'object' ?
        value['element-data'] :
        JSON.parse(value)
    const baseUrl = '/';
    const attributionData = data?.attributionData;

    return (
        <div className='relative w-full p-6'>
            {
                data?.status ?
                    <div className={'p-5 text-center'}>{data?.status}</div> :
                    <div className='h-80vh flex-1 flex flex-col'>
                        <img alt='Choroplath Map' src={get(data, ['img'])}/>
                        <Attribution baseUrl={baseUrl} attributionData={attributionData}/>
                    </div>
            }
        </div>
    )
}


export default {
    "name": 'Map: County Status',
    "type": 'Map',
    "EditComp": Edit,
    "ViewComp": View
}