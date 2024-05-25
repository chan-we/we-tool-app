export interface IWeItem {
  key: string

  title: string
  /**
   * 展示图预览
   */
  preview: string
  /**
   * 所在文件夹路径
   */
  folderPath?: string
  /**
   * 资源完整路径
   */
  fullPath?: string
}
