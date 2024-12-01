import {
  checkUpdate,
  installUpdate,
  onUpdaterEvent,
} from '@tauri-apps/api/updater'
import { relaunch } from '@tauri-apps/api/process'
import { message } from 'antd'

export default function useUpdate() {
  const handleUpdate = async () => {
    const clear = await onUpdaterEvent(({ error, status }) => {
      // This will log all updater events, including status updates and errors.
      console.log('Updater event', error, status)
    })

    try {
      const { shouldUpdate, manifest } = await checkUpdate()

      if (shouldUpdate) {
        // You could show a dialog asking the user if they want to install the update here.
        console.log(
          `Installing update ${manifest?.version}, ${manifest?.date}, ${manifest?.body}`
        )

        // Install the update. This will also restart the app on Windows!
        await installUpdate()

        // On macOS and Linux you will need to restart the app manually.
        // You could use this step to display another confirmation dialog.
        await relaunch()
      } else {
        message.success('当前已是最新版本')
      }

      clear()
    } catch (error: any) {
      console.error(error)
      message.error(error)
      clear()
    }
  }

  return {
    handleUpdate,
  }
}
