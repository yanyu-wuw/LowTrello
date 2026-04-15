import { defineStore } from 'pinia'
import { useBoardStore } from './board'

export const useListStore = defineStore('list', () => {
  const boardStore = useBoardStore()

  function addList(boardId, title) {
    return boardStore.addList(boardId, title)
  }

  function renameList(boardId, listId, title) {
    boardStore.renameList(boardId, listId, title)
  }

  function deleteList(boardId, listId) {
    boardStore.deleteList(boardId, listId)
  }

  function copyList(boardId, listId) {
    return boardStore.copyList(boardId, listId)
  }

  function moveList(boardId, listId, targetPosition) {
    return boardStore.moveList(boardId, listId, targetPosition)
  }

  function archiveList(boardId, listId) {
    return boardStore.archiveList(boardId, listId)
  }

  function syncListOrder() {
    boardStore.touch()
  }

  return {
    addList,
    renameList,
    deleteList,
    copyList,
    moveList,
    archiveList,
    syncListOrder
  }
})
