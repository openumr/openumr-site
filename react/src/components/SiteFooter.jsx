import IconMark from './IconMark.jsx';

export default function SiteFooter({ onOpenGate }) {
  return (
    <footer className="site-foot">
      <div className="f-grid">
        <div className="f-col">
          <div className="brand">
            <div className="brand-mark"><IconMark /></div>
            <div>Open<span>UMR</span></div>
          </div>
          <div className="f-tagline">开放的数据，看见真实。个人项目：代码、数据管道与计算逻辑全部公开，欢迎监督与贡献。</div>
        </div>
        <div className="f-col">
          <div className="f-head">导航</div>
          <a className="f-link" href="#top">总览</a>
          <a className="f-link" href="#pipeline">数据管道</a>
          <a className="f-link" href="#features">功能特性</a>
          <a className="f-link" href="#roadmap">路线图</a>
          <button className="f-link" onClick={onOpenGate}>数据大厅 🔐</button>
          <a className="f-link" href="https://github.com/openumr/openumr-site" target="_blank" rel="noopener">GitHub ↗</a>
        </div>
        <div className="f-col">
          <div className="f-head">数据与声明</div>
          <div className="f-note">数据来源：NYSE · NASDAQ · SEC EDGAR · FINRA</div>
          <div className="f-note">本站为个人项目，美股数据仅供参考，不构成任何投资建议。行情可能有延迟，请以交易所官方数据为准。</div>
        </div>
      </div>
      <div className="f-bottom">
        <div className="f-bottom-inner">
          <div>© 2026 OpenUMR · openumr.com</div>
          <div>OPEN · TRANSPARENT · AUDITABLE</div>
        </div>
      </div>
    </footer>
  );
}
