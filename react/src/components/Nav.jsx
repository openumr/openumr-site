export default function Nav({ onOpenGate }) {
  return (
    <nav>
      <div className="brand">
        <div className="brand-mark">UMR</div>
        <div>Open<span>UMR</span></div>
      </div>
      <div className="nav-links">
        <a href="#top">总览</a>
        <a href="#pipeline">数据管道</a>
        <a href="#features">功能</a>
        <a href="#roadmap" className="dim">路线图</a>
      </div>
      <div className="nav-auth">
        <button className="nav-login" onClick={onOpenGate}>Log in</button>
        <button className="btn btn-primary nav-cta" onClick={onOpenGate}>Sign up</button>
      </div>
    </nav>
  );
}
