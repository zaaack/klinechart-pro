import { KLineChartPro, DefaultDatafeed } from '../src'

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
    subIndicators: ['VOL', 'MACD'],
    datafeed: new DefaultDatafeed('fgBqakYElb8niRTDWi9WXK7XdOdVGG2E'),
  }
  new KLineChartPro(options)
}
