import en from './en.json';
import zh from './zh.json';

const dict: Record<string, any> = {
  en,
  zh,
};

/**
 * 获取嵌套对象的值，支持点号分隔的路径
 * 例如：getNestedValue(obj, 'dashboard.title') => obj.dashboard?.title
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }
  return value;
}

export function useI18n(locale: string) {
  return (key: string) => {
    const translations = dict[locale];
    if (!translations) {
      return key;
    }
    
    // 先尝试直接访问（支持 "dashboard.title" 这样的键）
    if (translations[key] !== undefined) {
      return translations[key];
    }
    
    // 如果直接访问失败，尝试嵌套访问（支持 "dashboard.title" 作为路径）
    const nestedValue = getNestedValue(translations, key);
    if (nestedValue !== undefined) {
      return nestedValue;
    }
    
    // 如果都找不到，返回原始 key
    return key;
  };
}

