import React, {useEffect, useMemo, useState} from "react";
import {editMetadata} from "../utils/editMetadata.js";
import {Button} from "~/modules/avl-components/src";
import {falcor} from "~/modules/avl-falcor";
import {dmsDataTypes} from "~/modules/dms/src"

export const RenderArray = ({value, setValue, save, cancel}) => {
    const [newOption, setNewOption] = useState(undefined);
    const options = useMemo(() => value.map(v => v.label ? v : ({label: v, value: v})), [value]);
    console.log('value in edit', value)
    return (
        <div className='w-full flex flex-col h-fit border-2'>
            <div className={'flex flex-col'}>
                <div className={'w-full flex'}>
                    <input
                        value={newOption}
                        onChange={e => setNewOption(e.target.value)}
                        placeholder={'Add new option...'}
                        className='p-2 flex-1 px-2 shadow bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-md'
                    />
                    <button
                        className={'p-2'}
                        onClick={e => setValue([...value, {label: newOption, value: newOption}])}>
                        add
                    </button>
                </div>
                <div className={'flex flex-row flex-wrap'}>
                    {
                        options.map(option => (
                            <div className={'border border-blue-300 p-2 m-1'}>
                                {option?.label || option}
                                <i className={'fa fa-close text-red-300 hover:text-red-500 p-2 '}
                                   onClick={e => setValue(value.filter(v => (v.value || v) !== (option.value || option)))}
                                />
                            </div>
                        ))
                    }
                </div>
            </div>

            <div className='flex py-2'>
                <div className='flex-1'/>
                <Button themeOptions={{size: 'sm', color: 'primary'}}
                        onClick={e => save(value)}> Save </Button>
                <Button themeOptions={{size: 'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
            </div>
        </div>
    )
}

export const RenderTextArea = ({value, setValue, save, cancel}) => {
    return (
        <div className='w-full flex flex-col h-full border border-lime-300'>
            <div>
                <textarea
                    className='flex-1 w-full px-2 shadow bg-blue-100 min-h-[200px] focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-l-md'
                    onChange={e => setValue(e.target.value)}
                    value={value}
                 />
            </div>

            <div className='flex py-2'>
                <div className='flex-1'/>
                <Button themeOptions={{size: 'sm', color: 'primary'}}
                        onClick={e => save(value)}> Save </Button>
                <Button themeOptions={{size: 'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
            </div>
        </div>
    )
}

export const RenderTextBox = ({value, setValue, save, cancel}) => {
    return (
        <div className='w-full flex flex-1 flex-col'>
            <input
                className='p-2 flex-1 px-2 shadow bg-blue-100 focus:ring-blue-700 focus:border-blue-500  border-gray-300 rounded-none rounded-md'
                value={value} onChange={e => setValue(e.target.value)}/>

            <div className={'flex self-end'}>
                <Button themeOptions={{size: 'sm', color: 'primary'}} onClick={e => save(value)}> Save </Button>
                <Button themeOptions={{size: 'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
            </div>
        </div>
    )
}

export const RenderLexical = ({Comp, value, setValue, save, cancel}) => {
    console.log('v?', value)
    return (
        <div className='w-full flex flex-1 flex-col'>
            <Comp value={value} onChange={setValue} />
            <div className={'flex self-end'}>
                <Button themeOptions={{size: 'sm', color: 'primary'}} onClick={e => save(value)}> Save </Button>
                <Button themeOptions={{size: 'sm', color: 'cancel'}} onClick={e => cancel()}> Cancel </Button>
            </div>
        </div>
    )
}
export const Edit = ({
                         update,
                         metadata, setMetadata,
                         col,
                         startValue,
                         attr,
                         type = 'text',
                         setEditing = () => {
                         },
                         cancel = () => {
                         }
                     }) => {
    const [value, setValue] = useState('')
    const Lexical = dmsDataTypes.lexical.EditComp;

    useEffect(() => {
        setValue(startValue)
    }, [startValue])

    const save = (value) => {
        console.log('saving', attr, value)
        setEditing(null)
        editMetadata({update, metadata, setMetadata, col, value: {[attr]: value}})
          .then(() => setEditing(null));
    }

    return type === 'textarea' ?
        <RenderTextArea value={value} setValue={setValue} save={save} cancel={cancel}/> :
        type === 'lexical' ?
            <RenderTextArea value={value} setValue={setValue} save={save} cancel={cancel} /> :
            <RenderTextBox value={value} setValue={setValue} save={save} cancel={cancel}/>
}
