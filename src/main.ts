import { createApp } from "vue";
import registerElementIcons from "@/plugins/registerElementIcons";
import registerGlobalComponent from "@/plugins/registerGlobalComponent";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import pinia from "./store";
import "@/styles/index.scss";
import directive from './directives/index.ts';

const app = createApp(App);

// element-plus 图标
registerElementIcons(app);

// 全局组件
registerGlobalComponent(app);

// 注册自定义指令
app.use(directive);

app.use(pinia);
app.use(router);
app.use(ElementPlus);

app.mount("#app");

