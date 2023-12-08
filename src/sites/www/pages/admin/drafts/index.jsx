import { dmsPageFactory, registerDataType } from "~/modules/dms/src"
import { withAuth } from "~/modules/ams/src" 
import checkAuth  from "~/layout/checkAuth"
import Logo from '~/layout/Logo'
import AuthMenu from "~/pages/Auth/AuthMenu"
import { menuItems } from "../index"


import siteConfig from '~/modules/dms/src/patterns/page/siteConfig'

import Selector from "../../cms/dms/selector"
registerDataType("selector", Selector)

export default { 
  ...dmsPageFactory(siteConfig({ 
    app: "dms-site",
    type: "docs-draft",
    logo: <div />, 
    rightMenu: <AuthMenu />,
    baseUrl: "/drafts",
    checkAuth
  }), "/drafts",  withAuth),
  name: "CMS",
  sideNav: {
    size: 'mini',
    color: 'white',
    menuItems
  },
  topNav: {
    size: "none"
  }
}
