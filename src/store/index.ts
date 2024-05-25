import globalOptionSlice from './slice/globalOptionSlice'
import { configureStore } from '@reduxjs/toolkit'

const store = configureStore({
  reducer: { globalOption: globalOptionSlice },
})

export default store
