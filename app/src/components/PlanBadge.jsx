export function PlanBadge({ plan }) {
  return plan === 'free'
    ? <span className="badge badge-free">Free</span>
    : <span className="badge badge-pro">Pro</span>;
}
