/**
 * 操作权限处理
 */
import { useUserStore } from '@/store/user'

export default {
  mounted(el, binding) {
    const { value } = binding
    const permissions = useUserStore().permissions

    if (value && value instanceof Array && value.length > 0) {
      const hasPermission = permissions.some(permission => {
        return value.includes(permission)
      })

      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error('需要指定权限标识!')
    }
  }
} 