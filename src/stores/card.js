import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useBoardStore } from './board'

export const useCardStore = defineStore('card', () => {
  const boardStore = useBoardStore()
  const selected = ref(null)

  const selectedCard = computed(() => {
    if (!selected.value) {
      return null
    }

    return boardStore.getCard(selected.value.boardId, selected.value.listId, selected.value.cardId)
  })

  function openCard(payload) {
    selected.value = {
      boardId: payload.boardId,
      listId: payload.listId,
      cardId: payload.cardId
    }
  }

  function closeCard() {
    selected.value = null
  }

  function updateSelectedCard(payload) {
    if (!selected.value) {
      return
    }

    boardStore.updateCard(selected.value.boardId, selected.value.listId, selected.value.cardId, payload)
  }

  function deleteSelectedCard() {
    if (!selected.value) {
      return
    }

    boardStore.deleteCard(selected.value.boardId, selected.value.listId, selected.value.cardId)
    closeCard()
  }

  function archiveSelectedCard() {
    if (!selected.value) {
      return null
    }

    const result = boardStore.archiveCard(selected.value.boardId, selected.value.listId, selected.value.cardId)
    closeCard()
    return result
  }

  return {
    selected,
    selectedCard,
    openCard,
    closeCard,
    updateSelectedCard,
    deleteSelectedCard,
    archiveSelectedCard
  }
})
