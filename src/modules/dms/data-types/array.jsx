import React from "react"

const Edit = ({Component, value, onChange, attr}) => {
    if (!value || !value.map) { 
        value = []
    }
    const [newValue, setNewValue] = React.useState('')

    const addNewValue = () => {
        onChange([...value, newValue])
        setNewValue('')
    } 
    // console.log('array edit', value, onChange)
    return (
        <>
            {value.map((v,i) => 
                <>
                    <Component.ViewComp value={v} {...attr}/>
                </>
            )}
            <Component.EditComp value={newValue} onChange={setNewValue} {...attr} />
            <button onClick={addNewValue}>Add</button>
            
        </>
    )
}

const View = ({Component, value, attr}) => {
    if (!value || !value.map) { return '' }
    return value.map((v,i) => <Component.ViewComp key={i} value={v} {...attr}/>)
}

export default {
    "EditComp": Edit,
    "ViewComp": View
}