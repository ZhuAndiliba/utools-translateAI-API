import { defineStore } from "pinia";
import { aiTranslateApi } from "../api/aiTranslateApi";
import { baiduTranslate } from "../api/baidu";
import { volcengineTranslate } from "../api/volcengine";
// 语言选项定义
export const languageOptions = [
  { label: "自动-中文", from: "auto", to: "zh", fromName: "自动检测", toName: "中文" },
  { label: "英文-中文", from: "en", to: "zh", fromName: "英文", toName: "中文" },
  { label: "日文-中文", from: "jp", to: "zh", fromName: "日文", toName: "中文" },
  { label: "中文-英文", from: "zh", to: "en", fromName: "中文", toName: "英文" },
  { label: "中文-日文", from: "zh", to: "jp", fromName: "中文", toName: "日文" },
];

export const useAppStore = defineStore("app", {
  state: () => ({
    AITranslators: [],
    normalTranslators: {
      baidu: {
        appid: "",
        key: "",
        isActive: true,
        translatedText: "",
        loading: false,
        error: "",
      },
      volcengine: {
        accessKeyId: "",
        secretAccessKey: "",
        isActive: false,
        translatedText: "",
        loading: false,
        error: "",
      },
    },
    selectedLanguageOption: languageOptions[0], // 默认选择"自动-中文"
  }),
  actions: {
    init() {
      this.AITranslators = JSON.parse(utools.dbStorage.getItem("AITranslators") || "[]");
      if (utools.dbStorage.getItem("normalTranslators")) {
        const stored = JSON.parse(utools.dbStorage.getItem("normalTranslators"));
        // 检查并合并每个翻译器，确保所有翻译器都存在
        if (stored.baidu) {
          this.normalTranslators.baidu = { ...this.normalTranslators.baidu, ...stored.baidu };
        }
        if (stored.volcengine) {
          this.normalTranslators.volcengine = { ...this.normalTranslators.volcengine, ...stored.volcengine };
        }
      } else {
        utools.dbStorage.setItem("normalTranslators", JSON.stringify(this.normalTranslators));
      }
      // 加载保存的语言选择
      const savedLanguage = utools.dbStorage.getItem("selectedLanguageOption");
      if (savedLanguage) {
        const parsed = JSON.parse(savedLanguage);
        const found = languageOptions.find((opt) => opt.label === parsed.label);
        if (found) {
          this.selectedLanguageOption = found;
        }
      }
    },
    saveNormalTranslators() {
      utools.dbStorage.setItem("normalTranslators", JSON.stringify(this.normalTranslators));
    },
    saveAITranslators() {
      utools.dbStorage.setItem("AITranslators", JSON.stringify(this.AITranslators));
    },
    saveLanguageOption() {
      utools.dbStorage.setItem("selectedLanguageOption", JSON.stringify(this.selectedLanguageOption));
    },
    async translate(text: string, fromLanguage?: string, toLanguage?: string) {
      const promises: Promise<any>[] = [];

      // 百度翻译
      if (this.normalTranslators.baidu.isActive) {
        this.normalTranslators.baidu.loading = true;
        this.normalTranslators.baidu.translatedText = "";
        this.normalTranslators.baidu.error = "";

        const baiduPromise = baiduTranslate(text, fromLanguage ?? "auto", toLanguage ?? "zh")
          .then((res) => {
            // 处理返回字符串的情况（错误情况）
            if (typeof res === "string") {
              this.normalTranslators.baidu.error = res;
            } else if (res.trans_result) {
              for (const item of res.trans_result) {
                this.normalTranslators.baidu.translatedText += item.dst + "\n";
              }
            } else {
              this.normalTranslators.baidu.error = res.error_msg || "翻译失败，请检查配置";
            }
          })
          .catch((error: any) => {
            this.normalTranslators.baidu.error = error.message || "翻译失败，请检查网络连接";
          })
          .finally(() => {
            this.normalTranslators.baidu.loading = false;
          });

        promises.push(baiduPromise);
      }

      // 火山引擎翻译
      if (this.normalTranslators.volcengine.isActive) {
        this.normalTranslators.volcengine.loading = true;
        this.normalTranslators.volcengine.translatedText = "";
        this.normalTranslators.volcengine.error = "";

        const volcenginePromise = volcengineTranslate(text, fromLanguage ?? "auto", toLanguage ?? "zh")
          .then((res) => {
            // 处理返回字符串的情况（错误情况）
            if (typeof res === "string") {
              this.normalTranslators.volcengine.error = res;
            } else if (res.error) {
              // 处理错误响应
              this.normalTranslators.volcengine.error = res.error_msg || "翻译失败，请检查配置";
            } else if (res.TranslationList && res.TranslationList.length > 0) {
              // 处理成功响应
              for (const item of res.TranslationList) {
                this.normalTranslators.volcengine.translatedText += item.Translation + "\n";
              }
            } else {
              this.normalTranslators.volcengine.error = "翻译失败，请检查配置";
            }
          })
          .catch((error: any) => {
            this.normalTranslators.volcengine.error = error.message || "翻译失败，请检查网络连接";
          })
          .finally(() => {
            this.normalTranslators.volcengine.loading = false;
          });

        promises.push(volcenginePromise);
      }

      // AI翻译器
      const activeTranslators = this.AITranslators.filter((t) => t.isActive);
      // 初始化所有翻译器状态
      activeTranslators.forEach((translator) => {
        translator.loading = true;
        translator.translatedText = "";
        translator.error = "";
      });

      // 获取语言名称
      const getLanguageName = (code: string, isFrom: boolean) => {
        if (isFrom && code === "auto") return "原文";
        const option = languageOptions.find((opt) => (isFrom ? opt.from : opt.to) === code);
        if (option) {
          return isFrom ? option.fromName : option.toName;
        }
        // 回退到代码映射
        const nameMap: Record<string, string> = {
          en: "英文",
          jp: "日文",
          zh: "中文",
        };
        return nameMap[code] || code;
      };

      // 并行执行所有AI翻译器
      const aiPromises = activeTranslators.map((translator) =>
        aiTranslateApi({
          messages: [
            {
              role: "system",
              content: "你是一个精准的翻译助手，只返回译文结果。",
            },
            {
              role: "user",
              content: `请将${getLanguageName(fromLanguage ?? "auto", true)}翻译为${getLanguageName(toLanguage ?? "zh", false)}：${text}`,
            },
          ],
          model: translator.model,
          apiKey: translator.apiKey,
          baseURL: translator.baseURL,
          onAnswerChunk: (chunk) => {
            translator.translatedText += chunk;
          },
        })
          .catch((error: any) => {
            // 只打印错误消息，不打印整个错误对象，避免泄露敏感信息
            console.error("翻译失败:", error?.message || "未知错误");
            translator.error = error?.message || "翻译失败，请检查配置";
          })
          .finally(() => {
            translator.loading = false;
          })
      );

      promises.push(...aiPromises);

      // 并行执行所有翻译器（包括百度翻译和AI翻译器）
      await Promise.allSettled(promises);
    },
  },
});
