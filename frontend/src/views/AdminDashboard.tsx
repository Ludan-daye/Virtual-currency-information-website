import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:14000";
const STORAGE_KEY = "crypto-admin-token";

interface ConfigState {
  EMAIL_ENABLED?: boolean | string;
  SMTP_HOST?: string | null;
  SMTP_PORT?: string | number | null;
  SMTP_USERNAME?: string | null;
  SMTP_PASSWORD?: string | null;
  SMTP_FROM_EMAIL?: string | null;
}

interface Subscriber {
  email: string;
  coins: string[];
  updated_at?: string;
}

export function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfigState>({});
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [sendResults, setSendResults] = useState<any>(null);
  const navigate = useNavigate();

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConfig();
      loadSubscribers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) {
      setStatusMessage("请输入管理员密码");
      return;
    }
    setStatusMessage("正在登录…");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "登录失败");
      }
      localStorage.setItem(STORAGE_KEY, payload.token);
      setToken(payload.token);
      setPassword("");
      setStatusMessage("登录成功！");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "登录失败，请检查网络或密码。"
      );
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setConfig({});
    setSubscribers([]);
    navigate("/admin");
  }

  async function loadConfig() {
    if (!token) {
      return;
    }
    setLoadingConfig(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "获取配置失败");
      }
      setConfig(payload);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "获取配置失败，请稍后重试"
      );
    } finally {
      setLoadingConfig(false);
    }
  }

  async function loadSubscribers() {
    if (!token) {
      return;
    }
    setLoadingSubscribers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/subscribers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "获取订阅列表失败");
      }
      setSubscribers(payload);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "获取订阅列表失败，请稍后重试"
      );
    } finally {
      setLoadingSubscribers(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }
    setSaving(true);
    setStatusMessage("正在保存配置…");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "保存配置失败");
      }
      setConfig(payload);
      setStatusMessage("配置已保存");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "保存失败，请稍后再试"
      );
    } finally {
      setSaving(false);
    }
  }

  function updateConfigField(key: keyof ConfigState, value: string | boolean) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSendDigest() {
    if (!token) {
      return;
    }
    setSendingNow(true);
    setStatusMessage("正在发送邮件，请稍候…");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/notifications/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "发送失败");
      }
      setSendResults(payload);
      const successCount = (payload.results || []).filter((item: any) => item.success).length;
      setStatusMessage(`手动推送完成：成功 ${successCount} 封。`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "手动发送失败，请稍后重试"
      );
    } finally {
      setSendingNow(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="admin-login-card">
          <h1>后台登录</h1>
          <p className="muted">请输入管理员密码以访问配置中心。</p>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="password"
              placeholder="管理员密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button type="submit">登录</button>
          </form>
          {statusMessage ? <div className="admin-status info">{statusMessage}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="admin-header">
        <div>
          <h1>后台配置中心</h1>
          <p className="muted">管理邮件推送、订阅用户，以及系统运行配置。</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" onClick={handleSendDigest} disabled={sendingNow}>
            {sendingNow ? "发送中…" : "立即发送"}
          </button>
          <button type="button" onClick={logout} className="secondary">
            退出登录
          </button>
        </div>
      </div>

      {statusMessage ? <div className="admin-status info">{statusMessage}</div> : null}

      <section className="section">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>SMTP 与邮件推送</h2>
            <span className="muted">开启后将按照订阅列表发送每日行情邮件</span>
          </div>
          <form className="admin-config-form" onSubmit={handleSave}>
            <label className="switch">
              <input
                type="checkbox"
                checked={String(config.EMAIL_ENABLED || "false").toLowerCase() === "true"}
                onChange={(event) =>
                  updateConfigField("EMAIL_ENABLED", event.target.checked)
                }
              />
              <span>开启邮件推送</span>
            </label>

            <div className="admin-grid">
              <div className="admin-input-group">
                <label>SMTP Host</label>
                <input
                  value={config.SMTP_HOST ?? ""}
                  onChange={(event) => updateConfigField("SMTP_HOST", event.target.value)}
                  placeholder="smtp.example.com"
                  disabled={loadingConfig}
                />
              </div>
              <div className="admin-input-group">
                <label>SMTP Port</label>
                <input
                  type="number"
                  value={config.SMTP_PORT ?? ""}
                  onChange={(event) => updateConfigField("SMTP_PORT", event.target.value)}
                  placeholder="587"
                  disabled={loadingConfig}
                />
              </div>
              <div className="admin-input-group">
                <label>SMTP Username</label>
                <input
                  value={config.SMTP_USERNAME ?? ""}
                  onChange={(event) => updateConfigField("SMTP_USERNAME", event.target.value)}
                  placeholder="账号（可选）"
                  disabled={loadingConfig}
                />
              </div>
              <div className="admin-input-group">
                <label>SMTP Password</label>
                <input
                  type="password"
                  value={config.SMTP_PASSWORD ?? ""}
                  onChange={(event) => updateConfigField("SMTP_PASSWORD", event.target.value)}
                  placeholder="密码（可选）"
                  disabled={loadingConfig}
                />
              </div>
              <div className="admin-input-group">
                <label>发件人邮箱</label>
                <input
                  value={config.SMTP_FROM_EMAIL ?? ""}
                  onChange={(event) => updateConfigField("SMTP_FROM_EMAIL", event.target.value)}
                  placeholder="notify@example.com"
                  disabled={loadingConfig}
                />
              </div>
            </div>

            <div className="admin-actions">
              <button type="submit" disabled={saving}>
                {saving ? "保存中…" : "保存配置"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>订阅用户列表</h2>
            <span className="muted">
              共 {subscribers.length} 位订阅者。
              {loadingSubscribers ? "（加载中…）" : ""}
            </span>
          </div>
          <div className="subscriber-list">
            {subscribers.length === 0 ? (
              <p className="muted">暂无订阅用户。</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>邮箱</th>
                    <th>关注币种</th>
                    <th>最近更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.email}>
                      <td>{subscriber.email}</td>
                      <td>{(subscriber.coins || []).join(", ")}</td>
                      <td>{subscriber.updated_at || "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {sendResults ? (
            <div className="send-summary">
              <h3>最近一次执行</h3>
              <p className="muted">
                邮件推送状态：
                {sendResults.email_enabled ? "已启用" : "已关闭"}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>邮箱</th>
                    <th>状态</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {(sendResults.results || []).map((item: any) => (
                    <tr key={`${item.email}-${item.message}`}>
                      <td>{item.email}</td>
                      <td>{item.success ? "成功" : "失败"}</td>
                      <td>{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
