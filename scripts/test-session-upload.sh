#!/bin/bash
# 测试 Session 上传脚本
# 用于验证整条数据链路（在真正连蓝牙前）

API_URL="http://localhost:6001/api/session"

# 生成假数据
generate_fake_session() {
    local device_id=$1
    local sample_count=${2:-10}
    
    local now=$(date +%s%3N)
    local started_at=$((now - 600000))  # 10分钟前
    local ended_at=$now
    
    local samples="["
    for ((i=0; i<sample_count; i++)); do
        local sample_time=$((started_at + i * 60000))
        local hz=$(awk "BEGIN {printf \"%.1f\", 30 + ($RANDOM % 10 - 5)}")
        
        if [ $i -gt 0 ]; then
            samples+=","
        fi
        samples+="{\"t\":$sample_time,\"hz\":$hz}"
    done
    samples+="]"
    
    cat <<EOF
{
  "deviceId": "$device_id",
  "startedAt": $started_at,
  "endedAt": $ended_at,
  "samples": $samples
}
EOF
}

# 发送数据
send_session_data() {
    local device_id=$1
    local count=${2:-10}
    
    echo "📤 发送 $count 条假数据到 API..."
    echo "设备 ID: $device_id"
    echo ""
    
    local success_count=0
    local fail_count=0
    
    for ((i=1; i<=count; i++)); do
        local payload=$(generate_fake_session "$device_id" 10)
        
        if response=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            -w "\n%{http_code}"); then
            
            local http_code=$(echo "$response" | tail -n1)
            local body=$(echo "$response" | sed '$d')
            
            if [ "$http_code" -eq 200 ]; then
                local session_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
                echo "✅ [$i/$count] 成功 - Session ID: $session_id"
                success_count=$((success_count + 1))
            else
                echo "❌ [$i/$count] 失败: HTTP $http_code"
                fail_count=$((fail_count + 1))
            fi
        else
            echo "❌ [$i/$count] 请求失败"
            fail_count=$((fail_count + 1))
        fi
        
        sleep 0.5  # 避免请求过快
    done
    
    echo ""
    echo "=== 测试结果 ==="
    echo "成功: $success_count"
    echo "失败: $fail_count"
    echo ""
    echo "💡 现在检查数据库，应该能看到这些数据！"
    echo "   - Session 表: 应该有 $success_count 条记录"
    echo "   - DeviceData 表: 应该有 $((success_count * 10)) 条频率点记录"
}

# 主程序
echo ""
echo "=== Session 上传测试脚本 ==="
echo ""

# 检查 API 是否可访问
if curl -s -f "$API_URL" > /dev/null 2>&1; then
    echo "✅ API 可访问"
else
    echo "❌ API 无法访问"
    echo "   请确保后端服务正在运行 (npm run dev)"
    exit 1
fi

echo ""

# 提示输入设备 ID
read -p "请输入设备 ID (例如: VP-2025-000001): " device_id

if [ -z "$device_id" ]; then
    echo "❌ 设备 ID 不能为空"
    exit 1
fi

# 发送 10 条数据
send_session_data "$device_id" 10

echo ""
echo "✅ 测试完成！"

