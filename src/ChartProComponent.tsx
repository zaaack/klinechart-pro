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

import {
  createSignal,
  createEffect,
  onMount,
  Show,
  onCleanup,
  startTransition,
  Component,
  createMemo,
} from 'solid-js'

import {
  init,
  dispose,
  utils,
  Nullable,
  Chart,
  OverlayMode,
  Styles,
  TooltipIconPosition,
  ActionType,
  PaneOptions,
  Indicator,
  DomPosition,
  FormatDateType,
  type OverlayCreate,
  type Overlay,
  type IndicatorCreate,
} from 'klinecharts'

import lodashSet from 'lodash/set'
import lodashClone from 'lodash/cloneDeep'

import { SelectDataSourceItem, Loading } from './component'

import {
  PeriodBar,
  DrawingBar,
  IndicatorModal,
  TimezoneModal,
  SettingModal,
  ScreenshotModal,
  IndicatorSettingModal,
  SymbolSearchModal,
} from './widget'

import { translateTimezone } from './widget/timezone-modal/data'

import {
  SymbolInfo,
  Period,
  ChartProOptions,
  ChartPro,
  type Persist,
} from './types'
import AlarmLine from './alarm/alarm-overlay'

type NullableProps = 'persist'|'onPersistChange'|'onRequestPersist'
export interface ChartProComponentProps
  extends Required<Omit<ChartProOptions, 'container' | NullableProps>>,
    Pick<ChartProOptions, NullableProps> {
  ref: (chart: ChartPro) => void
}

interface PrevSymbolPeriod {
  symbol: SymbolInfo
  period: Period
}

function createIndicator(
  widget: Nullable<Chart>,
  indicatorName: string,
  isStack?: boolean,
  paneOptions?: PaneOptions,
  indicatorCreate?: IndicatorCreate
): Nullable<string> {
  if (indicatorName === 'VOL') {
    paneOptions = { gap: { bottom: 2 }, ...paneOptions }
  }
  return (
    widget?.createIndicator(
      {
        ...indicatorCreate,
        name: indicatorName,
        // @ts-expect-error
        createTooltipDataSource: ({ indicator, defaultStyles }) => {
          const icons = []
          if (indicator.visible) {
            icons.push(defaultStyles.tooltip.icons[1])
            icons.push(defaultStyles.tooltip.icons[2])
            icons.push(defaultStyles.tooltip.icons[3])
          } else {
            icons.push(defaultStyles.tooltip.icons[0])
            icons.push(defaultStyles.tooltip.icons[2])
            icons.push(defaultStyles.tooltip.icons[3])
          }
          return { icons }
        },
      },
      isStack,
      paneOptions
    ) ?? null
  )
}

const ChartProComponent: Component<ChartProComponentProps> = (props) => {
  let widgetRef: HTMLDivElement | undefined = undefined
  let widget: Nullable<Chart> = null

  let priceUnitDom: HTMLElement

  let loading = false

  const [theme, setTheme] = createSignal(props.theme)
  const [styles, setStyles] = createSignal(props.styles)
  const [locale, setLocale] = createSignal(props.locale)

  const [symbol, setSymbol] = createSignal(props.symbol)
  const [period, setPeriod] = createSignal(props.period)
  const [indicatorModalVisible, setIndicatorModalVisible] = createSignal(false)
  const [mainIndicators, setMainIndicators] = createSignal([
    ...props.mainIndicators!,
  ])
  const [subIndicators, setSubIndicators] = createSignal<{
    [j: string]: string
  }>({})
  const [overlays, setOverlays] = createSignal<Array<OverlayCreate>>([])

  const [timezoneModalVisible, setTimezoneModalVisible] = createSignal(false)
  const [timezone, setTimezone] = createSignal<SelectDataSourceItem>({
    key: props.timezone,
    text: translateTimezone(props.timezone, props.locale),
  })

  const [settingModalVisible, setSettingModalVisible] = createSignal(false)
  const [widgetDefaultStyles, setWidgetDefaultStyles] = createSignal<Styles>()

  const [screenshotUrl, setScreenshotUrl] = createSignal('')

  const [drawingBarVisible, setDrawingBarVisible] = createSignal(
    props.drawingBarVisible
  )

  const [symbolSearchModalVisible, setSymbolSearchModalVisible] =
    createSignal(false)

  const [loadingVisible, setLoadingVisible] = createSignal(false)

  const [indicatorSettingModalParams, setIndicatorSettingModalParams] =
    createSignal({
      visible: false,
      indicatorName: '',
      paneId: '',
      calcParams: [] as Array<any>,
    })
  function createOverlay(overlay: OverlayCreate) {
    if (overlay) {
      let id = widget!.createOverlay(overlay) as string
      setOverlays(overlays().concat(widget?.getOverlayById(id) ?? overlay))
    }
  }
  const [persistChange, triggerPersistChange] = createSignal(0)
  let handlePersistChangeTimer: any
  let lastPersist: string = JSON.stringify(props.persist)
  createEffect(() =>{
    symbol()
    props.onRequestPersist?.()
  })
  createEffect(() => {
    // 触发getter进行监听
    period()
    mainIndicators()
    subIndicators()
    overlays()
    persistChange()
    if (handlePersistChangeTimer) {
      clearTimeout(handlePersistChangeTimer)
    }
    // 初始化 persist
    handlePersistChangeTimer = setTimeout(() => {
      if (props.onPersistChange) {
        const persist = chartPro.getPersist()
        if (JSON.stringify(persist) !== lastPersist) {
          props.onPersistChange(persist)
          lastPersist = JSON.stringify(persist)
        }
      }
    }, 1000)
  })
  const chartPro: ChartPro = {
    setTheme,
    getTheme: () => theme(),
    setStyles,
    getStyles: () => widget!.getStyles(),
    setLocale,
    getLocale: () => locale(),
    setTimezone: (timezone: string) => {
      setTimezone({
        key: timezone,
        text: translateTimezone(props.timezone, locale()),
      })
    },
    getTimezone: () => timezone().key,
    setSymbol,
    getSymbol: () => symbol(),
    setPeriod,
    getPeriod: () => period(),
    getMainIndicators() {
      return mainIndicators()
    },
    getSubIndicators() {
      return subIndicators()
    },
    getOverlays() {
      return overlays()
    },
    setOverlays(overlays) {
      overlays.forEach(createOverlay)
    },
    setMainIndicators,
    setSubIndicators,
    getChart() {
      return widget!
    },

    getPersist() {
      const mainIndicatorsMap =
        (widget?.getIndicatorByPaneId('candle_pane') as any as Map<
          string,
          Indicator
        >) ?? new Map()
      return {
        theme: theme(),
        symbol: symbol(),
        period: period(),
        mainIndicators: mainIndicators()
          .map((name) => mainIndicatorsMap.get(name)!)
          .filter(Boolean)
          .map((i) => {
            return {
              name: i.name,
              calcParams: i.calcParams,
              styles: i.styles,
              panelId: 'candle_pane',
            }
          }),
        subIndicators: Object.entries(subIndicators()).map(
          ([name, panelId]) => {
            const indi = Array.from(
              (
                widget?.getIndicatorByPaneId(panelId) as any as Map<
                  string,
                  Indicator
                >
              ).values()
            )[0]
            return {
              name: indi?.name,
              calcParams: indi?.calcParams,
              styles: indi?.styles,
              panelId,
            }
          }
        ),
        overlays: overlays().map((o) => {
          const overlay = widget?.getOverlayById(o.id!)
          return {
            id: o.id,
            name: o.name,
            styles: overlay?.styles,
            points: overlay?.points,
          } satisfies OverlayCreate
        }),
      }
    },
    async setPersist(persist) {
      setTheme(persist.theme)
      if (persist.symbol.ticker !== symbol().ticker) {
        setSymbol(persist.symbol)
      }
      if (persist.period.text !== period().text) {
        setPeriod(persist.period)
      }
      // clear indicators
      mainIndicators().forEach((name) => {
        widget?.removeIndicator('candle_pane', name)
      })
      const oldSubIndicators = subIndicators()
      for (const name in oldSubIndicators) {
        const panelId = oldSubIndicators[name]
        widget?.removeIndicator(panelId, name)
      }
      setMainIndicators(
        persist.mainIndicators.map((m) => {
          createIndicator(widget, m.name, true, { id: 'candle_pane' }, m)
          return m.name
        })
      )
      const newSubIndicators: any = {}
      persist.subIndicators.forEach((m) => {
        newSubIndicators[m.name] = m.panelId
        createIndicator(widget, m.name, true, { id: m.panelId }, m)
      })
      this.setSubIndicators(newSubIndicators)
      overlays().forEach((o) => {
        widget?.removeOverlay(o.id!)
      })
      setOverlays([])
      persist.overlays.forEach(createOverlay)
      lastPersist = JSON.stringify(this.getPersist())
    },
  }
  props.ref(chartPro)
  const documentResize = () => {
    widget?.resize()
  }

  const adjustFromTo = (period: Period, toTimestamp: number, count: number) => {
    let to = toTimestamp
    let from = to
    switch (period.timespan) {
      case 'minute': {
        to = to - (to % (60 * 1000))
        from = to - count * period.multiplier * 60 * 1000
        break
      }
      case 'hour': {
        to = to - (to % (60 * 60 * 1000))
        from = to - count * period.multiplier * 60 * 60 * 1000
        break
      }
      case 'day': {
        to = to - (to % (60 * 60 * 1000))
        from = to - count * period.multiplier * 24 * 60 * 60 * 1000
        break
      }
      case 'week': {
        const date = new Date(to)
        const week = date.getDay()
        const dif = week === 0 ? 6 : week - 1
        to = to - dif * 60 * 60 * 24
        const newDate = new Date(to)
        to = new Date(
          `${newDate.getFullYear()}-${
            newDate.getMonth() + 1
          }-${newDate.getDate()}`
        ).getTime()
        from = count * period.multiplier * 7 * 24 * 60 * 60 * 1000
        break
      }
      case 'month': {
        const date = new Date(to)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        to = new Date(`${year}-${month}-01`).getTime()
        from = count * period.multiplier * 30 * 24 * 60 * 60 * 1000
        const fromDate = new Date(from)
        from = new Date(
          `${fromDate.getFullYear()}-${fromDate.getMonth() + 1}-01`
        ).getTime()
        break
      }
      case 'year': {
        const date = new Date(to)
        const year = date.getFullYear()
        to = new Date(`${year}-01-01`).getTime()
        from = count * period.multiplier * 365 * 24 * 60 * 60 * 1000
        const fromDate = new Date(from)
        from = new Date(`${fromDate.getFullYear()}-01-01`).getTime()
        break
      }
    }
    return [from, to]
  }

  onMount(() => {
    window.addEventListener('resize', documentResize)
    widget = init(widgetRef!, {
      customApi: {
        formatDate: (
          dateTimeFormat: Intl.DateTimeFormat,
          timestamp,
          format: string,
          type: FormatDateType
        ) => {
          const p = period()
          switch (p.timespan) {
            case 'minute': {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, 'HH:mm')
              }
              return utils.formatDate(
                dateTimeFormat,
                timestamp,
                'YYYY-MM-DD HH:mm'
              )
            }
            case 'hour': {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(
                  dateTimeFormat,
                  timestamp,
                  'MM-DD HH:mm'
                )
              }
              return utils.formatDate(
                dateTimeFormat,
                timestamp,
                'YYYY-MM-DD HH:mm'
              )
            }
            case 'day':
            case 'week':
              return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD')
            case 'month': {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM')
              }
              return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD')
            }
            case 'year': {
              if (type === FormatDateType.XAxis) {
                return utils.formatDate(dateTimeFormat, timestamp, 'YYYY')
              }
              return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD')
            }
          }
          return utils.formatDate(dateTimeFormat, timestamp, 'YYYY-MM-DD HH:mm')
        },
      },
    })

    if (widget) {
      const watermarkContainer = widget.getDom('candle_pane', DomPosition.Main)
      if (watermarkContainer) {
        let watermark = document.createElement('div')
        watermark.className = 'klinecharts-pro-watermark'
        if (utils.isString(props.watermark)) {
          const str = (props.watermark as string).replace(/(^\s*)|(\s*$)/g, '')
          watermark.innerHTML = str
        } else {
          watermark.appendChild(props.watermark as Node)
        }
        watermarkContainer.appendChild(watermark)
      }

      const priceUnitContainer = widget.getDom('candle_pane', DomPosition.YAxis)
      priceUnitDom = document.createElement('span')
      priceUnitDom.className = 'klinecharts-pro-price-unit'
      priceUnitContainer?.appendChild(priceUnitDom)
    }

    mainIndicators().forEach((indicator) => {
      createIndicator(widget, indicator, true, { id: 'candle_pane' })
    })
    const subIndicatorMap = {}
    props.subIndicators!.forEach((indicator) => {
      const paneId = createIndicator(widget, indicator, true)
      if (paneId) {
        // @ts-expect-error
        subIndicatorMap[indicator] = paneId
      }
    })
    setSubIndicators(subIndicatorMap)
    widget?.loadMore((timestamp) => {
      loading = true
      const get = async () => {
        const p = period()
        const [to] = adjustFromTo(p, timestamp!, 1)
        const [from] = adjustFromTo(p, to, 500)
        const kLineDataList = await props.datafeed.getHistoryKLineData(
          symbol(),
          p,
          from,
          to
        )
        widget?.applyMoreData(kLineDataList, kLineDataList.length > 0)
        loading = false
      }
      get()
    })
    widget?.subscribeAction(ActionType.OnTooltipIconClick, (data) => {
      if (data.indicatorName) {
        switch (data.iconId) {
          case 'visible': {
            widget?.overrideIndicator(
              { name: data.indicatorName, visible: true },
              data.paneId
            )
            triggerPersistChange((i) => i + 1)
            break
          }
          case 'invisible': {
            widget?.overrideIndicator(
              { name: data.indicatorName, visible: false },
              data.paneId
            )
            triggerPersistChange((i) => i + 1)
            break
          }
          case 'setting': {
            const indicator = widget?.getIndicatorByPaneId(
              data.paneId,
              data.indicatorName
            ) as Indicator
            setIndicatorSettingModalParams({
              visible: true,
              indicatorName: data.indicatorName,
              paneId: data.paneId,
              calcParams: indicator.calcParams,
            })
            break
          }
          case 'close': {
            if (data.paneId === 'candle_pane') {
              const newMainIndicators = [...mainIndicators()]
              widget?.removeIndicator('candle_pane', data.indicatorName)
              newMainIndicators.splice(
                newMainIndicators.indexOf(data.indicatorName),
                1
              )
              setMainIndicators(newMainIndicators)
            } else {
              const newIndicators = { ...subIndicators() }
              widget?.removeIndicator(data.paneId, data.indicatorName)
              delete newIndicators[data.indicatorName]
              setSubIndicators(newIndicators)
            }
          }
        }
      }
    })
    // 移动overlay时触发保存persist
    const canvas = document.querySelectorAll('canvas').item(1)
    function savePersist() {
      triggerPersistChange((i) => i + 1)
    }
    canvas.addEventListener('mouseup', savePersist)
    canvas.addEventListener('touchend', savePersist)
  })

  onCleanup(() => {
    window.removeEventListener('resize', documentResize)
    dispose(widgetRef!)
  })

  createEffect(() => {
    const s = symbol()
    if (s?.priceCurrency) {
      priceUnitDom.innerHTML = s?.priceCurrency.toLocaleUpperCase()
      priceUnitDom.style.display = 'flex'
    } else {
      priceUnitDom.style.display = 'none'
    }
    widget?.setPriceVolumePrecision(
      s?.pricePrecision ?? 2,
      s?.volumePrecision ?? 0
    )
  })
  let loadDataTimer: any
  createEffect((prev?: PrevSymbolPeriod) => {
    if (prev) {
      props.datafeed.unsubscribe(prev.symbol, prev.period)
    }
    const s = symbol()
    const p = period()
    loading = true
    setLoadingVisible(true)
    const get = async () => {
      const [from, to] = adjustFromTo(p, new Date().getTime(), 500)
      const kLineDataList = await props.datafeed.getHistoryKLineData(
        s,
        p,
        from,
        to
      )
      widget?.applyNewData(kLineDataList, kLineDataList.length > 0)
      props.datafeed.subscribe(s, p, (data) => {
        widget?.updateData(data)
      })
      loading = false
      setLoadingVisible(false)
    }
    if (loadDataTimer) {
      clearTimeout(loadDataTimer)
    }
    loadDataTimer = setTimeout(get, 500)
    return { symbol: s, period: p }
  })

  createEffect(() => {
    const t = theme()
    widget?.setStyles(t)
    const color = t === 'dark' ? '#929AA5' : '#76808F'
    widget?.setStyles({
      indicator: {
        tooltip: {
          icons: [
            {
              id: 'visible',
              position: TooltipIconPosition.Middle,
              marginLeft: 8,
              marginTop: 7,
              marginRight: 0,
              marginBottom: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: '\ue903',
              fontFamily: 'icomoon',
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: 'transparent',
              activeBackgroundColor: 'rgba(22, 119, 255, 0.15)',
            },
            {
              id: 'invisible',
              position: TooltipIconPosition.Middle,
              marginLeft: 8,
              marginTop: 7,
              marginRight: 0,
              marginBottom: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: '\ue901',
              fontFamily: 'icomoon',
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: 'transparent',
              activeBackgroundColor: 'rgba(22, 119, 255, 0.15)',
            },
            {
              id: 'setting',
              position: TooltipIconPosition.Middle,
              marginLeft: 6,
              marginTop: 7,
              marginBottom: 0,
              marginRight: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: '\ue902',
              fontFamily: 'icomoon',
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: 'transparent',
              activeBackgroundColor: 'rgba(22, 119, 255, 0.15)',
            },
            {
              id: 'close',
              position: TooltipIconPosition.Middle,
              marginLeft: 6,
              marginTop: 7,
              marginRight: 0,
              marginBottom: 0,
              paddingLeft: 0,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              icon: '\ue900',
              fontFamily: 'icomoon',
              size: 14,
              color: color,
              activeColor: color,
              backgroundColor: 'transparent',
              activeBackgroundColor: 'rgba(22, 119, 255, 0.15)',
            },
          ],
        },
      },
    })
  })

  createEffect(() => {
    widget?.setLocale(locale())
  })

  createEffect(() => {
    widget?.setTimezone(timezone().key)
  })

  createEffect(() => {
    if (styles()) {
      widget?.setStyles(styles())
      setWidgetDefaultStyles(lodashClone(widget!.getStyles()))
    }
  })

  return (
    <>
      <i class="icon-close klinecharts-pro-load-icon" />
      <Show when={symbolSearchModalVisible()}>
        <SymbolSearchModal
          locale={props.locale}
          datafeed={props.datafeed}
          onSymbolSelected={(symbol) => {
            setSymbol(symbol)
          }}
          onClose={() => {
            setSymbolSearchModalVisible(false)
          }}
        />
      </Show>
      <Show when={indicatorModalVisible()}>
        <IndicatorModal
          locale={props.locale}
          mainIndicators={mainIndicators()}
          subIndicators={subIndicators()}
          onClose={() => {
            setIndicatorModalVisible(false)
          }}
          onMainIndicatorChange={(data) => {
            const newMainIndicators = [...mainIndicators()]
            if (data.added) {
              createIndicator(widget, data.name, true, { id: 'candle_pane' })
              newMainIndicators.push(data.name)
            } else {
              widget?.removeIndicator('candle_pane', data.name)
              newMainIndicators.splice(newMainIndicators.indexOf(data.name), 1)
            }
            setMainIndicators(newMainIndicators)
          }}
          onSubIndicatorChange={(data) => {
            const newSubIndicators = { ...subIndicators() }
            if (data.added) {
              const paneId = createIndicator(widget, data.name)
              if (paneId) {
                newSubIndicators[data.name] = paneId
              }
            } else {
              if (data.paneId) {
                widget?.removeIndicator(data.paneId, data.name)
                delete newSubIndicators[data.name]
              }
            }
            setSubIndicators(newSubIndicators)
          }}
        />
      </Show>
      <Show when={timezoneModalVisible()}>
        <TimezoneModal
          locale={props.locale}
          timezone={timezone()}
          onClose={() => {
            setTimezoneModalVisible(false)
          }}
          onConfirm={setTimezone}
        />
      </Show>
      <Show when={settingModalVisible()}>
        <SettingModal
          locale={props.locale}
          currentStyles={utils.clone(widget!.getStyles())}
          onClose={() => {
            setSettingModalVisible(false)
          }}
          onChange={(style) => {
            widget?.setStyles(style)
          }}
          onRestoreDefault={(options: SelectDataSourceItem[]) => {
            const style = {}
            options.forEach((option) => {
              const key = option.key
              lodashSet(
                style,
                key,
                utils.formatValue(widgetDefaultStyles(), key)
              )
            })
            widget?.setStyles(style)
          }}
          onClearAlarms={() => {
            if (confirm('确定删除所有预警线？')) {
              widget?.removeOverlay({
                name: AlarmLine.name, // 预警线
              })
              setOverlays(
                overlays().filter((overlay) => overlay.name !== AlarmLine.name)
              )
            }
          }}
        />
      </Show>
      <Show when={screenshotUrl().length > 0}>
        <ScreenshotModal
          locale={props.locale}
          url={screenshotUrl()}
          onClose={() => {
            setScreenshotUrl('')
          }}
        />
      </Show>
      <Show when={indicatorSettingModalParams().visible}>
        <IndicatorSettingModal
          locale={props.locale}
          params={indicatorSettingModalParams()}
          onClose={() => {
            setIndicatorSettingModalParams({
              visible: false,
              indicatorName: '',
              paneId: '',
              calcParams: [],
            })
          }}
          onConfirm={(params) => {
            const modalParams = indicatorSettingModalParams()
            widget?.overrideIndicator(
              { name: modalParams.indicatorName, calcParams: params },
              modalParams.paneId
            )
            triggerPersistChange((i) => i + 1)
          }}
        />
      </Show>
      <PeriodBar
        locale={props.locale}
        symbol={symbol()}
        spread={drawingBarVisible()}
        period={period()}
        periods={props.periods}
        onAlarmClick={async () => {
          createOverlay({
            name: AlarmLine.name, // 预警线
            visible: true,
            groupId: 'alarm',
            mode: OverlayMode.Normal,
            onDoubleClick: (e) => {
              if (confirm('确定删除该预警线？')) {
                widget?.removeOverlay(e.overlay.id)
                setOverlays(
                  overlays().filter((overlay) => overlay.id !== e.overlay.id)
                )
              }
              return true
            },
          })
        }}
        onMenuClick={async () => {
          try {
            await startTransition(() =>
              setDrawingBarVisible(!drawingBarVisible())
            )
            widget?.resize()
          } catch (e) {}
        }}
        onSymbolClick={() => {
          setSymbolSearchModalVisible(!symbolSearchModalVisible())
        }}
        onPeriodChange={setPeriod}
        onIndicatorClick={() => {
          setIndicatorModalVisible((visible) => !visible)
        }}
        onTimezoneClick={() => {
          setTimezoneModalVisible((visible) => !visible)
        }}
        onSettingClick={() => {
          setSettingModalVisible((visible) => !visible)
        }}
        onScreenshotClick={() => {
          if (widget) {
            const url = widget.getConvertPictureUrl(
              true,
              'jpeg',
              props.theme === 'dark' ? '#151517' : '#ffffff'
            )
            setScreenshotUrl(url)
          }
        }}
      />
      <div class="klinecharts-pro-content">
        <Show when={loadingVisible()}>
          <Loading />
        </Show>
        <Show when={drawingBarVisible()}>
          <DrawingBar
            locale={props.locale}
            onDrawingItemClick={(overlay) => {
              createOverlay(overlay)
            }}
            onModeChange={(mode) => {
              widget?.overrideOverlay({ mode: mode as OverlayMode })
              triggerPersistChange((i) => i + 1)
            }}
            onLockChange={(lock) => {
              widget?.overrideOverlay({ lock })
              triggerPersistChange((i) => i + 1)
            }}
            onVisibleChange={(visible) => {
              widget?.overrideOverlay({ visible })
              triggerPersistChange((i) => i + 1)
            }}
            onRemoveClick={(groupId) => {
              widget?.removeOverlay({ groupId })
              setOverlays(
                overlays().filter((overlay) => overlay.groupId !== groupId)
              )
            }}
          />
        </Show>
        <div
          ref={widgetRef}
          class="klinecharts-pro-widget"
          data-drawing-bar-visible={drawingBarVisible()}
        />
      </div>
    </>
  )
}

export default ChartProComponent
