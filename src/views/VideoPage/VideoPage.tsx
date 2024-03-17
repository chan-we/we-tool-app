import { convertFileSrc } from '@tauri-apps/api/tauri'
import { useSearchParams } from 'react-router-dom'
import './index.less'

const VideoPage = () => {
  const [searchParams] = useSearchParams()

  return (
    <div className='video-page'>
      <video
        controls
        autoPlay
        src={convertFileSrc(searchParams.get('path') as string)}
        playsInline
      ></video>
    </div>
  )
}

export default VideoPage
