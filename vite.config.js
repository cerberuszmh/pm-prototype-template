import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    vue(),
    Components({
      dts: false,
      resolvers: [
        AntDesignVueResolver({
          importStyle: false,
        }),
      ],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }
          if (id.includes("vue-router")) {
            return "router-vendor";
          }
          if (id.includes("/vue/")) {
            return "vue-vendor";
          }
        },
      },
    },
  },
});
