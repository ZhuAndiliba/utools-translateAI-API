<script lang="ts" setup>
import { onMounted, ref, provide } from "vue";
import { NMessageProvider } from "naive-ui";
import { RouterView, useRouter } from "vue-router";
const route = ref("");
const enterAction = ref({});
const router = useRouter();

onMounted(() => {
  window.utools.onPluginEnter((action) => {
    route.value = action.code;
    enterAction.value = action;

    // 根据功能代码路由到对应页面
    if (action.code === "translate") {
      // 翻译功能，无论什么类型都路由到首页
      router.push("/home");
    } else {
      // 其他功能，默认路由到首页
      router.push("/home");
    }
  });
  window.utools.onPluginOut((isKill) => {
    route.value = "";
    enterAction.value = {};
  });

  // 提供 enterAction 给子组件使用
  provide("enterAction", enterAction);
});
</script>

<template>
  <n-message-provider>
    <RouterView />
  </n-message-provider>
</template>
