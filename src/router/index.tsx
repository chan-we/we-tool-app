import { createBrowserRouter } from 'react-router-dom'
import MainPage from '../views/MainPage/MainPage'
import VideoPage from '../views/VideoPage/VideoPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainPage />,
  },
  {
    path: '/video',
    element: <VideoPage />,
  },
])
