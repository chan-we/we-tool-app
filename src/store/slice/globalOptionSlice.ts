import { createSlice } from '@reduxjs/toolkit'

export const globalOptionSlice = createSlice({
  name: 'globalOption',
  initialState: {
    value: {},
  },
  reducers: {
    setGlobalOption(state, action) {
      state.value = { ...state.value, ...action.payload }
    },
  },
})

export const { setGlobalOption } = globalOptionSlice.actions
export default globalOptionSlice.reducer
