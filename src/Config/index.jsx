import { useEffect, useState } from 'react'
import './index.css'

const STORAGE_KEY_API = 'dashscope_api_key'
const STORAGE_KEY_MODEL = 'dashscope_model'

const MODELS = [
  { value: 'qwen-plus', label: 'qwen-plus (通用)' },
  { value: 'qwen-turbo', label: 'qwen-turbo (快速)' },
  { value: 'qwen-max', label: 'qwen-max (强力)' },
  { value: 'qwen-plus-2025-07-28', label: 'qwen-plus-2025-07-28 (最新)' }
]

export default function Config () {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('qwen-plus')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedKey = window.utools.dbStorage.getItem(STORAGE_KEY_API)
    if (savedKey) setApiKey(savedKey)

    const savedModel = window.utools.dbStorage.getItem(STORAGE_KEY_MODEL)
    if (savedModel) setModel(savedModel)
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) {
      window.utools.showNotification('请输入 API Key')
      return
    }
    window.utools.dbStorage.setItem(STORAGE_KEY_API, apiKey)
    window.utools.dbStorage.setItem(STORAGE_KEY_MODEL, model)
    setSaved(true)
    window.utools.showNotification('配置已保存')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className='config'>
      <div className='config-header'>
        <h1>配置</h1>
        <p className='subtitle'>配置百炼平台 API 信息</p>
      </div>

      <div className='config-content'>
        <div className='config-item'>
          <label className='config-label'>API Key</label>
          <input
            type='password'
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder='请输入百炼平台 API Key'
            className='config-input'
          />
          <p className='config-hint'>获取方式：访问阿里云百炼平台控制台</p>
        </div>

        <div className='config-item'>
          <label className='config-label'>模型选择</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className='config-select'
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className='config-actions'>
          <button onClick={handleSave} className='save-btn'>
            {saved ? '✓ 已保存' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  )
}
