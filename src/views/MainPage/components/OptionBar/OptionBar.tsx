import { Switch } from 'antd'
import { GlobalOptionKey } from '../../../../utils/enum'
import { useDispatch } from 'react-redux'
import { setGlobalOption } from '../../../../store/slice/globalOptionSlice'

const OptionBar = () => {
  const dispatch = useDispatch()

  const setHideIgnore = (checked: boolean) => {
    dispatch(
      setGlobalOption({
        [GlobalOptionKey.HideIgnore]: checked,
      })
    )
  }

  return (
    <div>
      <Switch onChange={setHideIgnore}></Switch>隐藏忽略
    </div>
  )
}

export default OptionBar
