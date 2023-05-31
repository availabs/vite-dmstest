import React, {useMemo} from "react";
import {fnumIndex} from "~/utils/macros.jsx";
import {Table} from "~/modules/avl-components/src/index.js";
import {Link} from "react-router-dom";
import {formatDate} from "~/utils/macros.jsx";
import {cellFormat} from '../utils.jsx'

export const RenderDisasterLossTable = ({ data, columns, title, striped, attributionData, baseUrl, type }) => {
    console.log('data, col', data, columns)
   return (
       <div className={'py-5 flex flex-col'}>
           <label key={title} className={"text-sm float-left capitalize"}> {title} </label>
           <>
               {
                   data?.length > 0 && columns?.length > 0 && (
                       <Table
                           columns={
                               columns.map(c =>( {...c, ...{Cell: cell => cellFormat(cell, type, c.Header)}}))
                       }
                           data={data}
                           sortBy={'Year'}
                           pageSize={5}
                           striped={striped}
                       />
                   )
               }
           </>
           <div className={'flex flex-row text-xs text-gray-700 p-1'}>
               <label>Attribution:</label>
               <div className={'flex flex-col pl-1'}>
                   <Link to={`/${baseUrl}/source/${ attributionData?.source_id }/versions/${attributionData?.view_id}`}>
                       { attributionData?.version } ({formatDate(attributionData?._modified_timestamp?.value)})
                   </Link>
               </div>
           </div>
       </div>
   )
};