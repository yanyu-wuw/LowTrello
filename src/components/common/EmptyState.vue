<template>
  <section class="empty-state">
    <h3>{{ resolvedTitle }}</h3>
    <p>{{ resolvedDescription }}</p>
    <slot />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../../stores/user'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
})

const userStore = useUserStore()
const t = userStore.t

const resolvedTitle = computed(() => props.title || t('emptyState.title'))
const resolvedDescription = computed(() => props.description || t('emptyState.description'))
</script>

<style scoped>
.empty-state {
  border: 1px dashed #c7d6eb;
  background: #f6f9ff;
  border-radius: 14px;
  padding: 20px;
  text-align: center;
}

.empty-state h3 {
  margin: 0;
  font-size: 18px;
  color: #23416a;
}

.empty-state p {
  margin: 8px 0 0;
  color: #5d6f8b;
}
</style>
