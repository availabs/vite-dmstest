import React, {useEffect, useMemo, useState} from "react";
import get from "lodash/get";
import {useFalcor} from '~/modules/avl-falcor';
import {pgEnv} from "~/utils/";
import {isJson} from "~/utils/macros.jsx";
import {RenderBuildingsTable} from "./components/RenderBuildingsTable.jsx";
import VersionSelectorSearchable from "../../components/versionSelector/searchable.jsx";
import GeographySearch from "../../components/geographySearch.jsx";
import {Loading} from "~/utils/loading.jsx";
import {RenderColumnControls} from "../../components/columnControls.jsx";
import {HazardSelectorSimple} from "../../components/HazardSelector/hazardSelectorSimple.jsx";
import {ButtonSelector} from "../../components/buttonSelector.jsx";

const isValid = ({groupBy, fn, columnsToFetch}) => {
    const fns = columnsToFetch.map(ctf => ctf.split(' as')[0]);

    if(groupBy.length){
        return fns.filter(ctf =>
            !ctf.includes('sum') &&
            !ctf.includes('array_to_string') &&
            !ctf.includes('count')
        ).length === groupBy.length
    }else{
        return fns.filter(ctf =>
            ctf.includes('sum') &&
            ctf.includes('array_to_string') &&
            ctf.includes('count')
        ).length === 0
    }
}

const parseJson = str => {
    try {
        return JSON.parse(str);
    }catch (e){
        return {}
    }
}

const Edit = ({value, onChange}) => {
    const {falcor, falcorCache} = useFalcor();

    let cachedData = value && isJson(value) ? JSON.parse(value) : {};
    const baseUrl = '/';

    const [dataSources, setDataSources] = useState(cachedData?.dataSources || []);
    const [dataSource, setDataSource] = useState(cachedData?.dataSource);
    const [version, setVersion] = useState(cachedData?.version);
    const [geoAttribute, setGeoAttribute] = useState(cachedData?.geoAttribute);

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(cachedData?.status);
    const [geoid, setGeoid] = useState(cachedData?.geoid || '36');
    const [filters, setFilters] = useState(cachedData?.filters || {});
    const [filterValue, setFilterValue] = useState(cachedData?.filterValue || {});
    const [visibleCols, setVisibleCols] = useState(cachedData?.visibleCols || []);
    const [pageSize, setPageSize] = useState(cachedData?.pageSize || 5);
    const [sortBy, setSortBy] = useState(cachedData?.sortBy || {});
    const [groupBy, setGroupBy] = useState(cachedData?.groupBy || []);
    const [notNull, setNotNull] = useState(cachedData?.notNull || []);
    const [fn, setFn] = useState(cachedData?.fn || []);
    const [metaLookupByViewId, setMetaLookupByViewId] = useState({});

    const category = 'Buildings';

    const options = JSON.stringify({
        aggregatedLen: Boolean(groupBy.length),
        filter: {
            ...geoAttribute && {[`substring(${geoAttribute}::text, 1, ${geoid?.length})`]: [geoid]},
        },
        exclude: {
            ...notNull.length && notNull.reduce((acc, col) => ({...acc, [col]: ['null']}) , {}) // , '', ' ' error out for numeric columns.
        },
        groupBy: groupBy,
    });
    const lenPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'length'];
    const dataPath = ['dama', pgEnv, 'viewsbyId', version, 'options', options, 'databyIndex'];
    const dataSourceByCategoryPath = ['dama', pgEnv, 'sources', 'byCategory', category];
    const attributionPath = ['dama', pgEnv, 'views', 'byId', version, 'attributes'],
          attributionAttributes = ['source_id', 'view_id', 'version', '_modified_timestamp'];

    // const columnsToFetch = useMemo(() => visibleCols.map(vc => vc), [visibleCols, fn]);

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
                .find(ds => ds.source_id === dataSource)?.metadata || [])
                .find(c => c.display === 'geoid-variable');
        geoAttribute?.name && setGeoAttribute(geoAttribute?.name);
    }, [dataSources, dataSource]);

    useEffect(() => {
        async function getData() {
            if(!visibleCols?.length || !version || !dataSource) {
                !dataSource && setStatus('Please select a Datasource.');
                !version && setStatus('Please select a version.');
                !visibleCols?.length && setStatus('Please select columns.');

                setLoading(false);
                return;
            }

            if(!isValid({groupBy, fn, columnsToFetch: visibleCols.map(vc => fn[vc] ? fn[vc] : vc)})){
                setStatus('Please make appropriate grouping selections.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setStatus(undefined);
            await falcor.get(lenPath);
            const len = Math.min(get(falcor.getCache(), lenPath, 0), 1000);

            await falcor.get([...dataPath, {from: 0, to: len - 1}, visibleCols.map(vc => fn[vc] ? fn[vc] : vc)]);
            await falcor.get([...attributionPath, attributionAttributes]);

            setLoading(false);
        }

        getData()
    }, [dataSource, version, geoid, visibleCols, fn, groupBy, notNull, geoAttribute]);

    useEffect(() => {
        // make this a general purpose util?
        async function getMeta(){
            const metadata = dataSources.find(ds => ds.source_id === dataSource)?.metadata;
            const metaViewIdLookupCols =
                metadata?.filter(md => visibleCols.includes(md.name) && ['meta-variable', 'geoid-variable'].includes(md.display) && md.meta_lookup);

            if(metaViewIdLookupCols?.length){
                const data =
                    await metaViewIdLookupCols
                    .filter(md => parseJson(md.meta_lookup)?.view_id)
                    .reduce(async (acc, md) => {
                        const prev = await acc;
                            const metaLookup = parseJson(md.meta_lookup);
                            const options = JSON.stringify({
                                aggregatedLen: metaLookup.aggregatedLen,
                                filter: {
                                    ...metaLookup?.geoAttribute && {[`substring(${metaLookup.geoAttribute}::text, 1, ${geoid?.length})`]: [geoid]},
                                    year: [2020]
                                }
                            });
                            const attributes = metaLookup.attributes;
                            const keyAttribute = metaLookup.keyAttribute;

                            const lenPath = ['dama', pgEnv, 'viewsbyId', metaLookup.view_id, 'options', options, 'length'];

                            const lenRes = await falcor.get(lenPath);
                            const len = get(lenRes, ['json', ...lenPath], 0);

                            if(!len) return Promise.resolve();

                            const dataPath = ['dama', pgEnv, 'viewsbyId', metaLookup.view_id, 'options', options, 'databyIndex'];
                            const dataRes = await falcor.get([...dataPath, {from: 0, to: len - 1}, attributes]);
                            const data = Object.values(get(dataRes, ['json', ...dataPath], {}))
                                .reduce((acc, d) => (
                                    {
                                        ...acc,
                                        ...{[d[keyAttribute]]: {...attributes.reduce((acc, attr) => ({...acc, ...{[attr]: d[attr]}}), {})}}
                                    }
                                ), {})

                            return {...prev, ...{[md.name]: data}};
                        }, {});
                setMetaLookupByViewId(data)
            }
        }

        getMeta();
    }, [dataSource, visibleCols]);

    const metadata = dataSources.find(ds => ds.source_id === dataSource)?.metadata;

    const data = useMemo(() => {
        const metaLookupCols =
            metadata?.filter(md =>
                visibleCols.includes(md.name) &&
                ['meta-variable', 'geoid-variable'].includes(md.display)
            );

        if(metaLookupCols?.length){
            return Object.values(get(falcorCache, dataPath, {}))
                .map(row => {
                    metaLookupCols.forEach(mdC => {
                        const currentMetaLookup = parseJson(mdC.meta_lookup);

                        if(currentMetaLookup?.view_id){
                            const currentViewIdLookup = metaLookupByViewId[mdC.name] || [];
                            row[mdC.name] = currentViewIdLookup[row[mdC.name]]?.name || row[mdC.name];
                        }else{
                            row[mdC.name] = currentMetaLookup[row[mdC.name]] || row[mdC.name];
                        }
                    })
                    return row;
                })
        }

        return Object.values(get(falcorCache, dataPath, {}))

        }, [falcorCache, metaLookupByViewId, metadata, visibleCols]);

    const attributionData = get(falcorCache, attributionPath, {});
    // console.log('data?', data, Object.values(get(falcorCache, dataPath, {})))
    const columns =
        visibleCols
            .map(c => metadata.find(md => md.name === c))
            .filter(c => c)
            .map(col => {
                return {
                    Header: col.display_name || col.name,
                    accessor: fn[col.name] || col.name,
                    align: col.align || 'right',
                    width: col.width || '15%',
                    filter: col.filter || filters[col.name],
                    info: col.desc,
                    ...col,
                    type: fn[col.name]?.includes('array_to_string') ? 'string' : col.type
                }
            });

    useEffect(() => {
            if (!loading) {
                onChange(JSON.stringify(
                    {
                        attributionData,
                        status,
                        geoid,
                        pageSize, sortBy, groupBy, fn, notNull,
                        data, columns, filters, filterValue, visibleCols, geoAttribute,
                        dataSource, dataSources, version
                    }))
            }
        },
        [attributionData, status, geoid, pageSize, sortBy, groupBy, fn, notNull,
            data, columns, filters, filterValue, visibleCols, geoAttribute,
            dataSource, dataSources, version
        ]);

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

                    <RenderColumnControls
                        cols={
                           (dataSources.find(ds => ds.source_id === dataSource)?.metadata || [])
                               .filter(c => ['data-variable', 'meta-variable', 'geoid-variable'].includes(c.display))
                               .map(c => c.name)
                        }
                        metadata={dataSources.find(ds => ds.source_id === dataSource)?.metadata || []}
                        // anchorCols={anchorCols}
                        visibleCols={visibleCols}
                        setVisibleCols={setVisibleCols}
                        filters={filters}
                        setFilters={setFilters}
                        filterValue={filterValue}
                        setFilterValue={setFilterValue}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        groupBy={groupBy}
                        setGroupBy={setGroupBy}
                        fn={fn}
                        setFn={setFn}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        notNull={notNull}
                        setNotNull={setNotNull}
                    />
                </div>
                {
                    loading ? <Loading/> :
                        status ? <div className={'p-5 text-center'}>{status}</div> :
                            <RenderBuildingsTable
                                geoid={geoid}
                                data={data}
                                columns={columns}
                                filterValue={filterValue}
                                pageSize={pageSize}
                                sortBy={sortBy}
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
    if (!value) return ''

    let data = typeof value === 'object' ?
        value['element-data'] :
        JSON.parse(value)
    return (
        <div className='relative w-full p-6'>
            {
                data?.status ?
                    <div className={'p-5 text-center'}>{data?.status}</div> :
                    <RenderBuildingsTable {...data} baseUrl={'/'}/>
            }
        </div>
    )
}


export default {
    "name": 'Table: Buildings',
    "type": 'Table',
    "EditComp": Edit,
    "ViewComp": View
}