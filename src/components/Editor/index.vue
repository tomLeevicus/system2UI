<template>
  <div class="editor">
    <Toolbar
      class="editor-toolbar"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
      style="border-bottom: 1px solid #ccc"
    />
    <Editor
      :style="{ height: `${height}px`, 'overflow-y': 'hidden' }"
      class="editor-content"
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount, watch } from 'vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  minHeight: {
    type: Number,
    default: 192
  },
  height: {
    type: Number,
    default: 330
  },
  mode: {
    type: String,
    default: 'default' // 或 'simple'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 内容 HTML
const valueHtml = ref(props.modelValue)

// 监听值变化，同步父组件传入的内容
watch(() => props.modelValue, (val) => {
  valueHtml.value = val
})

// 工具栏配置
const toolbarConfig = {
  excludeKeys: props.disabled ? ['all'] : []
}

// 编辑器配置
const editorConfig = {
  placeholder: '请输入内容...',
  readOnly: props.disabled,
  autoFocus: false,
  MENU_CONF: {}
}

// 组件销毁时，也销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

// 编辑器创建完成时的回调
const handleCreated = (editor) => {
  editorRef.value = editor
}

// 编辑器内容变化时的回调
const handleChange = (editor) => {
  emit('update:modelValue', valueHtml.value)
  emit('change', valueHtml.value)
}
</script>

<style scoped>
.editor {
  width: 100%;
  border: 1px solid #ccc;
  z-index: 100;
}
.editor-toolbar {
  background-color: #fff;
}
.editor-content {
  background-color: #fff;
}
</style> 