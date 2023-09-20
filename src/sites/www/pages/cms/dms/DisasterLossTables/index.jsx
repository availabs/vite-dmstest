import React, {useEffect, useState} from "react";
import get from "lodash/get";
import { useFalcor } from '~/modules/avl-falcor';
import { pgEnv } from "~/utils/";
import { isJson } from "~/utils/macros.jsx";
import { RenderDisasterLossTable } from "./components/RenderDisasterLossTable.jsx";
import VersionSelectorSearchable from "../../components/versionSelector/searchable.jsx";
import GeographySearch from "../../components/geographySearch.jsx";
import DisasterSearch from "../../components/disasterSearch.jsx";
import { Loading } from "~/utils/loading.jsx";
import {metaData} from "./config.js";
import {RenderColumnControls} from "../../components/columnControls.jsx/";
import {ButtonSelector} from "../../components/buttonSelector.jsx";

const Edit = ({value, onChange}) => {
    const { falcor, falcorCache } = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const ealSourceId = 343;
    const [ealViewId, setEalViewId] = useState(cachedData?.ealViewId || 818);
    const [disasterNumber, setDisasterNumber] = useState(cachedData?.disasterNumber);
    const [countyView, setCountyView] = useState();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [type, setType] = useState(cachedData?.type || 'ihp');
    const [typeId, setTypeId] = useState(cachedData?.typeId);
    const [filters, setFilters] = useState(cachedData?.filters || {});
    const [filterValue, setFilterValue] = useState(cachedData?.filterValue || {});
    const [visibleCols, setVisibleCols] = useState(cachedData?.visibleCols || []);
    const [pageSize, setPageSize] = useState(cachedData?.pageSize || 5);
    const [sortBy, setSortBy] = useState(cachedData?.sortBy || {});

    const dependencyPath = (view_id) => ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id];
    const
        geoNamesOptions = JSON.stringify({
            ...geoid && { filter: { [`substring(geoid, 1, ${geoid?.length})`]: [geoid] } }
        }),
        geoNamesPath = view_id => ["dama", pgEnv, "viewsbyId", view_id, "options", geoNamesOptions];

    const attributionPath = ['dama', pgEnv, 'views', 'byId', ealViewId, 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']];

    const geoOptions = JSON.stringify(metaData[type]?.options({disasterNumber, geoid})),
        geoPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options"];

    useEffect( () => {
        async function getData(){
            if(!geoid || !type ){
                !geoid && setStatus('Please Select a Geography.');
                !type && setStatus('Please Select a Type.');
                // !disasterNumber && setStatus('Please Select a Disaster.');
                setLoading(false);
                return Promise.resolve()
            }else{
                setStatus(undefined)
            }
            setLoading(true);
            setStatus(undefined);
            setFilters({...filters,
            ...{[Object.keys(metaData[type]?.attributes({geoid, disasterNumber}) || {})[0]]: 'text'}})
            return falcor.get(dependencyPath(ealViewId)).then(async res => {

                const deps = get(res, ["json", ...dependencyPath(ealViewId), "dependencies"]);

                const countyView = deps.find(dep => dep.type === "tl_county");
                setCountyView(countyView.view_id);

                const geoNameLenRes = await falcor.get([...geoNamesPath(countyView.view_id), "length"]);
                const geoNameLen = get(geoNameLenRes, ["json", ...geoNamesPath(countyView.view_id), "length"], 0);

                if (geoNameLen) {
                    await falcor.get([...geoNamesPath(countyView.view_id), "databyIndex", {
                        from: 0,
                        to: geoNameLen - 1
                    }, ["geoid", "namelsad"]]);
                }
                const tmpHMGPViews = {
                    'hmgp summaries': 725,
                    'hmgp projects': 798,
                    'hmgp properties': 729
                }
                const typeId = tmpHMGPViews[type] ? {view_id: tmpHMGPViews[type]} : deps.find(dep => dep.type === metaData[type]?.type);

                if(!typeId) {
                    setLoading(false)
                    setStatus('This component only supports EAL versions that use Fusion data.')
                    return Promise.resolve();
                }
                setTypeId(typeId.view_id);

                const lenRes = await falcor.get([...geoPath(typeId.view_id), geoOptions, 'length']);
                const len = Math.min(get(lenRes, ['json', ...geoPath(typeId.view_id), geoOptions, 'length'], 0), 100),
                    indices = { from: 0, to: len - 1 };
                if(!len) setLoading(false);

                await falcor.get(
                    [...geoPath(typeId.view_id), geoOptions, 'databyIndex', indices, Object.values(metaData[type]?.attributes({geoid, disasterNumber}))],
                    attributionPath
                );

                setLoading(false);
            })
        }

        getData()
    }, [geoid, ealViewId, disasterNumber, type]);

    const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', ealViewId, 'attributes'], {});

    const geoNames = Object.values(get(falcorCache, [...geoNamesPath(countyView), "databyIndex"], {}));
    const  dataModifier = data => {
        data.map(row => {
            const geoidCol = metaData[type].geoidCol || 'geoid';
            const geoName = geoNames?.find(gn => gn.geoid === row[geoidCol])?.namelsad;
            row[geoidCol] =  geoName || row[geoidCol];
        })
        return data
    };
    let data = Object.values(get(falcorCache, [...geoPath(typeId), geoOptions, 'databyIndex'], {}));

    metaData[type]?.mapGeoidToName && dataModifier && dataModifier(data);

    let columns =
        [...metaData[type]?.anchorCols, ...visibleCols]
            .map((col, i) => {
                const mappedName = metaData[type]?.attributes({geoid, disasterNumber})[col];
                return {
                    Header:  col,
                    accessor: mappedName,
                    align: metaData[type]?.textCols?.includes(col) ? 'left' : 'right',
                    filter: filters[col]
                }
            });

    useEffect(() => {
            if(!loading){
                onChange(JSON.stringify(
                    {
                        ealViewId,
                        status,
                        geoid,
                        attributionData,
                        disasterNumber,
                        pageSize, sortBy,
                        data, columns, filters, filterValue, visibleCols, type, typeId
                    }))
            }
        },
        [status, ealViewId, geoid, attributionData, disasterNumber, pageSize, sortBy,
            data, columns, filters, filterValue, visibleCols, type, typeId]);

    return (
        <div className='w-full'>
            <div className='relative'>
                <div className={'border rounded-md border-blue-500 bg-blue-50 p-2 text-sm'}>
                    Edit Controls
                    <VersionSelectorSearchable
                        source_id={ealSourceId}
                        view_id={ealViewId}
                        onChange={setEalViewId}
                        className={'flex-row-reverse'}
                    />
                    <GeographySearch value={geoid} onChange={setGeoid} className={'flex-row-reverse'} />
                    <DisasterSearch
                        view_id={ealViewId}
                        value={disasterNumber}
                        geoid={geoid}
                        onChange={setDisasterNumber}
                        showAll={true}
                        className={'flex-row-reverse'}
                    />
                    <ButtonSelector
                        label={'Type:'}
                        types={Object.keys(metaData)}
                        type={type}
                        setType={e => {
                            setType(e)
                            setVisibleCols([])
                            setFilters({})
                        }}
                    />
                    <RenderColumnControls
                        cols={Object.keys(metaData[type]?.attributes({geoid, disasterNumber}) || {})}
                        anchorCols={metaData[type]?.anchorCols}
                        visibleCols={visibleCols}
                        setVisibleCols={setVisibleCols}
                        filters={filters}
                        setFilters={setFilters}
                        filterValue={filterValue}
                        setFilterValue={setFilterValue}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                    />
                </div>
                {
                    loading ? <Loading /> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                                <RenderDisasterLossTable
                                    geoid={geoid}
                                    data={data}
                                    columns={columns}
                                    pageSize={pageSize}
                                    sortBy={sortBy}
                                    filterValue={filterValue}
                                    title={type}
                                    type={type}
                                    attributionData={attributionData}
                                    baseUrl={baseUrl}
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
    if(!value) return ''

    let data = typeof value === 'object' ?
        value['element-data'] : 
        JSON.parse(value)
    return (
        <div className='relative w-full p-6'>
            {
                data?.status ?
                    <div className={'p-5 text-center'}>{data?.status}</div> :
                    <RenderDisasterLossTable {...data} baseUrl={'/'}/>
            }
        </div>
    )           
}


export default {
    "name": 'Table: FEMA Disaster Loss by Program',
    "type": 'Table',
    "EditComp": Edit,
    "ViewComp": View
}