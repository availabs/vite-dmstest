import {hazardsMeta} from "~/utils/colors.jsx";

export const metaData = {
    type: 'nri',
    attributes: {
        Frequency: 'afreq',
        Exposure: 'exp',
        EAL: 'eal'
    },
    consequences: {
        Buildings: 'b',
        Crop: 'a',
        Population: 'p',
        'Population $': 'pe',
        Total: 't'
    },
    dataSources: [
        {label: 'NRI Counties', value: 'nri', geoLayer: 'counties', geomCol: 'stcofips', geomColLabel: 'County', geomView: 286},
        {label: 'NRI Census Tracts', value: 'nri_tracts', geoLayer: 'tracts', geomCol: 'tractfips', geomColLabel: 'Tract',geomView: 286},
        {label: 'Derive From EAL Version Dependency', value: 'avail_counties', geoLayer: 'counties', geomCol: 'stcofips',  geomColLabel: 'County', geomView: 286}
    ],
    columns: function (hazard, dataSource) {
        if (!hazard || hazard === 'total') return [];

        const cols = [
            {
                value: 'stcofips',
                label: 'County',
                filter: 'text',
                width: '20%',
                isText: true
            }];

        if (dataSource === 'nri_tracts'){
            cols.push(
                {
                    value: this.dataSources.find(d => d.value === dataSource)?.geomCol,
                    label: 'Tract',
                    filter: 'text',
                    width: '20%',
                    isText: true
                }
            )
        }

        cols.push(
            ...Object.keys(this.attributes)
                .reduce((accA, currA) => {
                    let template = {
                        value: `${hazardsMeta[hazard]?.prefix}_${this.attributes[currA]}`,
                        label: `${currA}`,
                        isDollar: false,
                    };

                    const cols = Object.keys(this.consequences)
                        .filter(c => hazardsMeta[hazard]?.consequences?.includes(this.consequences[c]))
                        .map(c => ({
                            value: `${template.value}${this.consequences[c]}`,
                            label: `${c} ${template.label}`,
                            isDollar: true
                        }))
                    return currA === 'Frequency' ? [...accA, template] : [...accA, ...cols];
                }, [])
        )

        return cols;
    }
};