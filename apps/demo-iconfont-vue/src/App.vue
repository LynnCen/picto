<template>
  <div class="app">
    <header class="header">
      <h1>Picto Icons Preview</h1>
      <p class="subtitle">
        {{ filteredIcons.length }} / {{ iconList.length }} icons
      </p>
    </header>

    <div class="controls">
      <input
        v-model="search"
        type="text"
        placeholder="Search icons..."
        class="search-input"
      />
      <div class="size-control">
        <label>Size: {{ size }}px</label>
        <input
          v-model.number="size"
          type="range"
          min="16"
          max="64"
        />
      </div>
    </div>

    <div class="icon-grid">
      <div
        v-for="[name, Icon] in filteredIcons"
        :key="name"
        class="icon-item"
      >
        <div class="icon-preview" :style="{ fontSize: size + 'px' }">
          <component :is="Icon" :width="size" :height="size" />
        </div>
        <div class="icon-name">{{ name }}</div>
      </div>
    </div>

    <div v-if="filteredIcons.length === 0" class="empty-state">
      No icons found for "{{ search }}"
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as Icons from '../icons'

type IconEntry = [string, any]

const search = ref('')
const size = ref(24)

const iconList = computed<IconEntry[]>(() => {
  return Object.entries(Icons).filter(([name]) => name !== 'default').slice(0, 10)
})

const filteredIcons = computed<IconEntry[]>(() => {
  if (!search.value) return iconList.value
  const query = search.value.toLowerCase()
  return iconList.value.filter(([name]) => name.toLowerCase().includes(query))
})
console.log(filteredIcons.value)
</script>

<style scoped>
/* Scoped styles here if needed */
</style>
