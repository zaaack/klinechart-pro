/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { OverlayTemplate } from "klinecharts"

export function toast(msg: string) {
  const toast = document.createElement('div')
  toast.style.position = 'fixed'
  toast.style.top = '20px'
  toast.style.left = '50%'
  toast.style.transform = 'translateX(-50%)'
  toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
  toast.style.color = 'white'
  toast.style.padding = '10px 20px'
  toast.style.borderRadius = '4px'
  toast.style.zIndex = '9999'
  toast.textContent = msg
  document.body.appendChild(toast)

  setTimeout(() => {
    document.body.removeChild(toast)
  }, 2000)
}

const TrendLine: OverlayTemplate = {
  name: 'trendLine',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  styles: {
    line: {
      color: '#db8aa7',
    },
    text: {
      color: '#db8aa7',
    },
    point: {
      color: '#db8aa7',
    },
  },
  createPointFigures({ coordinates, ...props }) {
    if (coordinates.length === 2) {

      // 创建趋势线文本
      const texts = coordinates.map((coordinate, i) => ({
        ...coordinate,
        text: i === 0 ? '趋势线' : '结束',
        baseline: 'bottom',
        y: coordinate.y - 6,
        x: coordinate.x - 12,
      }))

      return [
        {
          type: 'line',
          attrs: {
            coordinates,
          },
        },
        { type: 'text', attrs: texts },
      ]
    }
    return []
  },
  onRightClick: (event) => {
    const [point1, point2] = event.overlay.points

    // 创建复制内容 - 使用timestamp和value属性
    const trendlineData = {
      type: 'trendline',
      points: event.overlay.points.map((point) => ({
        timestamp: point.timestamp,
        value: point.value,
      })),
      // point1: {
      //   timestamp: point1.timestamp,
      //   value: point1.value,
      // },
      // point2: {
      //   timestamp: point2.timestamp,
      //   value: point2.value,
      // },
    }

    // const data = btoa(JSON.stringify(trendlineData))
    const data = JSON.stringify(trendlineData)
    // 复制到剪贴板
    navigator.clipboard
      .writeText(data)
      .then(() => {
        // 显示复制成功提示
        toast('趋势线数据已复制到剪贴板')
      })
      .catch((err) => {
        toast('复制失败:' + err.message)
        console.error('复制失败:', err)
      })
    return true
  },
}

export default TrendLine
