import { useMemo, useState } from "react";
import { CoinSelector, DEFAULT_TRACKED_COINS } from "./CoinSelector";

type StatusState = {
  type: "success" | "error" | "info";
  message: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:14000";

export function SubscriptionPanel() {
  const [email, setEmail] = useState("");
  const [selectedCoins, setSelectedCoins] = useState<string[]>(
    DEFAULT_TRACKED_COINS.slice(0, 6)
  );
  const [status, setStatus] = useState<StatusState | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isLoadingExisting, setLoadingExisting] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(email.trim()) && selectedCoins.length > 0 && !isSubmitting;
  }, [email, selectedCoins, isSubmitting]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setStatus({ type: "info", message: "正在保存您的订阅…" });
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, coins: selectedCoins }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "订阅失败");
      }
      setStatus({ type: "success", message: "订阅已更新，我们会按时推送行情邮件。" });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "提交失败，请稍后再试。",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchExisting() {
    if (!email.trim()) {
      setStatus({ type: "error", message: "请输入邮箱地址后再查询。" });
      return;
    }

    setLoadingExisting(true);
    setStatus({ type: "info", message: "正在查询您已保存的订阅…" });
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/subscriptions/${encodeURIComponent(email)}`
      );
      if (response.status === 404) {
        setStatus({ type: "info", message: "暂无历史订阅，欢迎新建。" });
        setLoadingExisting(false);
        return;
      }
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || "查询失败");
      }
      const coins = Array.isArray(payload.coins)
        ? payload.coins
        : (payload.coins || "").split(",");
      const cleaned = coins
        .map((coin: string) => coin.trim().toLowerCase())
        .filter((coin: string) => coin);
      if (cleaned.length) {
        setSelectedCoins(cleaned);
      }
      setStatus({ type: "success", message: "已加载历史订阅设置。" });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "查询失败，请稍后再试。",
      });
    } finally {
      setLoadingExisting(false);
    }
  }

  return (
    <section className="section">
      <div className="subscription-card">
        <div className="subscription-header">
          <div>
            <h2>邮箱订阅 & 动态推送</h2>
            <p className="muted">
              选择关注的币种，我们会将每日行情摘要、健康评分和预测通过邮件推送给您。
            </p>
          </div>
        </div>
        <form className="subscription-form" onSubmit={handleSubmit}>
          <div className="subscription-input-group">
            <label htmlFor="subscription-email">邮箱地址</label>
            <input
              id="subscription-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="subscription-input-group">
            <label>订阅币种</label>
            <CoinSelector
              selected={selectedCoins}
              onChange={setSelectedCoins}
              maxSelection={12}
            />
          </div>
          <div className="subscription-actions">
            <button
              type="button"
              onClick={fetchExisting}
              disabled={isLoadingExisting || !email.trim()}
              className="secondary"
            >
              {isLoadingExisting ? "查询中…" : "加载我的订阅"}
            </button>
            <button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "提交中…" : "保存订阅"}
            </button>
          </div>
        </form>
        {status ? (
          <div className={`subscription-status ${status.type}`}>
            {status.message}
          </div>
        ) : null}
        <p className="subscription-disclaimer muted">
          * 邮件推送依赖 SMTP 配置，需在后端 `.env` 中启用 `EMAIL_ENABLED` 并设置相关凭据。
        </p>
      </div>
    </section>
  );
}
