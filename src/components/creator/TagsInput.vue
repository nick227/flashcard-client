<template>
  <div class="tags-input">
    <div class="input-row">
      <input
        ref="inputRef"
        v-model="input"
        @keydown.enter.prevent="addTag"
        @keydown.tab.prevent="addTag"
        @keydown.comma.prevent="addTag"
        @blur="addTag"
        @input="onInput"
        class="tag-input"
        placeholder="Add tag..."
        autocomplete="off"
        maxlength="20"
      />
    </div>
    <ul v-if="showSuggestions" class="suggestions-list">
      <li v-for="suggestion in filteredSuggestions" :key="suggestion" @mousedown.prevent="selectSuggestion(suggestion)">
        {{ suggestion }}
      </li>
    </ul>
    <TagsList :tags="tags" :removable="true" @remove="removeTag" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TagsList from '@/components/common/TagsList.vue'
import { removeTagFromSet } from '@/api'

const props = defineProps<{ 
  availableTags: string[], 
  modelValue: string[],
  setId: number 
}>()
const emit = defineEmits(['update:modelValue'])

const tags = ref([...props.modelValue])
const input = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.modelValue, (val) => { tags.value = [...val] })

const filteredSuggestions = computed(() => {
  const lowerInput = input.value.toLowerCase()
  return props.availableTags
    .filter(tag => tag.toLowerCase().includes(lowerInput) && !tags.value.includes(tag))
    .slice(0, 5)
})
const showSuggestions = computed(() => input.value.length > 0 && filteredSuggestions.value.length > 0)

function addTag() {
  const newTag = input.value.trim().slice(0, 20)
  if (newTag && !tags.value.includes(newTag)) {
    tags.value.push(newTag)
    emit('update:modelValue', [...tags.value])
  }
  input.value = ''
}
async function removeTag(tag: string) {
  if (props.setId) {
    try {
      await removeTagFromSet(props.setId, tag)
    } catch (error) {
      console.error('Failed to remove tag:', error)
      return
    }
  }
  tags.value = tags.value.filter(t => t !== tag)
  emit('update:modelValue', [...tags.value])
}
function selectSuggestion(suggestion: string) {
  if (!tags.value.includes(suggestion)) {
    tags.value.push(suggestion)
    emit('update:modelValue', [...tags.value])
  }
  input.value = ''
  inputRef.value?.focus()
}
function onInput() {
  if (input.value.length > 20) input.value = input.value.slice(0, 20)
}

</script>

<style scoped>
.tags-input {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
  position: relative;
}
.input-row {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 0.5rem;
  padding: 0.25rem 0.75rem;
  min-height: 2.2rem;
  width: 220px;
  max-width: 100%;
  box-shadow: 0 1px 2px 0 rgba(30,41,59,0.03);
}
.tag-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.98em;
  min-width: 80px;
  max-width: 180px;
  flex: 1;
  padding: 0.2rem 0;
  color: #2563eb;
}
.tag-input:focus, .tag-input:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
.suggestions-list {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-top: 0.1rem;
  box-shadow: 0 2px 8px 0 rgba(30,41,59,0.08);
  list-style: none;
  padding: 0.25rem 0;
  max-width: 220px;
  z-index: 10;
  position: absolute;
}
.suggestions-list li {
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: #2563eb;
  font-weight: 500;
  font-size: 0.97em;
}
.suggestions-list li:hover {
  background: #f1f5f9;
}
</style> 