import {
  Input,
  Button,
  List,
  message,
  Image,
  Checkbox,
  Select,
  Popconfirm,
} from 'antd'
import { useEffect, useRef, useState } from 'react'
import './index.less'
import {
  DeleteOutlined,
  FolderOpenOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import {
  exists,
  readTextFile,
  readDir,
  writeTextFile,
  removeDir,
} from '@tauri-apps/api/fs'
import { basename } from '@tauri-apps/api/path'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { SelectType, GlobalOptionKey } from '@/utils/enum'
import { selectTypeOptions } from '@/utils/const'
import { moveFiles } from '@/utils/file'
import { IWeItem } from '@/types/weList'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import { WebviewWindow } from '@tauri-apps/api/window'
import { useSelector } from 'react-redux'
import OptionBar from './components/OptionBar'
import SearchBar from './components/SearchBar'

const MainPage = () => {
  // const searchDirPath = useRef('')
  const [searchDirPath, setSearchDirPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [weItems, setWeItems] = useState<IWeItem[]>([])
  const [ignoreFilePath, setIgnoreFilePath] = useState<string>()
  const [ignoreItems, setIgnoreItems] = useState<string[]>([])
  const [checkedItems, setCheckedItems] = useState<IWeItem[]>([])
  const [selectType, setSelectType] = useState<SelectType>(SelectType.All)
  const [checkAllState, setCheckAllState] = useState<{
    indeterminate: boolean
    checked: boolean
  }>({
    indeterminate: false,
    checked: false,
  })

  const globalOption = useSelector((state: any) => state.globalOption.value)

  const searchDir = async (path?: string) => {
    const dir = path || searchDirPath

    try {
      const isExist = await exists(dir)

      if (isExist) {
        loadDir(dir)
      } else {
        message.error(`文件夹 ${path} 不存在`, 1)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const readIgnoreFile = async (path: string) => {
    try {
      const data = await readTextFile(path)
      setIgnoreItems(
        data
          .toString()
          .split(',')
          .map((i: string) => i.trim().replace('\\r', ''))
      )
    } catch (e) {
      console.error('readIgnoreFile', e)
    }
  }

  /**
   * 读取wallpaper存放路径
   * @param path
   */
  const loadDir = async (path: string) => {
    console.log(`读取 ${path}`)
    const iPath = `${path}/.weignore`
    setIgnoreFilePath(iPath)
    setLoading(true)
    if (await exists(iPath)) {
      readIgnoreFile(iPath)
    }

    const data = await readDir(path)

    const promises = data.map((item) => loadWeItems(item.path))
    Promise.allSettled(promises)
      .then((data) => {
        const items = data
          .filter((item) => item.status === 'fulfilled')
          .map((item: any) => item.value)
        setWeItems(items)
      })
      .catch((err) => {
        message.error(err)
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const loadWeItems = async (path: string): Promise<IWeItem> => {
    const settingPath = `${path}/project.json`

    const isExist = await exists(settingPath)

    if (isExist) {
      const data = await readTextFile(settingPath)

      const key = await basename(path)

      const json = JSON.parse(data) as any
      return {
        title: json.title,
        key,
        preview: `${path}\\${json.preview}`,
        folderPath: path,
        fullPath: `${path}\\${json.file}`,
      }
    }

    return Promise.reject()
  }

  const changeIgnoreState = (item: IWeItem) => {
    const { key } = item

    let items = ignoreItems

    if (items.includes(key)) {
      items = ignoreItems.filter((i) => i !== key)
    } else {
      items = ignoreItems.concat(key)
    }

    setIgnoreItems(items)

    if (ignoreFilePath) {
      setTimeout(() => {
        writeTextFile(ignoreFilePath, items.join(','))
      }, 0)
    }
  }

  const openVideo = async (path: string) => {
    console.log('open video', path)
    // shellOpen(path)
    const webview = new WebviewWindow('video', {
      url: `/video?path=${path}`,
      maximized: true,
    })

    webview.once('tauri://created', function () {
      console.log('created')
    })
    webview.once('tauri://error', function (e: any) {
      console.error('error', e)
    })
  }

  const handleRemoveDir = (path: string) => {
    return removeDir(path, { recursive: true })
      .then(() => {
        message.success('删除成功')
        searchDir()
      })
      .catch((e) => {
        message.error(e.message)
      })
  }

  const handleSearchChange = (path: string) => {
    searchDir(path)
    setSearchDirPath(path)
  }

  const renderListItem = (item: IWeItem) => {
    const ignored = ignoreItems.includes(item.key)
    if (ignored && globalOption[GlobalOptionKey.HideIgnore]) {
      return <></>
    }

    return (
      <List.Item
        key={item.key}
        className={[
          'main-page-weitem',
          ignored ? 'main-page-weitem-ignore' : '',
        ].join(' ')}
        actions={[
          <Button icon={<FolderOpenOutlined />} shape='circle' />,
          <Button
            icon={ignored ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            shape='circle'
            onClick={() => {
              changeIgnoreState(item)
            }}
          />,
          <Popconfirm
            title='确定删除？'
            onConfirm={() => handleRemoveDir(item.folderPath as string)}
          >
            <Button
              className='main-page-weitem-delete'
              icon={<DeleteOutlined />}
              shape='circle'
              type='primary'
              danger
            />
          </Popconfirm>,
        ]}
      >
        <Checkbox value={item.key} style={{ padding: '16px' }} />
        <List.Item.Meta
          title={item.title}
          avatar={
            <Image
              width={100}
              preview={false}
              src={convertFileSrc(item.preview)}
              onClick={() => openVideo(item.fullPath as string)}
            />
          }
          description={item.fullPath}
        />
      </List.Item>
    )
  }

  const handleCheckAll = (e: CheckboxChangeEvent) => {
    if (e.target.checked) {
      if (selectType === SelectType.All) {
        setCheckedItems(weItems)
      } else if (selectType === SelectType.NoIgnore) {
        setCheckedItems(weItems.filter((i) => !ignoreItems.includes(i.key)))
      }
    } else {
      setCheckedItems([])
    }
  }

  useEffect(() => {
    let remainItems = weItems
    if (selectType === SelectType.NoIgnore) {
      remainItems = weItems.filter((i) => !ignoreItems.includes(i.key))
    }
    setCheckAllState({
      indeterminate:
        checkedItems.length > 0 && remainItems.length > checkedItems.length,
      checked: remainItems.length === checkedItems.length,
    })
  }, [checkedItems, weItems, ignoreItems, selectType])

  const handleMove = async () => {
    const path = await open({ directory: true })

    if (path) {
      // console.log(checkedItems);
      message.loading('移动中', 0)
      moveFiles(
        path as string,
        checkedItems.map((i) => i.fullPath as string)
      )
        .then(() => {
          message.destroy()
          message.success('移动完成')
          console.log('移动完成')
        })
        .catch((e) => {
          console.error(e.message)
          message.destroy()
          message.error('移动失败')
        })
    }
  }

  return (
    <div className='main-page'>
      <SearchBar onChange={handleSearchChange} />
      <OptionBar />
      <div>共{weItems.length}项</div>
      <div className='main-page-select'>
        <Checkbox
          indeterminate={checkAllState.indeterminate}
          checked={checkAllState.checked}
          onChange={handleCheckAll}
        />
        <Select
          options={selectTypeOptions}
          value={selectType}
          onChange={(v) => {
            setSelectType(v)
          }}
          style={{ width: '150px' }}
        />
        <Button onClick={handleMove}>移动</Button>
      </div>
      <Checkbox.Group
        onChange={(v) => {
          setCheckedItems(weItems.filter((i) => v.includes(i.key)))
        }}
        value={checkedItems.map((i) => i.key)}
        style={{ width: '100%' }}
      >
        <List
          itemLayout='horizontal'
          dataSource={weItems}
          renderItem={renderListItem}
          loading={loading}
          style={{ width: '100%' }}
        />
      </Checkbox.Group>
    </div>
  )
}

export default MainPage
