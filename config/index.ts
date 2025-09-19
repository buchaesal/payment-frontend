import localConfig from './local'
import devConfig from './dev'
import stgConfig from './stg'
import cboConfig from './cbo'
import prodConfig from './prod'

export type Environment = 'local' | 'dev' | 'stg' | 'cbo' | 'prod'

export interface EnvironmentConfig {
  tossClientKey: string
  apiBaseUrl: string
  inicisUrl: string
  inicisScriptUrl: string
}

const configs = {
  local: localConfig,
  dev: devConfig,
  stg: stgConfig,
  cbo: cboConfig,
  prod: prodConfig,
}

export const getEnvironmentConfig = (env: Environment = 'local'): EnvironmentConfig => {
  return configs[env]
}

export const getCurrentEnvironment = (): Environment => {
  // NODE_ENV 환경변수나 NUXT_ENV 환경변수를 통해 환경 결정
  const nodeEnv = process.env.NODE_ENV
  const nuxtEnv = process.env.NUXT_ENV as Environment

  if (nuxtEnv && configs[nuxtEnv]) {
    return nuxtEnv
  }

  // NODE_ENV 기반 매핑
  switch (nodeEnv) {
    case 'production':
      return 'prod'
    case 'development':
      return 'local'
    case 'test':
      return 'dev'
    default:
      return 'local'
  }
}

export const getCurrentConfig = (): EnvironmentConfig => {
  const env = getCurrentEnvironment()
  return getEnvironmentConfig(env)
}