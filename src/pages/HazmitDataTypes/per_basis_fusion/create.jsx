import React from 'react'
import { checkApiResponse, getDamaApiRoutePrefix, getSrcViews } from "../utils/DamaControllerApi";
import { RenderVersions, range } from "../utils/macros"
import {useNavigate} from "react-router-dom";

import { DamaContext } from "~/pages/DataManager/store";

const CallServer = async ({rtPfx, baseUrl, source, startYear, endYear, newVersion, navigate,
                              viewNCEI={}, viewFusion={}, viewNRI={}}) => {
    const viewMetadata = [viewNCEI.view_id, viewFusion.view_id, viewNRI.view_id];

    const url = new URL(
        `${rtPfx}/hazard_mitigation/pbFusionLoader`
    );
    
    url.searchParams.append("table_name", 'per_basis_fusion');
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);
    url.searchParams.append("startYear", startYear);
    url.searchParams.append("endYear", endYear);
    
    url.searchParams.append("ncei_schema", viewNCEI.table_schema);
    url.searchParams.append("ncei_table", viewNCEI.table_name);
    url.searchParams.append("fusion_schema", viewFusion.table_schema);
    url.searchParams.append("fusion_table", viewFusion.table_name);
    url.searchParams.append("nri_schema", viewNRI.table_schema);
    url.searchParams.append("nri_table", viewNRI.table_name);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    navigate(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
}

const Create = ({ source, newVersion, baseUrl }) => {
    const navigate = useNavigate();
    const { pgEnv } = React.useContext(DamaContext)
    // selected views/versions
    const [startYear, setStartYear] = React.useState(1996);
    const [endYear, setEndYear] = React.useState(2019);
    const years = range(1996, new Date().getFullYear()).reverse();

    const [viewNCEI, setViewNCEI] = React.useState();
    const [viewFusion, setViewFusion] = React.useState();
    const [viewNRI, setViewNRI] = React.useState();
    // all versions
    const [versionsNCEI, setVersionsNCEI] = React.useState({sources:[], views: []});
    const [versionsFusion, setVersionsFusion] = React.useState({sources:[], views: []});
    const [versionsNRI, setVersionsNRI] = React.useState({sources:[], views: []});

    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    React.useEffect(() => {
        async function fetchData() {
           
            await getSrcViews({rtPfx, setVersions: setVersionsNCEI,  type: 'ncei_storm_events_enhanced'});
            await getSrcViews({rtPfx, setVersions: setVersionsFusion,  type: 'fusion'});
            await getSrcViews({rtPfx, setVersions: setVersionsNRI,  type: 'nri'});
        }
        fetchData();
    }, [rtPfx])

    return (
        <div className='w-full'>
            {RenderVersions({value: startYear, setValue: setStartYear, versions: [startYear], type: 'Start Year'})}
            {RenderVersions({value: endYear, setValue: setEndYear, versions: years, type: 'End Year'})}
            {RenderVersions({value: viewNCEI, setValue: setViewNCEI, versions: versionsNCEI, type: 'NCEI Storm Events'})}
            {RenderVersions({value: viewFusion, setValue: setViewFusion, versions: versionsFusion, type: 'Fusion'})}
            {RenderVersions({value: viewNRI, setValue: setViewNRI, versions: versionsNRI, type: 'NRI'})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() =>
                    CallServer(
                        {rtPfx, baseUrl, source,
                            startYear, endYear,
                            viewNCEI: versionsNCEI.views.find(v => v.view_id === parseInt(viewNCEI)),
                            viewFusion: versionsFusion.views.find(v => v.view_id === parseInt(viewFusion)),
                            viewNRI: versionsNRI.views.find(v => v.view_id === parseInt(viewNRI)),
                            newVersion, navigate
                        })}>
                Add New Source
            </button>
        </div>
    )
}

export default Create