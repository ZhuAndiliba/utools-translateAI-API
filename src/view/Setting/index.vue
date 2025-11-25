<template>
  <div style="margin: 5px">
    <h1>设置</h1>
    <n-button size="small" @click="goHomePage">首页</n-button>
    <n-button size="small" @click="save()">保存</n-button>
    <n-grid :cols="2">
      <n-gi>
        <n-card>
          <n-space vertical>
            <n-space>
              <span>百度翻译</span>
              <n-switch size="small" v-model:value="appStore.normalTranslators.baidu.isActive" />
            </n-space>
            <n-form
              v-if="appStore.normalTranslators.baidu.isActive"
              ref="formRef"
              label-placement="left"
              require-mark-placement="right-hanging"
              :style="{
                maxWidth: '340px',
              }"
            >
              <n-form-item label="appid:">
                <n-input v-model:value="appStore.normalTranslators.baidu.appid" placeholder="appid" type="text" />
              </n-form-item>
              <n-form-item label="key:">
                <n-input v-model:value="appStore.normalTranslators.baidu.key" placeholder="key" type="password" show-password-on="click" />
              </n-form-item>
            </n-form>
          </n-space>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-space vertical>
            <n-space>
              <span>火山引擎翻译</span>
              <n-switch size="small" v-model:value="appStore.normalTranslators.volcengine.isActive" />
            </n-space>
            <n-form
              v-if="appStore.normalTranslators.volcengine.isActive"
              ref="formRef2"
              label-placement="left"
              require-mark-placement="right-hanging"
              :style="{
                maxWidth: '340px',
              }"
            >
              <n-form-item label="AccessKey ID:">
                <n-input v-model:value="appStore.normalTranslators.volcengine.accessKeyId" placeholder="AccessKey ID" type="text" />
              </n-form-item>
              <n-form-item label="Secret Access Key:">
                <n-input v-model:value="appStore.normalTranslators.volcengine.secretAccessKey" placeholder="Secret Access Key" type="password" show-password-on="click" />
              </n-form-item>
            </n-form>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
    <div>
      <span>OpenAI格式的大模型设置：</span>
      <n-button size="small" @click="addAITranslator()">添加</n-button>
      <n-grid :cols="2">
        <n-gi v-for="(translator, i) in appStore.AITranslators" :key="i">
          <n-card>
            <n-form label-placement="left" require-mark-placement="right-hanging">
              <n-form-item label="是否启用:">
                <n-switch size="small" v-model:value="translator.isActive" />
              </n-form-item>
              <n-form-item label="名称:">
                <n-input v-model:value="translator.name" placeholder="name" type="text" />
              </n-form-item>
              <n-form-item label="基础URL:">
                <n-input v-model:value="translator.baseURL" placeholder="baseURL" type="text" />
              </n-form-item>
              <n-form-item label="API密钥:">
                <n-input v-model:value="translator.apiKey" placeholder="apiKey" type="password" show-password-on="click" />
              </n-form-item>
              <n-form-item label="模型:">
                <n-input v-model:value="translator.model" placeholder="model" type="text" />
              </n-form-item>
              <n-space justify="space-between">
                <n-button size="small" @click="deleteAITranslator(i)">删除</n-button>
              </n-space>
            </n-form>
          </n-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { NCard, NInput, NFormItem, NForm, NButton, NSpace, NGrid, NGi, NSwitch, useMessage } from "naive-ui";
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../../stores";
const router = useRouter();
const appStore = useAppStore();
const message = useMessage();
const goHomePage = () => {
  router.push("/home");
};
const save = () => {
  appStore.saveAITranslators();
  appStore.saveNormalTranslators();
  message.success("保存成功");
};
const deleteAITranslator = (i: number) => {
  appStore.AITranslators.splice(i, 1);
};
const addAITranslator = () => {
  appStore.AITranslators.push({
    name: "",
    baseURL: "",
    apiKey: "",
    model: "",
    translatedText: "",
    loading: false,
    isActive: true,
  });
  //appStore.saveAITranslator();
};
onMounted(() => {
  appStore.init();
});
</script>
