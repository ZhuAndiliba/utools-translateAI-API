import { createRouter, createWebHashHistory } from "vue-router";
import HomePage from "../view/HomePage/index.vue";
import Setting from "../view/Setting/index.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/home",
    },
    {
      path: "/home",
      component: HomePage,
    },
    {
      path: "/setting",
      component: Setting,
    },
  ],
});

export default router;
