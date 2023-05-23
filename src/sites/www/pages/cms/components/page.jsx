import React, {useEffect} from 'react'
import { NavLink, Link, useSubmit, useNavigate, useParams} from "react-router-dom";
import Nav from './nav'
import { PageControls } from './page-controls'

const theme = {
  page: {
    container: 'flex-1  w-full h-full ',
    content: '',
  }
}


export function PageView ({item, dataItems, attributes}) {
  if(!item) return <div> No Pages </div>

  const ContentView = attributes['sections'].ViewComp

  return (
    <div className='flex flex-1 h-full w-full'>
      {/*<div className='w-[264px]' />*/}
      <div className='border flex-1  flex'>
        <div className={theme.page.container}>
          <div className='p-6 text-4xl font-semibold max-w-3xl mx-auto'>
            {item['title']}
          </div>
          
          <div className='text-base font-light leading-7'>
            <ContentView 
              value={item['sections']} 
              {...attributes['sections']}
            />
          </div>
        </div>
         
      </div>
      {/*<PageControls />*/}
    </div>    
  ) 
}


export function PageEdit ({item, dataItems, updateAttribute ,attributes, setItem, status}) {
  const navigate = useNavigate()
  //if(!dataItems[0]) return <div/>
  
  React.useEffect(() => {
    if(!item?.url_slug ) { 
      //console.log('navigate', item, item.id,dataItems[0].id)
      let defaultUrl = dataItems
        .sort((a,b) => a.index-b.index)
        .filter(d=> !d.parent && d.url_slug)[0]
      //console.log('defaultUrl', defaultUrl)
      defaultUrl && defaultUrl.url_slug && navigate(`edit/${defaultUrl.url_slug}`)
    }
  },[])

  const ContentEdit = attributes['sections'].EditComp
  const TitleEdit = attributes['title'].EditComp

  return (
    <div className='flex flex-1 h-full w-full'>
      <Nav dataItems={dataItems} edit={true} />
      <div className='border flex-1 flex '>
        <div className={theme.page.container}>
          {/*{status ? <div>{JSON.stringify(status)}</div> : ''}*/}
          <div className='p-6 text-4xl font-semibold max-w-3xl mx-auto'>
            <TitleEdit 
              value={item['title']} 
              onChange={(v) => updateAttribute('title', v)}        
              {...attributes['title']}
            />
          </div>
          <div className='text-base font-light leading-7'>
            <ContentEdit
              value={item['sections']} 
              onChange={(v) => updateAttribute('sections', v)}        
              {...attributes['sections']}
            />
          </div>
        </div>
      </div>
      <PageControls 
        item={item} 
        dataItems={dataItems}
        edit={true}
        status={status}
      />
    </div>   
  ) 
}

