import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth/store'
import common from './modules/common/store'
import data from './modules/data/store'
import list from './modules/list/store'
import crudlDocument from './modules/common/crudlDocument/store'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    common,
    auth,
    list,
    data,
    crudlDocument
  },
  strict: process.env.NODE_ENV !== 'production'
})
