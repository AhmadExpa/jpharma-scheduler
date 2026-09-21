export default function SiteSuspensionOverlay() {
  return (
    <div className="site-suspension-screen" role="dialog" aria-modal="true" aria-labelledby="site-suspension-title">
      <div className="site-suspension-card">
        <h1 id="site-suspension-title">Website Temporarily Suspended</h1>
        <p>
          This website has been temporarily suspended due to outstanding payments. Please<br className="site-suspension-break" /> contact your developer to settle the overdue balance and restore website services.
        </p>
      </div>
    </div>
  )
}
