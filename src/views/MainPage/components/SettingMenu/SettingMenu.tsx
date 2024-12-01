import { SettingOutlined } from '@ant-design/icons'
import { emit } from '@tauri-apps/api/event'
import { Dropdown, MenuProps } from 'antd'
import useUpdate from '@/hooks/useUpdate'

const SettingMenu = () => {
  const { handleUpdate } = useUpdate()

  const items: MenuProps['items'] = [
    {
      key: 'check-update',
      label: '检查更新',
    },
  ]

  const onClick: MenuProps['onClick'] = ({ key }) => {
    console.log('onClick', key)
    if (key === 'check-update') {
      // emit('tauri://update')
      handleUpdate()
    }
  }

  return (
    <Dropdown menu={{ items, onClick }}>
      <SettingOutlined />
    </Dropdown>
  )
}

export default SettingMenu
