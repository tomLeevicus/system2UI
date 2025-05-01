import axios from "axios";
import { useUserStore } from "@/store/user";
import JSONBIG from "json-bigint";
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ElMessage } from "element-plus";
import router from "@/router";

axios.defaults.transformResponse = [
  function (data) {
    const json = JSONBIG({
      storeAsString: true,
    });
    const res = json.parse(data);
    return res;
  },
];
// 创建一个自定义的 axios 实例
const customAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
customAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore();
    // 从 localStorage 获取 token
    const token = userStore.getToken();

    // 添加调试日志
    console.log("拦截器添加token前:", config.headers);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加调试日志
    console.log("拦截器添加token后:", config.headers);

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 定义返回数据的类型
export type ApiResponse<T = any> = [Error | null, T | null];

// 响应拦截器
customAxios.interceptors.response.use(
  // @ts-ignore
  (response: AxiosResponse): Promise<ApiResponse<any>> => {
    const { data } = response;
    console.log(data, "====data");
    const { code, msg } = data;
    if (code !== 200) {
      // if (msg == "认证失败，请重新登录") {
      //   setTimeout(() => {
      //     ElMessage.error(msg);
      //     console.log(router, "======router");

      //     // router.push("/login");
      //   }, 1000);
      // }
      if (code.includes([411, 412, 413])) {
        setTimeout(() => {
          ElMessage.error(msg);
          router.push("/login");
        }, 1000);
      }
      return Promise.resolve([data || "Error", null]);
    }
    return Promise.resolve([null, data]);
  },
  (error: AxiosError) => {
    console.log(error, "=====error");

    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页
          localStorage.removeItem("token");
          setTimeout(() => {
            // window.location.href = "/login";
          }, 1000);
          break;
        case 403:
          console.error("没有权限访问该资源");
          break;
        case 404:
          console.error("请求的资源不存在");
          break;
        case 500:
          console.error("服务器错误");
          break;
        case 411:
          router.push("/login");
          break;
        case 412:
          router.push("/login");
          break;
        case 413:
          router.push("/login");
          break;
        default:
          console.error(`其他错误：${error.message}`);
      }
    }
    return Promise.resolve([error, null]);
  }
);

// 封装请求方法
export interface ResponseData<T = any> {
  code: number;
  data: T;
  message: string;
}

// GET 请求
export const get = async <T = any>(
  url: string,
  params?: any
): Promise<ApiResponse<T>> => {
  try {
    const response: ApiResponse<T> = await customAxios.get(url, { params });
    return response;
  } catch (error) {
    return [error as Error, null];
  }
};

// POST 请求
export const post = async <T = any>(
  url: string,
  data?: any
): Promise<ApiResponse<T>> => {
  try {
    // 创建配置对象
    const config: any = {
      url,
      method: "post",
      data,
    };

    // 如果是 FormData，删除 Content-Type 让浏览器自动设置
    if (data instanceof FormData) {
      config.headers = {
        // ...(config.headers || {}),
        "Content-Type": "multipart/form-data",
      };
      // delete config.headers["Content-Type"];
    }

    const response: ApiResponse<T> = await customAxios(config);
    return response;
  } catch (error: any) {
    return [error as Error, null];
  }
};

// PUT 请求
export const put = async <T = any>(
  url: string,
  data?: any
): Promise<ApiResponse<T>> => {
  try {
    const response: ApiResponse<T> = await customAxios.put(url, data, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response;
  } catch (error) {
    return [error as Error, null];
  }
};

// DELETE 请求
export const del = async <T = any>(url: string): Promise<ApiResponse<T>> => {
  try {
    const response: ApiResponse<T> = await customAxios.delete(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response;
  } catch (error) {
    return [error as Error, null];
  }
};

// 添加上传文件的专用方法
export const upload = async <T = any>(
  url: string,
  formData: FormData
): Promise<ApiResponse<T>> => {
  try {
    // 使用 axios 默认实例直接发送 multipart 请求
    const response: ApiResponse<T> = await customAxios.post(url, formData, {
      headers: {
        // 不要手动设置 Content-Type，让浏览器自动设置
        "Content-Type": "multipart/form-data",
      },
    });
    console.log(response, "=====response");

    // 返回标准响应格式
    // const { data } = response;
    // if (data.code !== 200) {
    //   return [data, null];
    // }
    // return [null, data];
    return response;
  } catch (error: any) {
    return [error as Error, null];
  }
};

const httpInstance = {
  get,
  post,
  put,
  del,
  upload, // 添加新方法
};
export default httpInstance;
