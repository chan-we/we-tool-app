import { createSlice } from '@reduxjs/toolkit'
import { GlobalOptionKey } from '@/utils/enum'

export const globalOptionSlice = createSlice({
  name: 'globalOption',
  initialState: {
    value: {
      [GlobalOptionKey.HideIgnore]: true,
    },
  },
  reducers: {
    setGlobalOption(state, action) {
      state.value = { ...state.value, ...action.payload }
    },
  },
})

export const { setGlobalOption } = globalOptionSlice.actions
export default globalOptionSlice.reducer
