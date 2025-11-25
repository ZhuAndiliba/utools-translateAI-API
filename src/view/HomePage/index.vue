<!--
  翻译页面主组件
  功能：支持同时使用百度翻译和阿里 DeepSeek 进行翻译，并并排展示结果
-->
<template>
  <div class="translation-container">
    <n-space vertical :size="12">
      <!-- 原文输入区域 -->
      <div class="section">
        <div class="section-header">
          <h3 class="section-title">原文</h3>
          <n-space :size="8">
            <n-select v-model:value="selectedLanguageLabel" :options="languageOptions" label-field="label" value-field="label" size="small" style="width: 140px" />
            <n-text v-if="originalText.length > 0" depth="3" class="char-count">{{ originalText.length }} 字</n-text>
            <n-button v-if="originalText.length > 0" @click="clearOriginal" size="small" quaternary type="error"> 清空 </n-button>
            <n-button @click="goSetting" size="small" quaternary>设置</n-button>
          </n-space>
        </div>
        <div class="input-wrapper">
          <textarea v-model="originalText" class="original-input" placeholder="请输入要翻译的文本..." @keydown.ctrl.enter="translate" @keydown.meta.enter="translate" />
          <div class="input-actions">
            <n-button @click="translate" type="primary" :loading="isTranslating" :disabled="!originalText.trim()" class="translate-btn"> 翻译 </n-button>
          </div>
        </div>
      </div>

      <!-- 译文展示区域 -->
      <div class="section">
        <h3 class="section-title">译文</h3>
        <n-grid x-gap="8" y-gap="8" :cols="getGridCols" responsive="screen">
          <!-- 百度翻译结果 -->
          <n-gi v-if="appStore.normalTranslators.baidu.isActive">
            <TranslationCard
              :name="'百度翻译'"
              :loading="appStore.normalTranslators.baidu.loading"
              :text="appStore.normalTranslators.baidu.translatedText"
              :error="appStore.normalTranslators.baidu.error"
            />
          </n-gi>

          <!-- 火山引擎翻译结果 -->
          <n-gi v-if="appStore.normalTranslators.volcengine.isActive">
            <TranslationCard
              :name="'火山引擎翻译'"
              :loading="appStore.normalTranslators.volcengine.loading"
              :text="appStore.normalTranslators.volcengine.translatedText"
              :error="appStore.normalTranslators.volcengine.error"
            />
          </n-gi>

          <!-- AI翻译器结果 -->
          <template v-for="(translator, i) in appStore.AITranslators" :key="i">
            <n-gi v-if="translator.isActive">
              <TranslationCard :name="`${translator.name}-${translator.model}`" :loading="translator.loading" :text="translator.translatedText" :error="translator.error" />
            </n-gi>
          </template>
        </n-grid>
      </div>
    </n-space>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, inject, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAppStore, languageOptions } from "../../stores";
import { NButton, NSpace, NGrid, NGi, NText, NSelect, useMessage } from "naive-ui";
import TranslationCard from "../HomePage/TranslationCard.vue";

// 原文输入内容
const originalText = ref("");
const appStore = useAppStore();
const router = useRouter();
const message = useMessage();
const enterAction = inject("enterAction", ref({}));

// 当前选择的语言标签（用于 n-select 绑定）
const selectedLanguageLabel = computed({
  get: () => appStore.selectedLanguageOption.label,
  set: (value: string) => {
    const option = languageOptions.find((opt) => opt.label === value);
    if (option) {
      appStore.selectedLanguageOption = option;
    }
  },
});

// 计算是否正在翻译
const isTranslating = computed(() => {
  const baiduLoading = appStore.normalTranslators.baidu.isActive && appStore.normalTranslators.baidu.loading;
  const aiLoading = appStore.AITranslators.some((t) => t.isActive && t.loading);
  return baiduLoading || aiLoading;
});

// 响应式网格列数
const getGridCols = computed(() => {
  const activeCount = (appStore.normalTranslators.baidu.isActive ? 1 : 0) + appStore.AITranslators.filter((t) => t.isActive).length;
  return activeCount <= 1 ? 1 : 2;
});

/**
 * 执行翻译操作
 */
const translate = async () => {
  if (!originalText.value.trim()) {
    message.warning("请输入要翻译的文本");
    return;
  }

  // 清空之前的翻译结果和错误
  appStore.normalTranslators.baidu.translatedText = "";
  appStore.normalTranslators.baidu.error = "";
  appStore.AITranslators.forEach((t) => {
    t.translatedText = "";
    t.error = "";
  });

  const langOption = appStore.selectedLanguageOption;
  await appStore.translate(originalText.value, langOption.from, langOption.to);
};

/**
 * 清空原文
 */
const clearOriginal = () => {
  originalText.value = "";
};

/**
 * 跳转到设置页面
 */
const goSetting = () => {
  router.push("/setting");
};

// 处理 enterAction 的函数
const handleEnterAction = (action: any) => {
  if (action && action.code === "translate" && action.type === "over" && action.payload) {
    // 填充文本到输入框
    originalText.value = action.payload;
    // 等待 DOM 更新后自动触发翻译
    nextTick(() => {
      translate();
    });
  }
};

onMounted(() => {
  appStore.init();

  // 立即检查一次 enterAction（处理组件挂载时 enterAction 已经存在的情况）
  const currentAction = enterAction.value as any;
  if (currentAction && currentAction.code === "translate" && currentAction.type === "over" && currentAction.payload) {
    handleEnterAction(currentAction);
  }

  // 监听 enterAction 变化，如果是 over 类型（粘贴文本），自动填充并翻译
  watch(
    () => enterAction.value,
    (action: any) => {
      handleEnterAction(action);
    },
    { immediate: false, deep: true }
  );
});
</script>

<style scoped>
.translation-container {
  background-color: #ffffff;
  padding: 12px;
  min-height: 100vh;
  box-sizing: border-box;
}

.section {
  margin-bottom: 4px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.char-count {
  font-size: 12px;
}

.input-wrapper {
  position: relative;
}

.original-input {
  width: 100%;
  min-height: 100px;
  max-height: 300px;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.original-input:focus {
  outline: none;
  border-color: #18a058;
  box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.1);
}

.original-input::placeholder {
  color: #bbb;
}

.input-actions {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
}

.translate-btn {
  min-width: 80px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .translation-container {
    padding: 12px;
  }

  .section-title {
    font-size: 14px;
  }

  .original-input {
    min-height: 100px;
  }
}
</style>
