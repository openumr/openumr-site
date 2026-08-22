import { useEffect, useRef, useState } from 'react';

// 数据大厅密码门：密码以 SHA-256 哈希存储，不保存明文（前端防护为轻量级，防误入/路人）
const GATE_HASH = 'bf6a02905f2c52e0946ff56f747b4aeb928fad67d1e74fd635d49a26ae37cae1';

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function GateModal({ open, onClose }) {
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  // 打开时清空上次输入并聚焦
  useEffect(() => {
    if (!open) return;
    setValue('');
    setErr('');
    setVisible(false);
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open]);

  async function verify() {
    const val = value.trim();
    if (!val) { setErr('请输入密码'); return; }
    let hash;
    try { hash = await sha256Hex(val); }
    catch { setErr('当前环境不支持安全验证'); return; }
    if (hash === GATE_HASH) {
      sessionStorage.setItem('umr_gate', '1');
      location.href = 'quotes.html';
    } else {
      setErr('密码错误，请重试');
      inputRef.current?.select();
    }
  }

  // Esc 关闭 / Enter 提交；点遮罩关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      // 焦点在按钮上时由原生 click 触发，避免 Enter 双重提交
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') verify();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <div
      id="gateOverlay"
      className={open ? 'show' : ''}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="gate-card">
        <button className="gate-close" title="关闭" onClick={onClose}>✕</button>
        <div className="ico">🔐</div>
        <h3>数据大厅</h3>
        <div className="sub">此区域受密码保护<br />请输入访问密码进入</div>
        <div className="gate-input-wrap">
          <input
            type={visible ? 'text' : 'password'}
            placeholder="访问密码"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            ref={inputRef}
          />
          <button
            className="gate-eye"
            type="button"
            title="显示/隐藏"
            onClick={() => setVisible((v) => !v)}
          >👁</button>
        </div>
        {err && <div className="gate-err show" role="alert">{err}</div>}
        <div className="gate-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={verify}>进入大厅</button>
        </div>
      </div>
    </div>
  );
}
