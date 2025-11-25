// 火山引擎翻译 API
// 需要依赖：axios, crypto-js (项目已安装)

import axios from "axios";
import CryptoJS from "crypto-js";

const VOLCENGINE_API = "https://translate.volcengineapi.com/";
const SERVICE = "translate";
const REGION = "cn-north-1";
const VERSION = "2020-06-01";
const ACTION = "TranslateText";

/**
 * 火山引擎签名算法
 * 参考：https://www.volcengine.com/docs/6369/67269?lang=zh
 */
function signRequest(accessKeyId: string, secretAccessKey: string, method: string, uri: string, queryString: string, headers: Record<string, string>, payload: string): string {
  // 1. 构造规范请求
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key.toLowerCase()}:${headers[key].trim()}\n`)
    .join("");

  const signedHeaders = Object.keys(headers)
    .sort()
    .map((key) => key.toLowerCase())
    .join(";");

  const hashedPayload = CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);

  const canonicalRequest = [method, uri, queryString, canonicalHeaders, signedHeaders, hashedPayload].join("\n");

  // 2. 创建待签名字符串
  const algorithm = "HMAC-SHA256";
  const timestamp = headers["X-Date"] || new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const date = timestamp.substring(0, 8);
  const credentialScope = `${date}/${REGION}/${SERVICE}/request`;

  const stringToSign = [algorithm, timestamp, credentialScope, CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex)].join("\n");

  // 3. 计算签名
  // 注意：crypto-js 的 HmacSHA256 返回 WordArray，需要转换为十六进制字符串用于后续计算
  const kDate = CryptoJS.HmacSHA256(date, secretAccessKey);
  const kRegion = CryptoJS.HmacSHA256(REGION, kDate);
  const kService = CryptoJS.HmacSHA256(SERVICE, kRegion);
  const kSigning = CryptoJS.HmacSHA256("request", kService);
  // 最后一步的签名需要转换为十六进制字符串
  const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString(CryptoJS.enc.Hex);

  // 4. 构造 Authorization 头部
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return authorization;
}

/**
 * 语言代码映射：将通用语言代码转换为火山引擎支持的语言代码
 */
function mapLanguageCode(code: string): string {
  const languageMap: Record<string, string> = {
    auto: "", // 空字符串表示自动检测
    zh: "zh",
    en: "en",
    jp: "ja", // 火山引擎使用 ja 而不是 jp
    ja: "ja",
  };
  return languageMap[code] || code;
}

/**
 * 火山引擎翻译
 * @param text 要翻译的文本
 * @param from 源语言，默认 auto（自动检测）
 * @param to 目标语言，例如 zh / en
 */
export async function volcengineTranslate(text: string, from = "auto", to = "zh") {
  const ACCESS_KEY_ID = JSON.parse(utools.dbStorage.getItem("normalTranslators")).volcengine.accessKeyId || "";
  const SECRET_ACCESS_KEY = JSON.parse(utools.dbStorage.getItem("normalTranslators")).volcengine.secretAccessKey || "";

  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    return "AccessKey ID 或 Secret Access Key 为空";
  }

  // 准备请求参数
  const sourceLanguage = mapLanguageCode(from);
  const targetLanguage = mapLanguageCode(to);

  // 构造请求体
  const requestBody: any = {
    TargetLanguage: targetLanguage,
    TextList: [text], // 单条文本，也可以支持批量
  };

  // 如果指定了源语言（非自动检测），则添加 SourceLanguage
  if (sourceLanguage && sourceLanguage !== "auto") {
    requestBody.SourceLanguage = sourceLanguage;
  }

  const payload = JSON.stringify(requestBody);

  // 构造查询字符串
  const queryString = `Action=${ACTION}&Version=${VERSION}`;

  // 构造请求头
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Date": timestamp,
    Host: "translate.volcengineapi.com",
  };

  // 计算签名
  const authorization = signRequest(ACCESS_KEY_ID, SECRET_ACCESS_KEY, "POST", "/", queryString, headers, payload);

  // 添加 Authorization 头部
  headers["Authorization"] = authorization;

  try {
    const res = await axios.post(VOLCENGINE_API + "?" + queryString, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Date": timestamp,
        Authorization: authorization,
      },
    });

    return res.data;
  } catch (error: any) {
    // 处理错误响应
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.ResponseMetadata?.Error) {
        const err = errorData.ResponseMetadata.Error;
        return {
          error: true,
          error_msg: `${err.Code}: ${err.Message}`,
        };
      }
    }
    throw error;
  }
}
