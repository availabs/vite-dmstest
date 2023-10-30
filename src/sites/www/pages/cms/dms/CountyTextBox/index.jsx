import React, {useEffect, useId, useState} from "react"
import {Select} from '~/modules/avl-components/src'
import {isJson} from "~/utils/macros.jsx";
import {RenderCalloutBox} from "./components/RenderCalloutBox.jsx";
import {ButtonSelector} from "../../components/buttonSelector.jsx";
import { dmsDataTypes } from "~/modules/dms/src"
import get from "lodash/get.js";
import {pgEnv} from "~/utils/";
import {useFalcor} from "~/modules/avl-falcor/index.jsx";
import {Loading} from "~/utils/loading.jsx";
import VersionSelectorSearchable from "../../components/versionSelector/searchable.jsx";
import {RenderColumnControls} from "../../components/columnControls.jsx";
import GeographySearch from "../../components/geographySearch.jsx";

const getCountyData = async ({ falcor, pgEnv, geoid, setGeoName }) => {
    const countyViewId = 286

    const geoAttributesMapping = {'geoid': 'geoid', 'name': 'namelsad as name'},
        geoAttributes = Object.values(geoAttributesMapping),
        geoOptions = JSON.stringify({
            filter: {geoid: [geoid]}
        }),
        geoRoute = ['dama', pgEnv, 'viewsbyId', countyViewId, 'options', geoOptions]


    const geoRouteIndices = {from: 0, to:  0}
    const indexRes = await falcor.get([...geoRoute, 'databyIndex', geoRouteIndices, geoAttributes]);

    const geoData = Object.values(get(indexRes, ['json', ...geoRoute, 'databyIndex'], {}))
        .filter(county => county.geoid)
        .map(county => {
            // return {geoid: county.geoid, name: county[geoAttributesMapping.name]};
            return county[geoAttributesMapping.name];
        })

    setGeoName(geoData[0])
    return geoData[0]
}
const convertToEditorText = text => ({
    root: {
        "children": text.map(t => ({
            "children": [
                {
                    "detail": 0,
                    "format": 0,
                    "mode": "normal",
                    "style": "",
                    "text": t,
                    "type": 'text',
                    "version": 1
                }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "paragraph",
            "version": 1
        })),
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "root",
        "version": 1
    }
})
const RenderColorPicker = ({title, className, color, setColor}) => (
    <div className={className}>
        <label className={'shrink-0 pr-2 w-1/4'}>{title}</label>
        <input id={'background'} list="colors"
               className={'rounded-md shrink'}
               type={'color'} value={color} onChange={e => setColor(e.target.value)}/>
        <datalist id="colors">
            {
                [
                    // blues
                    '#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6','#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff',

                    // yellows
                    '#713f12', '#854d0e', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a', '#fef9c3', '#fefce8',


                ].map(c => <option>{c}</option>)
            }
        </datalist>
    </div>
)

const Edit = ({value, onChange}) => {
    const {falcor, falcorCache} = useFalcor();
    const [id, setId] = useState(1);
    const cachedData = value && isJson(value) ? JSON.parse(value) : {}
    const emptyTextBlock = {text: '', size: '4xl', color: '000000'};
    const [bgColor, setBgColor] = useState(cachedData?.bgColor || 'rgba(0,0,0,0)');
    const [text, setText] = useState(cachedData?.text || value || emptyTextBlock);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [dataSources, setDataSources] = useState(cachedData?.dataSources || []);
    const [dataSource, setDataSource] = useState(cachedData?.dataSource);
    const [version, setVersion] = useState(cachedData?.version || 850);
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute || 'county');
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36001');
    const [geoName, setGeoName] = useState(cachedData?.geoid || 'Albany County');
    const [visibleCols, setVisibleCols] = useState(cachedData?.visibleCols || []);

    const category = 'County Descriptions ';

    const options = ({geoAttribute, geoName}) => JSON.stringify({
        filter: {
            ...geoAttribute && {[geoAttribute]: [geoName]},
        }
    });

    const lenPath = options => ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'length'];
    const dataPath = options => ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'databyIndex'];
    const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];
    const attributionPath = ['dama', pgEnv, 'views', 'byId', version, 'attributes'],
        attributionAttributes = ['source_id', 'view_id', 'version', '_modified_timestamp'];


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
            (dataSources
                .find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                .find(c => c.display === 'geoid-variable');
        geoAttribute?.name && setGeoAttribute(geoAttribute?.name);
    }, [dataSources, dataSource]);

    const LexicalComp = dmsDataTypes.lexical.EditComp;

    useEffect(() => {
        async function getData() {
            if(!version || !dataSource) {
                !dataSource && setStatus('Please select a Datasource.');
                !version && setStatus('Please select a version.');

                setLoading(false);
                return;
            }

            setLoading(true);
            setStatus(undefined);

            const geoName = await getCountyData({falcor, pgEnv, geoid, setGeoName});

            await falcor.get(lenPath(options({geoAttribute, geoName})));
            const len = Math.min(
                get(falcor.getCache(), lenPath(options({geoAttribute, geoName})), 0),
                1);

            await falcor.get(
                [...dataPath(options({geoAttribute, geoName})),
                    {from: 0, to: len - 1}, visibleCols]);
            await falcor.get([...attributionPath, attributionAttributes]);

            setLoading(false);
        }

        getData()
    }, [dataSource, version, geoid, geoAttribute, visibleCols]);

    useEffect(() => {
        if(!loading){
            setId(id+1)
            const textToSave = visibleCols.map(vc =>
                Object.values(
                    get(falcorCache, dataPath(options({geoAttribute, geoName})), {})
                )[0]?.[vc] || '');
            setText(convertToEditorText(textToSave))
            onChange(
                JSON.stringify({
                    bgColor,
                    text: convertToEditorText(textToSave),
                    geoAttribute,
                    geoid,
                    visibleCols
                })
            )
        }
    }, [falcorCache, geoAttribute, geoid, visibleCols])

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
                            setVisibleCols([])
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

                    <RenderColorPicker title={'Background: '}
                                       className={'w-full flex flex-row text-sm items-center'}
                                       color={bgColor} setColor={setBgColor}/>

                    <RenderColumnControls
                        cols={
                            (dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || [])
                                .filter(c => ['data-variable', 'meta-variable', 'geoid-variable'].includes(c.display))
                                .map(c => c.name)
                        }
                        metadata={dataSources.find(ds => ds.source_id === dataSource)?.metadata?.columns || []}
                        // anchorCols={anchorCols}
                        visibleCols={visibleCols}
                        setVisibleCols={setVisibleCols}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? status :
                            <LexicalComp value={text}
                                         onChange={onChange}
                                         bgColor={bgColor}
                                         id={id}
                                         key={id}
                            />
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
    const dataOrValue = data?.text || value;

    if(!dataOrValue ||
        (dataOrValue?.root?.children?.length === 1 && dataOrValue?.root?.children?.[0]?.children?.length === 0) ||
        (dataOrValue?.root?.children?.length === 0)
    ) return null;

    const LexicalComp = dmsDataTypes.lexical.ViewComp;
    return (
        <div>
            <LexicalComp value={dataOrValue} bgColor={data?.bgColor} />
        </div>
    )
}


export default {
    "name": 'County Text Box',
    "EditComp": Edit,
    "ViewComp": View
}