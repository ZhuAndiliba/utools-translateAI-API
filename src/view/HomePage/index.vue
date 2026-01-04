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
        <div class="translation-result-container">
          <!-- 左侧菜单栏 -->
          <div class="translator-menu">
            <n-menu
              v-model:value="selectedTranslatorKey"
              :options="translatorMenuOptions"
              @update:value="handleTranslatorSelect"
            />
          </div>
          <!-- 右侧翻译内容 -->
          <div class="translation-content">
            <TranslationCard
              v-if="currentTranslator"
              :name="currentTranslator.name"
              :loading="currentTranslator.loading"
              :text="currentTranslator.text"
              :error="currentTranslator.error"
              :is-large="true"
            />
            <div v-else class="empty-state">
              <n-text depth="3">请选择一个翻译器查看结果</n-text>
            </div>
          </div>
        </div>
      </div>
    </n-space>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, inject, watch, nextTick, h } from "vue";
import { useRouter } from "vue-router";
import { useAppStore, languageOptions } from "../../stores";
import { NButton, NSpace, NGrid, NGi, NText, NSelect, NMenu, NIcon, NSpin, useMessage } from "naive-ui";
import TranslationCard from "../HomePage/TranslationCard.vue";
import type { MenuOption } from "naive-ui";
import { CheckmarkCircle, CloseCircle } from "@vicons/ionicons5";

// 原文输入内容
const originalText = ref("");
const appStore = useAppStore();
const router = useRouter();
const message = useMessage();
const enterAction = inject("enterAction", ref({}));

// 当前选中的翻译器key
const selectedTranslatorKey = ref<string | null>(null);

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
  const volcengineLoading = appStore.normalTranslators.volcengine.isActive && appStore.normalTranslators.volcengine.loading;
  const aiLoading = appStore.AITranslators.some((t) => t.isActive && t.loading);
  return baiduLoading || volcengineLoading || aiLoading;
});

// 获取翻译器状态的辅助函数
const getTranslatorStatus = (key: string) => {
  if (key === "baidu") {
    const translator = appStore.normalTranslators.baidu;
    return {
      loading: translator.loading,
      hasText: !!translator.translatedText,
      hasError: !!translator.error,
      textLength: translator.translatedText.length,
    };
  }
  
  if (key === "volcengine") {
    const translator = appStore.normalTranslators.volcengine;
    return {
      loading: translator.loading,
      hasText: !!translator.translatedText,
      hasError: !!translator.error,
      textLength: translator.translatedText.length,
    };
  }
  
  if (key.startsWith("ai-")) {
    const index = parseInt(key.replace("ai-", ""));
    const translator = appStore.AITranslators[index];
    if (translator) {
      return {
        loading: translator.loading,
        hasText: !!translator.translatedText,
        hasError: !!translator.error,
        textLength: translator.translatedText.length,
      };
    }
  }
  
  return {
    loading: false,
    hasText: false,
    hasError: false,
    textLength: 0,
  };
};

// 创建带状态的菜单标签
const createMenuLabel = (name: string, key: string) => {
  const status = getTranslatorStatus(key);
  
  return h("div", { class: "menu-item-label" }, [
    h("span", { class: "menu-item-status" }, [
      status.loading
        ? h(NSpin, { size: 12 })
        : status.hasError
        ? h(NIcon, { component: CloseCircle, size: 14, color: "#d03050" })
        : status.hasText
        ? h(NIcon, { component: CheckmarkCircle, size: 14, color: "#18a058" })
        : null,
    ]),
    h("span", { class: "menu-item-name" }, name),
  ]);
};

// 翻译器菜单选项
const translatorMenuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = [];
  
  // 百度翻译
  if (appStore.normalTranslators.baidu.isActive) {
    options.push({
      label: () => createMenuLabel("百度翻译", "baidu"),
      key: "baidu",
    });
  }
  
  // 火山引擎翻译
  if (appStore.normalTranslators.volcengine.isActive) {
    options.push({
      label: () => createMenuLabel("火山引擎翻译", "volcengine"),
      key: "volcengine",
    });
  }
  
  // AI翻译器
  appStore.AITranslators.forEach((translator, index) => {
    if (translator.isActive) {
      const name = `${translator.name}-${translator.model}`;
      options.push({
        label: () => createMenuLabel(name, `ai-${index}`),
        key: `ai-${index}`,
      });
    }
  });
  
  // 如果有可用的翻译器且当前没有选中，或者当前选中的翻译器不在列表中，自动选中第一个
  if (options.length > 0) {
    if (!selectedTranslatorKey.value || !options.find(opt => opt.key === selectedTranslatorKey.value)) {
      selectedTranslatorKey.value = options[0].key as string;
    }
  } else {
    // 如果没有可用的翻译器，清空选中状态
    selectedTranslatorKey.value = null;
  }
  
  return options;
});

// 当前选中的翻译器数据
const currentTranslator = computed(() => {
  if (!selectedTranslatorKey.value) return null;
  
  const key = selectedTranslatorKey.value;
  
  if (key === "baidu") {
    return {
      name: "百度翻译",
      loading: appStore.normalTranslators.baidu.loading,
      text: appStore.normalTranslators.baidu.translatedText,
      error: appStore.normalTranslators.baidu.error,
    };
  }
  
  if (key === "volcengine") {
    return {
      name: "火山引擎翻译",
      loading: appStore.normalTranslators.volcengine.loading,
      text: appStore.normalTranslators.volcengine.translatedText,
      error: appStore.normalTranslators.volcengine.error,
    };
  }
  
  if (key.startsWith("ai-")) {
    const index = parseInt(key.replace("ai-", ""));
    const translator = appStore.AITranslators[index];
    if (translator) {
      return {
        name: `${translator.name}-${translator.model}`,
        loading: translator.loading,
        text: translator.translatedText,
        error: translator.error,
      };
    }
  }
  
  return null;
});

// 处理翻译器选择
const handleTranslatorSelect = (key: string) => {
  selectedTranslatorKey.value = key;
};

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
  appStore.normalTranslators.volcengine.translatedText = "";
  appStore.normalTranslators.volcengine.error = "";
  appStore.AITranslators.forEach((t) => {
    t.translatedText = "";
    t.error = "";
  });
  
  // 重置选中状态，让菜单自动选择第一个
  selectedTranslatorKey.value = null;

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

.translation-result-container {
  display: flex;
  gap: 12px;
  min-height: 400px;
}

.translator-menu {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px 0;
}

.menu-item-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.menu-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-item-status {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.status-text {
  font-size: 11px;
  color: #666;
}

.translation-content {
  flex: 1;
  min-height: 400px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
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
  
  .translation-result-container {
    flex-direction: column;
  }
  
  .translator-menu {
    width: 100%;
  }
}
</style>
