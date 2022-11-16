<template>
  <div class="container">
    <div class="section">
      <h1 class="title">Section</h1>
      <h2 class="subtitle">
        A simple container to divide your page into <strong>sections</strong>,
        like the one you're currently reading.
      </h2>
    </div>
    <div class="section">
      <div class="field">
        <label class="label">Project</label>
        <div class="control">
          <div v-if="projects && projects.length > 0" class="select">
            <select v-model="idProject">
              <option value="">Select Project ID</option>
              <option v-for="project in projects" :key="project">
                {{ project.idProject }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">IDs</label>
        <div class="control">
          <textarea class="textarea" placeholder="One IDs per row" v-model="idsRaw"></textarea>
        </div>
      </div>

      <div class="field">
        <label class="label">Has Prices</label>
        <div class="control">
          <label class="radio">
            <input type="radio" id="yes" value="Yes" name="question" v-model="hasPrices" />
            Yes
          </label>
          <label class="radio">
            <input type="radio" id="no" value="No" name="question" v-model="hasPrices" />
            No
          </label>
        </div>
      </div>

      <div class="field is-grouped">
        <div class="control">
          <button class="button is-link" @click.prevent="setIdProject">
            Submit
          </button>
        </div>
        <div class="control">
          <button class="button is-link is-light">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useReportStore } from '@/stores/Report'
const store = useReportStore()
await store.fetchProjects()
const idProject = ref('')
const hasPrices = ref('')
const idsRaw = ref('')
const projects = store.getProjects

const setIdProject = async () => {
  store.setIdProject(idProject)
  await store.fetchProducts()
  await store.fetchFindTargets()
  convertIds()
}
const convertIds = () => {
  const qualified = idsRaw.value.split('\n').filter((el) => {
    return (el !== "" && el != null)
  })
  store.setQualified(qualified)
}
</script>

<style scoped>
@import 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css';
</style>
