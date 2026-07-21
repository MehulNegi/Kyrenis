"""Email dispatch helper for Kyrenis — routes through the Emergent-managed
Resend integration proxy. Non-blocking; failures are logged but never break
the caller flow (e.g. stock intake) since alert persistence is the source of truth."""
import os
import logging
import httpx

logger = logging.getLogger("kyrenis.email")

EMAIL_BASE_URL = "https://integrations.emergentagent.com"


def _key() -> str | None:
    return os.environ.get("EMERGENT_EMAIL_KEY")


def _from_name() -> str:
    return os.environ.get("EMAIL_FROM_NAME", "Kyrenis Pharmacy OS")


def _operator() -> str | None:
    return os.environ.get("ALERT_OPERATOR_EMAIL")


def _render_alert_html(alert: dict) -> str:
    severity = alert.get("severity", "Critical")
    color = "#EF4444" if severity in ("Critical", "High-Risk") else "#F59E0B"
    return f"""
    <html>
      <body style="margin:0;padding:32px 12px;background:#000000;color:#E2E8F0;font-family:Helvetica,Arial,sans-serif;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#1F2326;border:1px solid #E2E8F033;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #E2E8F022;background:#1E2B4E;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.3em;color:#E2E8F099;">KYRENIS · SCAN · VERIFY · TRUST</p>
              <h1 style="margin:6px 0 0;color:#FFFFFF;font-size:22px;">Anomaly Escalation Alert</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;">
              <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.28em;color:{color};text-transform:uppercase;">Severity · {severity}</p>
              <h2 style="margin:0;color:#FFFFFF;font-size:20px;">{alert.get('alert_type','Anomaly Detected')}</h2>
              <p style="margin:12px 0 0;color:#E2E8F0;line-height:1.55;">Batch <strong style="color:#FFFFFF;">{alert.get('target_batch_number','—')}</strong> triggered a network anomaly at {alert.get('created_at','—')}.</p>
              <p style="margin:12px 0 0;color:#E2E8F0BB;line-height:1.55;font-size:14px;">{alert.get('detail','')}</p>
              <div style="margin:22px 0 0;padding:14px 16px;border:1px solid #E2E8F022;background:#0d1013;">
                <p style="margin:0 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.28em;color:#E2E8F099;text-transform:uppercase;">Trigger Metadata</p>
                <pre style="margin:0;color:#E2E8F0DD;font-size:12px;white-space:pre-wrap;font-family:'Courier New',monospace;">{alert.get('triggering_telemetry_json','')}</pre>
              </div>
              <p style="margin:24px 0 0;color:#E2E8F099;font-size:12px;">Kyrenis has locked this batch pending investigation. Verify chain-of-custody and open a return/quarantine ticket immediately.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #E2E8F022;background:#000000;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.28em;color:#E2E8F066;">// Auto-dispatched by Kyrenis OS · do not reply</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """


async def dispatch_alert_email(alert: dict, recipient: str | None = None) -> bool:
    key = _key()
    if not key:
        logger.info("EMERGENT_EMAIL_KEY not configured — skipping email dispatch")
        return False

    to = recipient or _operator()
    if not to:
        logger.info("No recipient configured — skipping email dispatch")
        return False

    payload = {
        "to": [to],
        "subject": f"[Kyrenis] {alert.get('severity','Critical')} · {alert.get('alert_type','Anomaly')} · Batch {alert.get('target_batch_number','—')}",
        "html": _render_alert_html(alert),
        "from_name": _from_name(),
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": key},
                json=payload,
            )
        if r.status_code >= 400:
            logger.warning("Email dispatch failed: %s %s", r.status_code, r.text[:200])
            return False
        return True
    except Exception as e:
        logger.warning("Email dispatch error: %s", e)
        return False


# Internal enquiry inbox — deliberately kept out of any UI. If the platform is
# re-branded, update this constant only; it is never rendered to end users.
_CONTACT_INBOX = "rishabh124124@gmail.com"


def _render_contact_html(enquiry: dict) -> str:
    return f"""
    <html><body style="margin:0;padding:24px;background:#0d1013;color:#E2E8F0;font-family:Helvetica,Arial,sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#1F2326;border:1px solid #E2E8F033;">
        <tr><td style="padding:22px 28px;background:#1E2B4E;border-bottom:1px solid #E2E8F022;">
          <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.3em;color:#E2E8F099;">KYRENIS · CONTACT ENQUIRY</p>
          <h1 style="margin:6px 0 0;color:#FFFFFF;font-size:20px;">New enquiry received</h1>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <table cellpadding="6" cellspacing="0" width="100%">
            <tr><td style="color:#E2E8F099;font-size:12px;width:140px;">Category</td>
                <td style="color:#FFFFFF;font-size:14px;"><strong>{enquiry.get('category','—')}</strong></td></tr>
            <tr><td style="color:#E2E8F099;font-size:12px;">Full name</td>
                <td style="color:#FFFFFF;font-size:14px;">{enquiry.get('name','—')}</td></tr>
            <tr><td style="color:#E2E8F099;font-size:12px;">Work email</td>
                <td style="color:#FFFFFF;font-size:14px;">{enquiry.get('email','—')}</td></tr>
            <tr><td style="color:#E2E8F099;font-size:12px;">Organisation</td>
                <td style="color:#FFFFFF;font-size:14px;">{enquiry.get('organisation','—') or '—'}</td></tr>
          </table>
          <div style="margin-top:18px;padding:16px 18px;border:1px solid #E2E8F022;background:#0d1013;">
            <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.28em;color:#E2E8F099;text-transform:uppercase;">Message</p>
            <p style="margin:0;color:#E2E8F0;font-size:14px;line-height:1.55;white-space:pre-wrap;">{enquiry.get('message','')}</p>
          </div>
        </td></tr>
        <tr><td style="padding:14px 28px;border-top:1px solid #E2E8F022;background:#000000;">
          <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.28em;color:#E2E8F066;">// Auto-forwarded by Kyrenis contact form</p>
        </td></tr>
      </table>
    </body></html>
    """


_CATEGORY_LABEL = {
    "support": "Technical Support",
    "partnership": "Partnership Enquiry",
    "regulatory": "Regulatory Collaboration",
    "general": "General Enquiry",
}


async def dispatch_contact_email(enquiry: dict) -> bool:
    """Send a contact-form enquiry to the internal inbox.

    The inbox address is hardcoded intentionally and is NEVER exposed in the UI.
    Returns True on success, False otherwise. Never raises — callers can proceed
    if delivery is unavailable and the enquiry will still be logged."""
    key = _key()
    enquiry = dict(enquiry)
    enquiry["category"] = _CATEGORY_LABEL.get(enquiry.get("category"), enquiry.get("category", "General Enquiry"))
    logger.info("Contact enquiry received from %s (%s)", enquiry.get("email"), enquiry.get("category"))
    if not key:
        logger.info("EMERGENT_EMAIL_KEY not configured — enquiry logged only")
        return False
    payload = {
        "to": [_CONTACT_INBOX],
        "reply_to": enquiry.get("email") or None,
        "subject": f"[Kyrenis] {enquiry['category']} — {enquiry.get('name','Anonymous')}",
        "html": _render_contact_html(enquiry),
        "from_name": _from_name(),
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": key},
                json=payload,
            )
        if r.status_code >= 400:
            logger.warning("Contact email dispatch failed: %s %s", r.status_code, r.text[:200])
            return False
        return True
    except Exception as e:
        logger.warning("Contact email dispatch error: %s", e)
        return False
