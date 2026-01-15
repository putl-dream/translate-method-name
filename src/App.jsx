import { useEffect, useState } from 'react'
import Namer from './Namer'
import Config from './Config'

export default function App () {
  const [enterAction, setEnterAction] = useState({})
  const [route, setRoute] = useState('')

  useEffect(() => {
    const initRoute = async () => {
      // 检查是否有临时路由（从设置按钮跳转）
      const tmpRoute = await window.utools.db.promises.get('tmp_route')
      if (tmpRoute) {
        await window.utools.db.promises.remove('tmp_route')
        setRoute(tmpRoute)
        setEnterAction({})
        return
      }

      // 正常的插件入口
      window.utools.onPluginEnter((action) => {
        setRoute(action.code || 'namer')
        setEnterAction(action)
      })
    }

    initRoute()

    window.utools.onPluginOut((isKill) => {
      setRoute('')
    })
  }, [])

  if (route === 'namer') {
    return <Namer enterAction={enterAction} onNavigate={setRoute} />
  }

  if (route === 'config') {
    return <Config />
  }

  return false
}
