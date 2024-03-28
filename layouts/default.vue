<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-toolbar-title>Vue Master Course</q-toolbar-title>
        <q-separator dark vertical />
        <NuxtLink custom v-slot="{navigate}" to="/">
          <q-btn stretch flat label="Home" @click="navigate" no-caps />
        </NuxtLink>
        <q-separator dark vertical />
        <NuxtLink custom v-slot="{navigate}" to="/about">
          <q-btn stretch flat label="About" @click="navigate" no-caps />
        </NuxtLink>
        <q-separator dark vertical />
        <q-btn stretch flat label="Youtube" @click="moveYoutube" no-caps />
        <q-separator dark vertical />
        <NuxtLink custom v-slot="{navigate}" to="/admin">
          <q-btn stretch flat label="Admin" @click="navigate" no-caps />
        </NuxtLink>
      </q-toolbar>
    </q-header>
    <q-page-container :style="pageContainerStyle">
      <slot />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
const pageContainerStyle = computed(() => ({
  maxWidth: '1080px',
  margin: '0 auto',
}));

const moveYoutube = async () => {
  await navigateTo('https://youtube.com/@gymcoding', {
    external: true,
    open: {
      target: '_blank'
    }
  })
}
</script>