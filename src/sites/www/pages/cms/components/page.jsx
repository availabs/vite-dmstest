import React, {useEffect} from 'react'
import { NavLink, Link, useSubmit, useNavigate, useParams} from "react-router-dom";
import Nav from './nav'
import { PageControls } from './page-controls'
import { SideNav } from '~/modules/avl-components/src'
import {getInPageNav} from "./utils/inPageNavItems.js";
import {CMSContext} from './layout'


const theme = {
  page: {
    container: 'flex-1  w-full h-full ',
    content: '',
  }
}


export function PageView ({item, dataItems, attributes}) {
  if(!item) return <div> No Pages </div>
  const {baseUrl} = React.useContext(CMSContext)
  const ContentView = attributes['sections'].ViewComp
  const inPageNav = getInPageNav(dataItems, baseUrl);
  
  return (
    <div className='flex flex-1 h-full w-full px-1 md:px-6 py-6'>
      {/*<div className='w-[264px]' />*/}
      <div className='flex-1 flex border shadow bg-white px-4'>
        <div className={theme.page.container + ' '}>
          {/*<div className='px-6 py-4 font-sans font-medium text-xl text-slate-700 uppercase max-w-5xl mx-auto'>
            {item['title']}
          </div>*/}
          
          <div className='text-md font-light leading-7'>
            <ContentView 
              value={item['sections']} 
              {...attributes['sections']}
            />
          </div>
        </div>
         
      </div>
        {item?.sidebar === 'show' ? 
          (<div className='w-48 hidden xl:block'>
            <div className='w-48 fixed hidden xl:block max-h-[500px] overflow-y-auto'>
              <SideNav {...inPageNav} />
            </div>
          </div>)
        : ''}
      {/*<PageControls />*/}
    </div>    
  ) 
}


export function PageEdit ({item, dataItems, updateAttribute ,attributes, setItem, status}) {
  const navigate = useNavigate()
  const {baseUrl} = React.useContext(CMSContext)
  const inPageNav = getInPageNav(dataItems, baseUrl);
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
    <div className='flex flex-1 h-full w-full px-1 md:px-6 py-6'>
      <Nav dataItems={dataItems} edit={true} />
      <div className='flex-1 flex border shadow bg-white px-4 '>
        <div className={theme.page.container}>
          {/*{status ? <div>{JSON.stringify(status)}</div> : ''}*/}
          <div className='px-6 py-2 font-sans font-medium text-xl text-slate-700 max-w-5xl mx-auto'>
            <TitleEdit
              className=' w-full p-2'
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
      <div className='w-52 hidden xl:block'>
        <div className='w-52 fixed hidden xl:block'> 
          <PageControls 
            item={item} 
            dataItems={dataItems}
            edit={true}
            status={status}
          />
          {item?.sidebar === 'show' ? <div className={'max-h-[500px] overflow-y-auto'}><SideNav {...inPageNav} /></div> : ''}
        </div>
      </div>
      
    </div>   
  ) 
}


