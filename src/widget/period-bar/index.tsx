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

import { Component, Show, createSignal, onMount, onCleanup, Switch, Match } from 'solid-js'

import { SymbolInfo, Period } from '../../types'

import i18n from '../../i18n'
import { isMobile } from '../utils'
import { Select } from '../../component'
import IconMenu from './icons/menu'
import IconIndicator from './icons/indicator'
import IconSetting from './icons/setting'

export interface PeriodBarProps {
  locale: string
  spread: boolean
  symbol: SymbolInfo
  period: Period
  periods: Period[]
  onMenuClick: () => void
  onSymbolClick: () => void
  onPeriodChange: (period: Period) => void
  onIndicatorClick: () => void
  onTimezoneClick: () => void
  onSettingClick: () => void
  onScreenshotClick: () => void
}

const PeriodBar: Component<PeriodBarProps> = props => {
  let ref: Node

  const [fullScreen, setFullScreen] = createSignal(false)

  const fullScreenChange = () => {
    setFullScreen(full => !full)
  }

  onMount(() => {
    document.addEventListener('fullscreenchange', fullScreenChange)
    document.addEventListener('mozfullscreenchange', fullScreenChange)
    document.addEventListener('webkitfullscreenchange', fullScreenChange)
    document.addEventListener('msfullscreenchange', fullScreenChange)
  })

  onCleanup(() => {
    document.removeEventListener('fullscreenchange', fullScreenChange)
    document.removeEventListener('mozfullscreenchange', fullScreenChange)
    document.removeEventListener('webkitfullscreenchange', fullScreenChange)
    document.removeEventListener('msfullscreenchange', fullScreenChange)
  })

  return (
    <div
      ref={(el) => {
        ref = el
      }}
      class="klinecharts-pro-period-bar"
    >
      <div class="menu-container">
        <IconMenu
          class={props.spread ? '' : 'rotate'}
          onClick={props.onMenuClick}
        />
      </div>
      <Show when={props.symbol}>
        <div class="symbol" onClick={props.onSymbolClick}>
          <Show when={props.symbol.logo}>
            <img alt="symbol" src={props.symbol.logo} />
          </Show>
          <span>
            {props.symbol.shortName ?? props.symbol.name ?? props.symbol.ticker}
          </span>
        </div>
      </Show>

      <Select
        value={props.period.text}
        dataSource={props.periods.map((p) => p.text)}
        onSelected={(e) => {
          props.onPeriodChange(props.periods.find((p) => p.text === e)!)
        }}
      ></Select>
      <div class="item tools" onClick={props.onIndicatorClick}>
        <IconIndicator />
        {/* <span>{i18n('indicator', props.locale)}</span> */}
      </div>
      <div class="item tools" onClick={props.onSettingClick}>
        <IconSetting />
        {/* <span>{i18n('setting', props.locale)}</span> */}
      </div>
    </div>
  )
}

export default PeriodBar
