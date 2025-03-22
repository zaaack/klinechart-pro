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


const AlarmLine: OverlayTemplate = {
  name: 'alarmLine',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  styles: {
    line: {
      color: '#FF0000',
    },
    text: {
      color: '#FF0000',
    },
    point: {
      color: '#FF0000',
    },
  },
  createPointFigures: ({ coordinates, bounding }) => {
    const texts = coordinates.map((coordinate, i) => ({
      ...coordinate,
      text: `提醒`,
      baseline: 'bottom',
      y: coordinate.y - 6,
      x: coordinate.x - 12,
    }))
    return [
      {
        type: 'line',
        attrs: {
          coordinates: [
            {
              x: 0,
              y: coordinates[0].y,
            },
            {
              x: bounding.width,
              y: coordinates[0].y,
            },
          ],
        },
      },

      { type: 'text', attrs: texts },
    ]
  },
  onRightClick: () => true,
}

export default AlarmLine
