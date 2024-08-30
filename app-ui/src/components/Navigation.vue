<template>
  <div>
    <v-app-bar class="elevation-0" :color="appColor" app>
      <v-toolbar-title class="unselectable">{{ $t('global.application-name') }}</v-toolbar-title>
      <v-tabs>
        <v-tab elevation="0" @click="go('/scan')"><v-icon class="mr-2" :icon="mdiCamera" />{{ $t('navigation.scan') }}</v-tab>
        <v-tab elevation="0" @click="go('/files')"><v-icon class="mr-2" :icon="mdiFileDocumentMultiple" />{{ $t('navigation.files') }}</v-tab>
        <v-tab elevation="0" @click="go('/settings')"><v-icon class="mr-2" :icon="mdiCog" />{{ $t('navigation.settings') }}</v-tab>
        <v-tab elevation="0" @click="go('/about')"><v-icon class="mr-2" :icon="mdiInformation" />{{ $t('navigation.about') }}</v-tab>
      </v-tabs>
    </v-app-bar>
  </div>
</template>

<script>
import Constants from '../classes/constants';
import { mdiCamera, mdiCog, mdiFileDocumentMultiple, mdiInformation, mdiTools } from '@mdi/js';
export default {
  name: 'Navigation',

  props: {
    appColor: {
      type: String,
      default: 'accent-4'
    }
  },

  setup() {
    return {
      mdiCamera,
      mdiCog,
      mdiFileDocumentMultiple,
      mdiInformation,
      mdiTools
    };
  },

  data() {
    return {
      drawer: false,
      version: Constants.Version
    };
  },

  methods: {
    go(location) {
      if (this.$route.path !== location) {
        this.$router.push(location);
      }
    }
  }
};
</script>

<style>
.unselectable {
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
