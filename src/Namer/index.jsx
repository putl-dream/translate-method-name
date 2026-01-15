import { useEffect, useState } from 'react'
import './index.css'

const STORAGE_KEY_API = 'dashscope_api_key'
const STORAGE_KEY_MODEL = 'dashscope_model'
const STORAGE_KEY_STYLE = 'naming_style'
const API_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DEFAULT_MODEL = 'qwen-plus'

const NAMING_STYLES = [
  { value: 'camelCase', label: '小驼峰', example: 'getUserInfo' },
  { value: 'pascalCase', label: '大驼峰', example: 'GetUserInfo' },
  { value: 'snakeCase', label: '下划线', example: 'get_user_info' },
  { value: 'kebabCase', label: '短横线', example: 'get-user-info' },
  { value: 'constantCase', label: '常量', example: 'GET_USER_INFO' }
]

function detectLanguage (text) {
  const chineseRegex = /[\u4e00-\u9fa5]/
  const englishRegex = /[a-zA-Z]/
  const chineseCount = (text.match(chineseRegex) || []).length
  const englishCount = (text.match(englishRegex) || []).length
  if (chineseCount > englishCount) return 'zh'
  if (englishCount > chineseCount) return 'en'
  return 'unknown'
}

export default function Namer ({ enterAction, onNavigate }) {
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [namingStyle, setNamingStyle] = useState('camelCase')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showStyleDropdown, setShowStyleDropdown] = useState(false)

  useEffect(() => {
    const savedKey = window.utools.dbStorage.getItem(STORAGE_KEY_API)
    if (savedKey) setApiKey(savedKey)

    const savedModel = window.utools.dbStorage.getItem(STORAGE_KEY_MODEL)
    if (savedModel) setModel(savedModel)

    const savedStyle = window.utools.dbStorage.getItem(STORAGE_KEY_STYLE)
    if (savedStyle) setNamingStyle(savedStyle)

    if (enterAction?.payload) {
      setInputText(enterAction.payload)
    }
  }, [enterAction])

  const generatePrompt = (text, style) => {
    const lang = detectLanguage(text)
    const styleInfo = NAMING_STYLES.find(s => s.value === style)

    if (lang === 'zh') {
      return `你是一个接口命名专家。请根据以下中文描述，生成符合${styleInfo.label}风格的英文接口名称。\n\n命名要求：\n1. 使用准确的英文专业术语\n2. 严格按照${styleInfo.label}格式，示例：${styleInfo.example}\n3. 只返回接口名称，不要有其他内容\n\n中文描述：${text}\n\n接口名称：`
    } else {
      return `你是一个接口命名专家。请将以下接口名称转换为${styleInfo.label}风格。\n\n转换要求：\n1. 保持原有的语义\n2. 严格按照${styleInfo.label}格式，示例：${styleInfo.example}\n3. 只返回转换后的接口名称，不要有其他内容\n\n原接口名称：${text}\n\n转换后：`
    }
  }

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('请输入需要转换的文本')
      return
    }

    if (!apiKey.trim()) {
      setError('请先设置 API Key')
      return
    }

    setLoading(true)
    setError('')
    setTranslatedText('')

    try {
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: generatePrompt(inputText, namingStyle)
          }]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `请求失败: ${response.status}`)
      }

      const data = await response.json()
      const result = data.choices?.[0]?.message?.content || ''

      if (!result) {
        throw new Error('未获取到翻译结果')
      }

      setTranslatedText(result.trim())
      window.utools.dbStorage.setItem(STORAGE_KEY_STYLE, namingStyle)
    } catch (err) {
      setError(err.message || '翻译失败，请检查 API Key 是否正确')
    } finally {
      setLoading(false)
    }
  }

  const copyResult = () => {
    navigator.clipboard.writeText(translatedText)
    window.utools.showNotification('已复制到剪贴板')
  }

  const goToConfig = () => {
    onNavigate('config')
  }

  const currentStyle = NAMING_STYLES.find(s => s.value === namingStyle)

  return (
    <div className='namer'>
      <div className='namer-header'>
        <h1>接口命名转换</h1>
        <p className='subtitle'>基于百炼平台通义千问</p>
      </div>

      <div className='namer-content'>
        <div className='input-section'>
          <div className='input-with-select'>
            <div className='style-selector'>
              <button
                className='style-selector-btn'
                onClick={() => setShowStyleDropdown(!showStyleDropdown)}
              >
                <span className='style-label'>{currentStyle?.label}</span>
                <svg className='dropdown-icon' width='12' height='12' viewBox='0 0 12 12' fill='none'>
                  <path d='M6 8L2 4h8z' fill='currentColor' />
                </svg>
              </button>
              {showStyleDropdown && (
                <div className='style-dropdown'>
                  {NAMING_STYLES.map(style => (
                    <div
                      key={style.value}
                      className={`style-option ${style.value === namingStyle ? 'active' : ''}`}
                      onClick={() => {
                        setNamingStyle(style.value)
                        setShowStyleDropdown(false)
                      }}
                    >
                      <span className='style-option-label'>{style.label}</span>
                      <span className='style-option-example'>{style.example}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='输入中文描述或接口名称...'
              className='namer-input'
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleTranslate()
                }
              }}
            />
          </div>

          <button
            onClick={handleTranslate}
            disabled={loading}
            className='translate-btn'
          >
            {loading ? '...' : '转换'}
          </button>
        </div>

        {error && (
          <div className='error-message'>
            {error}
          </div>
        )}

        {translatedText && (
          <div className='result-section'>
            <div className='result-header'>
              <span className='result-label'>{currentStyle?.label}</span>
              <button onClick={copyResult} className='copy-btn'>复制</button>
            </div>
            <div className='result-content'>{translatedText}</div>
          </div>
        )}

        {!translatedText && !error && (
          <div className='hint-text'>
            <p>输入文本后按 Enter 或点击"转换"按钮</p>
            <p>点击左上角按钮切换命名风格</p>
          </div>
        )}
      </div>

      <div className='namer-footer'>
        <button onClick={goToConfig} className='settings-btn' title='设置'>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' />
            <circle cx='12' cy='12' r='3' />
          </svg>
        </button>
      </div>
    </div>
  )
}
