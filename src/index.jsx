import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  FalcorProvider,
  falcorGraph
} from "~/modules/avl-falcor"

import { 
  ThemeContext
} from "~/modules/avl-components/src"

import AVL_THEME from "~/layout/avail-theme"


import { authProvider } from "./modules/ams/src"

import { 
  API_HOST,
  AUTH_HOST, 
  PROJECT_NAME, 
  CLIENT_HOST 
} from '~/config'

import App from '~/App';
import '~/index.css';

window.global ||= window;

export const falcor = falcorGraph(API_HOST)
const AuthEnabledApp = authProvider(App, { AUTH_HOST, PROJECT_NAME, CLIENT_HOST });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FalcorProvider falcor={falcor}>
      <ThemeContext.Provider value={AVL_THEME}>
        <AuthEnabledApp />
      </ThemeContext.Provider>
    </FalcorProvider>
  </React.StrictMode>
);

