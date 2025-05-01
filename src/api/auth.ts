import httpInstance from "@/utils/http";

export const loginApi = (data: any) => {
  return httpInstance.post("/auth/login", data);
};

export const getUserInfoApi = () => {
  return httpInstance.get("/auth/info");
};

export const getCaptchaApi = () => {
  return httpInstance.get("/auth/captcha");
};
