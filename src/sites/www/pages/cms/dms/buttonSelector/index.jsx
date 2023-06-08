import React from "react";
export const ButtonSelector = ({label, types, type, setType, size='small'}) => {
    return (
            <div className={'my-1 flex'}>
                <div className={'p-2 pl-0'}>{label}</div>
                <span className={`
                flex space-x-1 rounded-lg bg-slate-100 p-0.5
                isolate inline-flex 
                shadow-sm 
                ${size === 'large' && `w-full`}`}>
                {
                    types.map((t, i) => (
                        <button
                            type="button"
                            key={i}
                            className={`
                            ${i !== 0 && `-ml-px`} 
                           rounded-lg py-[0.4375rem] break-none
                            ${(t?.value || t) === type ? `text-gray-900 bg-white shadow` : `text-gray-700`} hover:text-blue-500
                            w-full
                            min-w-[60px] min-h-[30px] uppercase
                            relative inline-flex items-center px-2 text-xs items-center justify-center text-center 
                            focus:z-10`}
                            onClick={() => setType(t?.value || t)}
                        >
                            {t?.label || t}
                        </button>
                    ))
                }
                </span>
            </div>
    )
}