import type { App } from "vue";
import glTableJsx from "@/components/global/gl-table-jsx/index.vue";
import glBaseHeader from "@/components/global/gl-base-header/index.vue";
import glIcon from "@/components/global/gl-icon/index.vue";
const resgiterGlobalComponent = (app: App) => {
  app.component("gl-table-jsx", glTableJsx);
  app.component("gl-base-header", glBaseHeader);
  app.component("gl-icon", glIcon);
};

export default resgiterGlobalComponent;
