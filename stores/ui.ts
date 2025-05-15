import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    isGlobalLoading: false as boolean,
  }),
  actions: {
    showGlobalLoading() {
      this.isGlobalLoading = true;
    },
    hideGlobalLoading() {
      this.isGlobalLoading = false;
    },
  },
});
