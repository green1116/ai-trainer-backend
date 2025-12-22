# Clinic Dashboard 必须有的 4 个页面

## 3️⃣ Clinic Dashboard 必须有的 4 个页面

### ① Clinic Overview（概览）

**功能**:
- 设备数量
- 今日 Session 数
- 平均稳定性
- 总 Session 数
- 教练数量
- 客户数量

**页面**: `app/clinic/[id]/overview/page.tsx`  
**API**: `GET /api/clinic/{id}/overview`

---

### ② Devices（设备管理）

**功能**:
- 设备状态（在线/离线/维护中）
- 最近使用时间
- Session 数量
- 故障率（来自工厂寄存器）⚠️ 待实现

**页面**: `app/clinic/[id]/devices/page.tsx`  
**API**: `GET /api/clinic/{id}/devices`

**待实现功能**:
- 设备状态实时查询
- 故障率数据（需要从工厂寄存器读取）

---

### ③ Clients（客户管理）

**功能**:
- 客户列表
- Session 历史
- PDF 报告下载

**页面**: `app/clinic/[id]/clients/page.tsx`  
**API**: `GET /api/clinic/{id}/clients`

**待实现功能**:
- 客户 Session 历史查询 API
- 批量 PDF 下载

---

### ④ Reports（报告分析）⭐ 最值钱的

**功能**:
- 周报 / 月报
- 对比分析（与上期对比）
- 导出 PDF

**页面**: `app/clinic/[id]/reports/page.tsx`  
**API**: 
- `GET /api/clinic/{id}/reports?period=week|month`
- `POST /api/clinic/{id}/reports/pdf?period=week|month`

**这是场馆愿意付费的地方** 💰

---

## 页面路由结构

```
/clinic/[id]/
  ├── overview/     - 概览页面
  ├── devices/      - 设备管理
  ├── clients/      - 客户管理
  └── reports/      - 报告分析
```

## 导航布局

所有页面共享一个导航栏，包含 4 个主要入口：
- 概览
- 设备
- 客户
- 报告

**布局文件**: `app/clinic/[id]/layout.tsx`

## API 端点总结

| 页面 | API 端点 | 说明 |
|------|----------|------|
| Overview | `GET /api/clinic/{id}/overview` | 获取概览统计数据 |
| Devices | `GET /api/clinic/{id}/devices` | 获取设备列表 |
| Clients | `GET /api/clinic/{id}/clients` | 获取客户列表 |
| Reports | `GET /api/clinic/{id}/reports?period=week\|month` | 获取报告数据 |
| Reports PDF | `POST /api/clinic/{id}/reports/pdf?period=week\|month` | 生成 PDF 报告 |

## 实现状态

| 页面 | 前端 | 后端 API | 状态 |
|------|------|----------|------|
| Overview | ✅ | ✅ | 完成 |
| Devices | ✅ | ✅ | 完成（故障率待实现） |
| Clients | ✅ | ✅ | 完成（Session 历史待完善） |
| Reports | ✅ | ✅ | 完成 |

## 商业价值

### Reports 页面是最值钱的 💰

**原因**:
1. **数据分析**: 提供深度的数据分析和洞察
2. **对比分析**: 帮助场馆了解训练效果变化
3. **专业报告**: PDF 报告可以分享给客户或管理层
4. **决策支持**: 数据驱动的决策支持

**付费意愿**: 场馆愿意为专业的数据分析和报告功能付费

## 相关文件

- **Overview**: `app/clinic/[id]/overview/page.tsx`
- **Devices**: `app/clinic/[id]/devices/page.tsx`
- **Clients**: `app/clinic/[id]/clients/page.tsx`
- **Reports**: `app/clinic/[id]/reports/page.tsx`
- **Layout**: `app/clinic/[id]/layout.tsx`
- **API**: `ai-trainer-backend/app/api/clinic/[id]/`

