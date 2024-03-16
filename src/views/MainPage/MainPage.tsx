import { Input, Button, List, message, Image, Checkbox, Select } from 'antd'
import { useEffect, useState } from 'react'
import './index.less'
import {
  DeleteOutlined,
  FolderOpenOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import OptionBar from './components/OptionBar'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { SelectType } from '../../utils/enum'
import { selectTypeOptions } from '../../utils/const'
import { moveFiles } from '../../utils/file'
import { IWeItem } from '@/types/weList'

// const shell = require('electron').shell;
const fs = window.__TAURI__.fs
const pathFn = window.__TAURI__.path

console.log('fs', fs)

const MainPage = () => {
  const [searchValue, setSearchValue] = useState('')
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

  const searchDir = () => {
    setSearchLoading(true)
    const path = searchValue
    fs.exists(path, (exists: boolean) => {
      setSearchLoading(false)
      if (exists) {
        loadDir(path)
      } else {
        message.error(`文件夹 ${path} 不存在`, 1)
      }
    })
  }

  const readIgnoreFile = (path: string) => {
    const data = fs.readFileSync(path)
    setIgnoreItems(
      data
        .toString()
        .split('\n')
        .map((i) => i.trim().replace('\\r', ''))
    )
  }

  /**
   * 读取wallpaper存放路径
   * @param path
   */
  const loadDir = (path) => {
    console.log(`读取 ${path}`)
    setIgnoreFilePath(`${path}/.weignore`)
    setLoading(true)
    const ignoreFileExist = fs.existsSync(`${path}/.weignore`)
    if (ignoreFileExist) {
      readIgnoreFile(`${path}/.weignore`)
    }

    fs.readdir(path, (err, data) => {
      if (err) {
        message.error(err)
      } else {
        const promises = data.map((item) => loadWeItems(`${path}/${item}`))
        Promise.allSettled(promises)
          .then((data) => {
            setWeItems(
              data
                .filter((item) => item.status === 'fulfilled')
                .map((item: any) => item.value)
            )
          })
          .catch((err) => {
            console.error(err)
          })
          .finally(() => {
            setLoading(false)
          })
      }
    })
  }

  const loadWeItems = (path): Promise<IWeItem> => {
    const settingPath = `${path}/project.json`
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        if (err) {
          message.error(err)
          console.error(err)
          reject(null)
        } else if (stats.isDirectory()) {
          fs.exists(settingPath, (exists) => {
            if (!exists) {
              reject(null)
              return
            }

            fs.readFile(settingPath, (err, data) => {
              if (err) {
                message.error(err)
                reject(err)
                return
              }

              const key = pathFn.basename(path)

              const json = JSON.parse(data) as any
              resolve({
                title: json.title,
                key,
                preview: `${path}/${json.preview}`,
                fullPath: `${path}/${json.file}`,
              })
            })
          })
        } else {
          reject(null)
        }
      })
    })
  }

  const changeIgnoreState = (item: IWeItem) => {
    const { key } = item
    if (ignoreItems.includes(key)) {
      setIgnoreItems(ignoreItems.filter((i) => i !== key))
    } else {
      setIgnoreItems(ignoreItems.concat(key))
    }
  }

  const renderListItem = (item) => {
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
          avatar={<Image width={100} preview={false} src={item.preview} />}
          description={item.fullPath}
        />
      </List.Item>
    )
  }

  useEffect(() => {
    if (!ignoreFilePath) return
    fs.writeFileSync(ignoreFilePath, ignoreItems.join('\n'))
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

  return (
    <div className='main-page'>
      <Input.Group compact className='main-page-input'>
        <Input
          type='text'
          style={{ width: 'calc(100% - 200px)' }}
          placeholder={'请输入文件夹路径'}
          onChange={(e) => {
            setSearchValue(e.target.value)
          }}
        />
        <Button type='primary' onClick={searchDir} loading={searchLoading}>
          搜索
        </Button>
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
