import { Switch } from 'antd'
import { GlobalOptionKey } from '@/utils/enum'
import { useDispatch, useSelector } from 'react-redux'
import { setGlobalOption } from '@/store/slice/globalOptionSlice'

const OptionBar = () => {
  const dispatch = useDispatch()
  const globalOption = useSelector((state: any) => state.globalOption.value)


  const setHideIgnore = (checked: boolean) => {
    dispatch(
      setGlobalOption({
        [GlobalOptionKey.HideIgnore]: checked,
      })
    )
  }

  return (
    <div>
      <Switch onChange={setHideIgnore} defaultChecked={globalOption[GlobalOptionKey.HideIgnore]}></Switch>隐藏忽略
    </div>
  )
}

export default OptionBar
