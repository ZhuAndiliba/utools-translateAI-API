<template>
  <n-card :class="['translation-card', { 'is-large': isLarge }]" :bordered="false">
    <div class="card-header">
      <div class="card-title-wrapper">
        <n-text class="card-title" :depth="1">{{ name }}</n-text>
        <n-space :size="4" align="center">
          <!-- 状态指示 -->
          <n-spin v-if="loading" :size="10" />
          <n-icon v-else-if="error" :component="ErrorIcon" :size="14" color="#d03050" />
          <n-icon v-else-if="text" :component="CheckIcon" :size="14" color="#18a058" />
          <n-text v-if="!loading && !error && text" depth="3" class="char-count"> {{ text.length }} 字 </n-text>
        </n-space>
      </div>
      <n-button v-if="text && !loading" @click="copyText" size="small" quaternary type="primary" class="copy-btn"> 复制 </n-button>
    </div>

    <div class="card-content">
      <textarea v-if="!error" :value="text" class="translated-text" :disabled="loading" readonly :placeholder="loading ? '翻译中...' : '等待翻译'" />
      <div v-else class="error-message">
        <n-text type="error">{{ error }}</n-text>
      </div>
    </div>
  </n-card>
</template>

<script lang="ts" setup>
import { NCard, NButton, NSpace, NText, NIcon, NSpin, useMessage } from "naive-ui";
import { CheckmarkCircle, CloseCircle } from "@vicons/ionicons5";

const props = defineProps<{
  name: string;
  loading: boolean;
  text: string;
  error?: string;
  isLarge?: boolean;
}>();

const message = useMessage();
const CheckIcon = CheckmarkCircle;
const ErrorIcon = CloseCircle;

const copyText = async () => {
  if (!props.text) return;

  try {
    await navigator.clipboard.writeText(props.text);
    message.success("已复制到剪贴板");
  } catch (err) {
    message.error("复制失败");
  }
};
</script>

<style scoped>
.translation-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}

.translation-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.card-title {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.char-count {
  font-size: 11px;
}

.copy-btn {
  font-size: 12px;
  padding: 4px 8px;
}

.card-content {
  flex: 1;
  min-height: 120px;
}

.translation-card.is-large .card-content {
  min-height: 360px;
}

.translated-text {
  width: 100%;
  min-height: 120px;
  max-height: 400px;
  padding: 6px;
  box-sizing: border-box;
  border: none;
  background: transparent;
  font-size: 12px;
  line-height: 1.5;
  resize: none;
  font-family: inherit;
  color: #333;
  cursor: text;
  overflow-y: auto;
}

.translation-card.is-large .translated-text {
  min-height: 360px;
  max-height: none;
  font-size: 14px;
  padding: 12px;
}

.translated-text:focus {
  outline: none;
}

.translated-text:disabled {
  cursor: wait;
  opacity: 0.6;
}

.translated-text::placeholder {
  color: #bbb;
}

.error-message {
  padding: 8px;
  background-color: #fff2f0;
  border-radius: 4px;
  border: 1px solid #ffccc7;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.translation-card.is-large .error-message {
  min-height: 360px;
}
</style>
