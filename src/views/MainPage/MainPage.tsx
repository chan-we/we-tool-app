import { Input, Button, List, message, Image, Checkbox, Select } from 'antd'
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
} from '@tauri-apps/api/fs'
import { basename } from '@tauri-apps/api/path'
import OptionBar from './components/OptionBar'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { SelectType } from '../../utils/enum'
import { selectTypeOptions } from '../../utils/const'
import { moveFiles } from '../../utils/file'
import { IWeItem } from '../../types/weList'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'

const MainPage = () => {
  const searchDirPath = useRef('')
  // const [searchValue, setSearchValue] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
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

  const searchDir = async () => {
    setSearchLoading(true)
    const path = searchDirPath.current as string

    try {
      const isExist = await exists(path)

      if (isExist) {
        loadDir(path)
      } else {
        message.error(`文件夹 ${path} 不存在`, 1)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSearchLoading(false)
    }
  }

  const readIgnoreFile = async (path: string) => {
    try {
      const data = await readTextFile(path)
      setIgnoreItems(
        data
          .toString()
          .split('\n')
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
    setIgnoreFilePath(`${path}/.weignore`)
    setLoading(true)
    const ignoreFileExist = await exists(`${path}/.weignore`)
    if (ignoreFileExist) {
      readIgnoreFile(`${path}/.weignore`)
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
        preview: `${path}/${json.preview}`,
        fullPath: `${path}/${json.file}`,
      }
    }

    return Promise.reject()
  }

  const changeIgnoreState = (item: IWeItem) => {
    const { key } = item
    if (ignoreItems.includes(key)) {
      setIgnoreItems(ignoreItems.filter((i) => i !== key))
    } else {
      setIgnoreItems(ignoreItems.concat(key))
    }
  }

  const renderListItem = (item: IWeItem) => {
    return (
      <List.Item
        key={item.key}
        className={[
          'main-page-weitem',
          ignoreItems.includes(item.key) ? 'main-page-weitem-ignore' : '',
        ].join(' ')}
        actions={[
          <Button icon={<FolderOpenOutlined />} shape='circle' />,
          <Button
            icon={
              ignoreItems.includes(item.key) ? (
                <EyeOutlined />
              ) : (
                <EyeInvisibleOutlined />
              )
            }
            shape='circle'
            onClick={() => {
              changeIgnoreState(item)
            }}
          />,
          <Button
            className='main-page-weitem-delete'
            icon={<DeleteOutlined />}
            shape='circle'
            type='primary'
            danger
          />,
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
            />
          }
          description={item.fullPath}
        />
      </List.Item>
    )
  }

  useEffect(() => {
    if (!ignoreFilePath) return
    writeTextFile(ignoreFilePath, ignoreItems.join('\n'))
  }, [ignoreItems, ignoreFilePath])

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
  }, [checkedItems, weItems, ignoreItems])

  useEffect(() => {
    console.log(checkedItems)
  }, [checkedItems])

  const handleMove = () => {
    moveFiles(
      'D:\\my_file\\mmd',
      checkedItems.map((i) => i.fullPath!)
    )
  }

  const selectWEFolder = async () => {
    const data = await open({
      directory: true,
    })

    console.log(data)
    // setSearchValue(data as string)
    searchDirPath.current = data as string

    setTimeout(() => {
      searchDir()
    }, 0)
  }

  return (
    <div className='main-page'>
      <Input.Group compact className='main-page-input'>
        <Input
          type='text'
          style={{ width: 'calc(100% - 200px)' }}
          placeholder={'请输入文件夹路径'}
          onChange={(e) => {
            searchDirPath.current = e.target.value
          }}
          value={searchDirPath.current}
        />
        <Button type='primary' onClick={searchDir} loading={searchLoading}>
          搜索
        </Button>
        <Button icon={<FolderOpenOutlined />} onClick={selectWEFolder} />,
      </Input.Group>
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
        />
      </Checkbox.Group>
    </div>
  )
}

export default MainPage
