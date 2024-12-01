import { SettingOutlined } from '@ant-design/icons'
import { Dropdown, MenuProps, Modal } from 'antd'
import useUpdate from '@/hooks/useUpdate'
import { getVersion } from '@tauri-apps/api/app'

const SettingMenu = () => {
  const { handleUpdate } = useUpdate()

  const items: MenuProps['items'] = [
    {
      key: 'check-update',
      label: '检查更新',
    },
    {
      key: 'version',
      label: '版本信息',
    },
  ]

  const handleGetVersion = async () => {
    const version = await getVersion()
    // message.info(`当前版本：${version}`)
    Modal.info({
      title: '版本信息',
      content: `当前版本：${version}`,
    })
  }

  const onClick: MenuProps['onClick'] = ({ key }) => {
    console.log('onClick', key)
    if (key === 'check-update') {
      // emit('tauri://update')
      handleUpdate()
    } else if (key === 'version') {
      handleGetVersion()
    }
  }

  return (
    <Dropdown menu={{ items, onClick }}>
      <SettingOutlined />
    </Dropdown>
  )
}

export default SettingMenu
