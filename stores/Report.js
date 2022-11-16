import { defineStore } from 'pinia'

export const useReportStore = defineStore('report', {
  state: () => ({
    idProject: '',
    projects: [],
    findTargets: [],
    products: [],
    qualifiedIds: [],
    hasPrices: true,
    scvData: [],
    loading: true,
  }),
  getters: {
    getScvData: (state) => state.scvData,
    getIdProject: (state) => state.idProject,
    getProjects: (state) => state.projects,
  },
  actions: {
    setIdProject(id) {
      this.idProject = id
    },
    setQualified(ids) {
      this.qualifiedIds = ids
    },
    async fetchProducts() {
      console.log('getProducts initiated')
      this.products = await useFetch('http://localhost:3001/report/products', {
        method: 'POST',
        body: { idProject: this.idProject },
        onRequest({ request, options }) {},
        onRequestError({ request, options, error }) {
          console.log(`error:${error}`)
        },
        onResponse({ request, response, options }) {
          return response._data
        },
        onResponseError({ request, response, options }) {
          console.log(`error:${error}`)
        },
      }).data
    },
    async fetchFindTargets() {
      try {
        if (this.idProject === '') throw 'missing idProject'
        this.findTargets = await useFetch(
          'http://localhost:3001/report/findTargets',
          {
            method: 'POST',
            body: { idProject: this.idProject },
          }
        ).data
      } catch (error) {
      } finally {
        this.loading = false
      }
    },
    async fetchProjects() {
      try {
        this.projects = await useFetch('http://localhost:3001/report/projects',{
          method: 'GET'
        }).data
      } catch (error) {
        console.log(error)
      }
    }
  },
})
