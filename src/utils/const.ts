import { SelectType } from './enum';
export const selectTypeOptions: {value: SelectType, label: string}[] = [
    {
        value: SelectType.All,
        label: '全部'
    },
    {
        value: SelectType.NoIgnore,
        label: '过滤忽略文件'
    }
]