import cloneDeep from "lodash/cloneDeep.js";
import {dmsDataEditor} from "../../../../../../../modules/dms/src/index.js";
import {parseJSON} from "./parseJSON.js";

import ComponentRegistry from "../../../../cms/dms/ComponentRegistry.js";

export const generatePages = async ({
                                           item, url, destination, id_column, dataRows, falcor
}) => {
    // const disaster_numbers = ['4020', '4031']
    const idColAttr = dataRows.map(d => d[id_column.name]).filter(d => d).slice(0, 2);

    await idColAttr.reduce(async(acc, idColAttrVal) => {
        await acc;

        const dataControls = item.data_controls;
        let dataFetchers = item.sections.map(s => s.id)
            .map(section_id => {
                let section = item.sections.filter(d => d.id === section_id)?.[0]  || {}
                let data = parseJSON(section?.element?.['element-data']) || {}
                let type = section?.element?.['element-type'] || ''
                let comp = ComponentRegistry[type] || {}
                let controlVars = (comp?.variables || []).reduce((out,curr) => {
                    out[curr.name] = data[curr.name]
                    return out
                },{})

                let updateVars = Object.keys(dataControls?.sectionControls?.[section_id] || {}) // check for id_col
                    .reduce((out,curr) => {
                        const attrName = dataControls?.sectionControls?.[section_id]?.[curr]?.name || dataControls?.sectionControls?.[section_id]?.[curr];

                        out[curr] = attrName === id_column.name ? idColAttrVal :
                            (
                                dataControls?.active_row?.[attrName] ||
                                dataControls?.active_row?.[attrName] ||
                                null
                            )
                        return out
                    },{})

                let args = {...controlVars, ...updateVars}
                return comp?.getData ? comp.getData(args,falcor).then(data => ({section_id, data})) : ({section_id, data})
            }).filter(d => d)


        let updates = await Promise.all(dataFetchers);
        console.log('updates', updates)
        if(updates.length > 0) {
            let newSections = cloneDeep(item.sections)
            const sectionsToUpload = updates.map(({section_id, data}) => {
                let section = newSections.filter(d => d.id === section_id)?.[0]  || {}
                section.element['element-data'] = JSON.stringify(data);
                section.element['template-section-id'] = section_id; // to update sections in future
                delete section.id;
                return section;
            })

            // genetate
            const app = 'dms-site'
            const type = destination || 'docs-play' // defaults to play
            const sectionType = 'cms-section'

            const sectionConfig = {format: {app, type: sectionType}};
            const pageConfig = {format: {app, type}};

            //create all sections first, get their ids and then create the page.
            const newSectionIds = await Promise.all(sectionsToUpload.map((section) => dmsDataEditor(sectionConfig, section)));

            const newPage = {
                id_column_value: idColAttrVal,
                template_id: item.id,
                hide_in_nav: 'true', // not pulling though?
                url_slug: `${url || id_column.name}/${idColAttrVal}`,
                title: `generated by script for ${id_column.name} ${idColAttrVal}`,
                sections: newSectionIds.map(sectionRes => ({
                    "id": sectionRes.id,
                    "ref": "dms-site+cms-section"
                }))
            }
            const resPage = await dmsDataEditor(pageConfig, newPage);

            console.log('created', resPage)

        }

    }, Promise.resolve())
}