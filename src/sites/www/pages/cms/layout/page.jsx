import React, {useEffect} from 'react'
import { NavLink, Link, useSubmit, useNavigate, useLocation, useParams} from "react-router-dom";
import Nav, {json2DmsForm, getUrlSlug, toSnakeCase}  from './nav'
import EditHistory from './editHistory'
import { PageControls } from './page-controls'
import { SideNav } from '~/modules/avl-components/src'
import {CMSContext} from './layout'

import Layout from '~/layout/avail-layout'
import {dataItemsNav, detectNavLevel} from './utils/navItems'
import {getInPageNav} from "./utils/inPageNavItems.js";

import cloneDeep from 'lodash/cloneDeep'


const theme = {
  page: {
    container: 'flex-1 w-full h-full ',
    content: '',
  },
  layout: {
    page: 'h-full w-full bg-slate-100 flex flex-col',
    container: 'w-full flex-1 flex flex-col',
  },
  navPadding: {
    1: 'pt-0 ',
    2: 'md:pt-12 pt-0',
    3: 'md:pt-24 pt-0'
  } 
}


export function PageView ({item, dataItems, attributes}) {
  if(!item) return <div> No Pages </div>

  // console.log('page view', item, dataItems)
  const {baseUrl} = React.useContext(CMSContext)
  const ContentView = attributes['sections'].ViewComp
  const menuItems = React.useMemo(() => {
    let items = dataItemsNav(dataItems,baseUrl,false)
    return items
  }, [dataItems])

  const level = detectNavLevel(dataItems, baseUrl);

  const inPageNav = getInPageNav(dataItems, baseUrl);
  
  return (
    <Layout topNav={{menuItems, position: 'fixed' }} sideNav={item.sideNav ? item.sideNav : inPageNav}>
      <div className={`${theme.layout.page} ${theme.navPadding[level]}`}>
        <div className={theme.layout.container}>
          {/*----Page ---*/}
          <div className='flex flex-1 h-full w-full px-1 md:px-6 py-6'>
            {/*<div className='w-[264px]' />*/}
            {item?.sidebar === 'show' ? 
                (<div className='w-64 hidden xl:block'>
                  <div className='w-64 fixed hidden xl:block h-screen'> 
                    <div className='h-[calc(100%_-_5rem)] overflow-y-auto overflow-x-hidden font-display'>
                      <SideNav {...inPageNav} /> 
                    </div>
                  </div>
                </div>)
              : ''}
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
          </div>
             {/*---- END Page ---*/}
          
        </div>
      </div>
    </Layout>
  ) 
}


export function PageEdit ({
  item, dataItems, updateAttribute ,attributes, setItem, status
}) {
  const navigate = useNavigate()
  const submit = useSubmit()
  const { pathname = '/edit' } = useLocation()
  const { baseUrl } = React.useContext(CMSContext)
  
  const menuItems = React.useMemo(() => {
    let items = dataItemsNav(dataItems,baseUrl,true)
    return items
  }, [dataItems])

  const level = detectNavLevel(dataItems, baseUrl);
  const inPageNav = getInPageNav(dataItems, baseUrl);
  
  // console.log('page edit', item)
  //console.log('page edit', open, setOpen)
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

  const saveSection = (v) => {
    //console.log('saving section', )
    updateAttribute('sections', v)
    const newItem = cloneDeep(item)
    newItem.sections = v
    submit(json2DmsForm(newItem), { method: "post", action: `${baseUrl}/edit/${newItem.url_slug}` })

    // save section
  }

  //console.log('page edit', attributes['sections'])
  const ContentEdit = attributes['sections'].EditComp
 
  return (
    <Layout topNav={{menuItems, position: 'fixed' }} sideNav={inPageNav}>
      <div className={`${theme.layout.page} ${theme.navPadding[level]}`}>
        <div className={theme.layout.container}>
          {/* PAGE EDIT */}
          <div className='flex flex-1 h-full w-full px-1 md:px-6 py-6'>
            <Nav dataItems={dataItems}  edit={true} />
            <EditHistory item={item} />
            {item?.sidebar === 'show' ? 
                (<div className='w-64 hidden xl:block'>
                  <div className='w-64 fixed hidden xl:block h-screen'> 
                    <div className='h-[calc(100%_-_8rem)] overflow-y-auto overflow-x-hidden'>
                      <SideNav {...inPageNav} /> 
                    </div>
                  </div>
                </div>)
              : ''}
            <div className='flex-1 flex border shadow bg-white px-4 '>
              <div className={theme.page.container}>
                <div className='text-base font-light leading-7'>
                  <ContentEdit
                    value={item['sections']} 
                    onChange={saveSection}         
                    {...attributes['sections']}
                  />
                </div>
              </div>
            </div>
            <div className='w-52 hidden xl:block'>
              <div className='w-52 fixed hidden xl:block h-screen'> 
                <PageControls 
                  item={item} 
                  dataItems={dataItems}
                  setItem={setItem}
                  edit={true}
                  status={status}
                  attributes={attributes}
                  updateAttribute={updateAttribute}
                />
              </div>
            </div>
          </div>  
          {/* PAGE EDIT END */}
        </div>
      </div>
    </Layout>
  ) 
}


