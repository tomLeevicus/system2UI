import { defineStore, acceptHMRUpdate } from "pinia";
import { ref } from "vue";
import { getUserInfoApi } from "@/api/auth";
import { getRoutersApi } from "@/api/system";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

export const useUserStore = defineStore(
  "user",
  () => {
    const token = ref("");
    const router = useRouter();
    const menus = ref([]);
    const permissions = ref<string[]>([]);
    const setToken = (value: string) => {
      token.value = value;
    };
    const getToken = () => {
      return token.value;
    };
    const userInfo = ref({});
    const updateUserInfo = (data: any) => {
      // userInfo.value = data;
      // @ts-ignore
      Object.assign(userInfo.value.user, data);
    };
    const getUserInfo = async () => {
      const [error, res] = await getUserInfoApi();
      if (error) {
        ElMessage.error(error);
        return;
      }
      const { data } = res;
      userInfo.value = data;
      
      // 如果后端返回的用户信息中包含权限数据，则设置权限
      if (data && data.permissions) {
        permissions.value = data.permissions;
      } else {
        // 如果没有，设置一些默认权限，方便测试
        permissions.value = [
          'system:notice:list',
          'system:notice:add',
          'system:notice:edit',
          'system:notice:remove'
        ];
      }
      
      console.log(userInfo.value, "====ssssddd");
    };
    const logout = () => {
      token.value = "";
      userInfo.value = {};
      permissions.value = [];
      router.push("/login");
    };
    const getMenuList = async () => {
      const [error, res] = await getRoutersApi();
      if (error) {
        ElMessage.error(error);
        return;
      }
      const { data } = res;
      console.log(data, "====ssssddd");
      menus.value = data;
    };
    return {
      token,
      userInfo,
      menus,
      permissions,
      setToken,
      getToken,
      getUserInfo,
      logout,
      getMenuList,
      updateUserInfo,
    };
  },
  {
    persist: {
      key: "userStore",
      storage: sessionStorage,
    },
  }
);
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
export default useUserStore;
