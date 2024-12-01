import { FolderOpenOutlined } from '@ant-design/icons'
import { Button, Input } from 'antd'
import { useState } from 'react'
import { open } from '@tauri-apps/api/dialog'

const SearchBar: React.FC<{
  onChange: (v: string) => void
}> = (props) => {
  const [path, setPath] = useState('')

  const selectWEFolder = async () => {
    const data = await open({
      directory: true,
    })

    setPath(data as string)
    props.onChange(data as string)
  }

  const handleClick = () => {
    props.onChange(path)
  }

  return (
    <Input.Group compact className='main-page-input'>
      <Input
        type='text'
        style={{ width: 'calc(100% - 200px)' }}
        placeholder={'请输入文件夹路径'}
        onChange={(e) => {
          // searchDirPath.current = e.target.value
          setPath(e.target.value)
        }}
        value={path}
      />
      <Button type='primary' onClick={handleClick}>
        搜索
      </Button>
      <Button icon={<FolderOpenOutlined />} onClick={selectWEFolder} />,
    </Input.Group>
  )
}

export default SearchBar
