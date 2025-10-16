import { KLineChartPro } from '../src'
import DefaultDatafeed from './DefaultDatafeed'

export default function setupApp (root: HTMLDivElement) {
  let locale = 'zh-CN'
  if (window.location.hash.endsWith('#en-US')) {
    locale = 'en-US'
  }
  root.innerHTML = `
    <div id="container">
    </div>
  `
  const options = {
    container: 'container',
    locale,
    symbol: {
      exchange: 'XNYS',
      market: 'stocks',
      name: 'Alibaba Group Holding Limited American Depositary Shares, each represents eight Ordinary Shares',
      shortName: 'BABA',
      ticker: 'BABA',
      priceCurrency: 'usd',
      type: 'ADRC',
    },
    period: { multiplier: 15, timespan: 'minute', text: '15m' },
    subIndicators: [],
    datafeed: new DefaultDatafeed('fgBqakYElb8niRTDWi9WXK7XdOdVGG2E'),
  }
  let pro=new KLineChartPro(options)
  // const savePersist = () => {
  //   const persist = pro.getChartApi().getPersist()
  //   console.log('savePersist', persist)
  //   localStorage.setItem('persist', JSON.stringify(persist))
  // }
  // window.addEventListener('beforeunload', savePersist)
  // ;(window as any).savePersist = savePersist
  // window.addEventListener('load', () => {
  //   const persistStr = localStorage.getItem('persist')
  //   if (persistStr) {
  //     const persist = JSON.parse(persistStr)
  //     console.log('loadPersist', persist)
  //     pro.getChartApi().setPersist(persist)
  //   }
  // })
}
