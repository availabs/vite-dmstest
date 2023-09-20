import checkAuth  from "~/layout/checkAuth"
import Layout from "~/sites/www/pages/cms/layout/layout"
import TemplateList from './layout/TemplateList'
import { TemplateEdit } from './layout/TemplateEdit'

import templateFormat from "./template.format.js"

const siteConfig = {
  format: templateFormat,
  check: ({user}, activeConfig, navigate) =>  {

    const getReqAuth = (configs) => {
      return configs.reduce((out,config) => {
        let authLevel = config.authLevel || -1
        if(config.children) {
          authLevel = Math.max(authLevel, getReqAuth(config.children))
        }
        return Math.max(out, authLevel)
      },-1)
    } 

    let requiredAuth = getReqAuth(activeConfig)
    checkAuth({user, authLevel:requiredAuth}, navigate)
    
  },
  children: [
    { 
      type: TemplateList,
      action: "list",
      path: "/*",
      lazyLoad: true,
      filter: {
        mainNav: true, 
        attributes:['title', 'index', 'url_slug', 'parent' ]
      }
    },
    { 
          type: TemplateEdit,
          action: "edit",
          path: "/edit/:id"
    }
    // { 
    //   type: (props) => <Layout {...props} edit={true} />,
    //   action: "list",
    //   path: "/edit/*",
    //   authLevel: 5,
    //   lazyLoad: true,
    //   filter: {
    //     attributes:['title', 'index', 'url_slug', 'parent' ]
    //   },
    //   children: [
        
    //   ]
    // }
  ]
}

export default siteConfig