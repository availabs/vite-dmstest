import React, {useMemo} from "react";
import {fnumIndex} from "~/utils/macros.jsx";
import {Table} from "../../../../../../../modules/avl-components/src/index.js";
import {Link} from "react-router-dom";
import {formatDate} from "~/utils/macros.jsx";
import {cellFormat} from '../utils.jsx'
import {Attribution} from "../../../components/attribution.jsx";

export const RenderDisasterLossTable = ({ data, columns, pageSize, sortBy={}, title, striped, attributionData, baseUrl, type }) => {
    const sortColRaw = columns.find(c => c.Header === Object.keys(sortBy)?.[0])?.accessor;
   return (
       <div className={'py-5 flex flex-col'}>
               {
                   data?.length > 0 && columns?.length > 0 && (
                       <Table
                           columns={
                               columns.map(c =>( {...c, ...{Cell: cell => cellFormat(cell, type, c.Header)}}))
                       }
                           data={data}
                           initialPageSize={pageSize}
                           pageSize={pageSize}
                           striped={striped}
                           sortBy={sortColRaw}
                           sortOrder={Object.values(sortBy)?.[0] || 'asc'}
                       />
                   )
               }
           <Attribution baseUrl={baseUrl} attributionData={attributionData} />
       </div>
   )
};