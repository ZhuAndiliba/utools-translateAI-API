// 需要先安装依赖（在项目根目录执行）：
// npm install axios crypto-js

import axios from "axios";
import MD5 from "crypto-js/md5";

const BAIDU_API = "https://fanyi-api.baidu.com/api/trans/vip/translate";

/**
 * 百度翻译
 * @param q    要翻译的文本
 * @param from 源语言，默认 auto
 * @param to   目标语言，例如 zh / en
 */
export async function baiduTranslate(q: string, from = "auto", to = "zh") {
  const BAIDU_APP_ID = JSON.parse(utools.dbStorage.getItem("normalTranslators")).baidu.appid || "";
  const BAIDU_SECRET_KEY = JSON.parse(utools.dbStorage.getItem("normalTranslators")).baidu.key || "";

  if (BAIDU_APP_ID == "" || BAIDU_SECRET_KEY == "") {
    return "id或者key为空";
  }
  const salt = Date.now().toString();
  // 百度签名 = md5(appid+q+salt+密钥)
  const sign = MD5(BAIDU_APP_ID + q + salt + BAIDU_SECRET_KEY).toString();
  const form = new URLSearchParams();
  form.append("q", q);
  form.append("from", from);
  form.append("to", to);
  form.append("appid", BAIDU_APP_ID);
  form.append("salt", salt);
  form.append("sign", sign);
  // 下面这些参数按需填写或留空
  form.append("tts", "");
  form.append("dict", "");
  form.append("action", "");

  const res = await axios.post(BAIDU_API, form, {
    headers: {
      Accept: "*/*",
    },
  });
  //console.log(res);
  return res.data;
}
