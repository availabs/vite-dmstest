import {RenderHazardStatBox} from "./RenderHazardStatBox.jsx";
import React from "react";
import {hazardsMeta} from "../../../../../../../utils/colors.jsx";
import {Link} from "react-router-dom";
import {formatDate} from "../../../../../../../utils/macros.jsx";
import get from "lodash/get.js";
import {Attribution} from "../../../components/attribution.jsx";

export const RenderGridOrBox = ({visibleCols = [], hazard, hazardPercentileArray= [], size, isTotal, type, geoid, attributionData, baseUrl}) => (
    <>
            {
                    type === 'grid' ?
                        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sxl:grid-cols-6 gap-2 mt-10`}>
                                {
                                        Object.keys(hazardsMeta)
                                            .sort((a, b) => hazardsMeta[a].name.localeCompare(hazardsMeta[b].name))
                                            .map(key => (
                                                <div key={key}>
                                                    <RenderHazardStatBox
                                                        visibleCols={visibleCols}
                                                        hazard={key}
                                                        statePercentile={hazardPercentileArray.find(h => h.key === key)?.statePercentile}
                                                        nationalPercentile={hazardPercentileArray.find(h => h.key === key)?.nationalPercentile}
                                                        hazardPercentileArray={hazardPercentileArray}
                                                        hazardPercentile={hazardPercentileArray.find(h => h.key === key)?.value}
                                                        actualLoss={hazardPercentileArray.find(h => h.key === key)?.actualLoss}
                                                        exposure={hazardPercentileArray.find(h => h.key === key)?.exposure}
                                                        frequency={hazardPercentileArray.find(h => h.key === key)?.frequency}
                                                        numEvents={hazardPercentileArray.find(h => h.key === key)?.numEvents}
                                                        numSevereEvents={hazardPercentileArray.find(h => h.key === key)?.numSevereEvents}
                                                        numFEMADeclared={hazardPercentileArray.find(h => h.key === key)?.numFEMADeclared}
                                                        deaths={hazardPercentileArray.find(h => h.key === key)?.deaths}
                                                        injuries={hazardPercentileArray.find(h => h.key === key)?.injuries}
                                                        geoid={geoid}
                                                        isTotal={false}
                                                        size={size}
                                                        eal={hazardPercentileArray.find(h => h.key === key)?.eal}
                                                    />
                                                </div>
                                            ))
                                }
                        </div> :
                        <RenderHazardStatBox
                            visibleCols={visibleCols}
                            hazard={hazard === 'total' ? '' : hazard}
                            statePercentile={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.statePercentile}
                            nationalPercentile={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.nationalPercentile}
                            hazardPercentileArray={hazardPercentileArray}
                            hazardPercentile={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.value}
                            actualLoss={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.actualLoss}
                            exposure={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.exposure}
                            frequency={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.frequency}
                            numEvents={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.numEvents}
                            numSevereEvents={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.numSevereEvents}
                            numFEMADeclared={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.numFEMADeclared}
                            deaths={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.deaths}
                            injuries={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.injuries}
                            geoid={geoid}
                            isTotal={isTotal}
                            size={size}
                            eal={hazardPercentileArray.filter(h => h.key === hazard || hazard === 'total')[0]?.eal}
                        />
            }
        <Attribution baseUrl={baseUrl} attributionData={attributionData} />
    </>
)