import { ref } from 'vue'

type ToastType = 'success' | 'error' | 'info'
interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToaster() {
  function toast(message: string, type: ToastType = 'info') {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => remove(id), 3000)
  }
  function remove(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }
  return { toasts, toast, remove }
} 