// src/lib/mailTemplates.ts

export function buildWelcomeMailHTML() {
  return `
<div style="background-color:#f5f5f7;padding:24px;">
  <div style="
    max-width:480px;
    margin:0 auto;
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:8px;
    padding:24px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    color:#111827;
    line-height:1.5;
  ">
    <div style="text-align:center;margin-bottom:16px;">
      <img src="https://pagefoundry.de/PAGEfoundry.png"
           alt="PageFoundry"
           style="height:56px;width:auto;border-radius:4px;display:inline-block;border:1px solid #e5e7eb;background:#000;" />
    </div>

    <h1 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 12px 0;text-align:center;">
      Welcome to PageFoundry
    </h1>

    <p style="margin:0 0 16px 0;font-size:14px;color:#374151;text-align:center;">
      Your account is now active.
    </p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;font-size:13px;color:#374151;margin:0 0 20px 0;text-align:center;">
      <div style="margin-bottom:8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">
        Dashboard
      </div>
      <a href="https://pagefoundry.de/dashboard"
         style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-size:13px;font-weight:500;line-height:1.4;padding:8px 12px;border-radius:4px;border:1px solid #111827;">
        Open Dashboard
      </a>
      <div style="margin-top:12px;font-size:12px;color:#6b7280;word-break:break-all;">
        https://pagefoundry.de/dashboard
      </div>
    </div>

    <p style="margin:0 0 12px 0;font-size:12px;color:#6b7280;text-align:center;">
      If you did not create this account please contact
      <a style="color:#111827;text-decoration:none;font-weight:500;" href="mailto:admin@pagefoundry.de">
        admin@pagefoundry.de
      </a>.
    </p>

    <p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      – PageFoundry
    </p>
  </div>

  <div style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    PageFoundry · Kastanienweg 20a · 42499 Hückeswagen
  </div>
</div>`;
}

export function buildWelcomeMailText() {
  return `Welcome to PageFoundry.

Your account has been created and is now active.

You can access your dashboard here:
https://pagefoundry.de/dashboard

If you did not create this account please contact support at admin@pagefoundry.de.

– PageFoundry`;
}

export function buildInvoiceMailHTML({
  productName,
  labelLine,
  valueLine,
  invoiceId,
}: {
  productName: string;
  labelLine: string;
  valueLine: string;
  invoiceId: string;
}) {
  return `
<div style="background-color:#f5f5f7;padding:24px;">
  <div style="
    max-width:480px;
    margin:0 auto;
    background:#ffffff;
    border:1px solid #e5e7eb;
    border-radius:8px;
    padding:24px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    color:#111827;
    line-height:1.5;
  ">
    <div style="text-align:center;margin-bottom:16px;">
      <img src="https://pagefoundry.de/PAGEfoundry.png"
           alt="PageFoundry"
           style="height:56px;width:auto;border-radius:4px;display:inline-block;border:1px solid #e5e7eb;background:#000;" />
    </div>

    <h1 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 4px 0;text-align:center;">
      Payment received
    </h1>

    <p style="margin:0 0 16px 0;font-size:13px;color:#374151;text-align:center;">
      Thank you for your purchase. Your invoice is attached as PDF.
    </p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;font-size:13px;color:#374151;margin:0 0 20px 0;">
      <div style="margin-bottom:12px;">
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">
          Product
        </div>
        <div style="font-weight:500;color:#111827;">${productName}</div>
      </div>

      <div style="margin-bottom:12px;">
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">
          ${labelLine}
        </div>
        <div style="font-weight:500;color:#111827;">${valueLine}</div>
      </div>

      <div style="margin-bottom:12px;">
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">
          Order ID
        </div>
        <div style="font-family:ui-monospace,Menlo,Consolas,monospace;background:#fff;border:1px solid #d1d5db;border-radius:4px;padding:6px 8px;font-size:12px;color:#111827;font-weight:500;word-break:break-all;">
          ${invoiceId}
        </div>
      </div>

      <div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">
          Status
        </div>
        <div style="display:inline-block;background:#10b981;color:#ffffff;font-size:12px;font-weight:500;line-height:1.2;border-radius:4px;padding:4px 6px;border:1px solid #059669;">
          Paid
        </div>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="https://pagefoundry.de/dashboard"
         style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-size:13px;font-weight:500;line-height:1.4;padding:8px 12px;border-radius:4px;border:1px solid #111827;">
        View Dashboard
      </a>
      <div style="margin-top:12px;font-size:12px;color:#6b7280;word-break:break-all;">
        https://pagefoundry.de/dashboard
      </div>
    </div>

    <p style="margin:0 0 12px 0;font-size:12px;color:#6b7280;text-align:center;">
      This message confirms receipt of payment.
      A full invoice with address details is available on request.
    </p>

    <p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      – PageFoundry
    </p>
  </div>

  <div style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    PageFoundry · Kastanienweg 20a · 42499 Hückeswagen
  </div>
</div>`;
}

export function buildInvoiceMailText({
  productName,
  labelLine,
  valueLine,
  invoiceId,
}: {
  productName: string;
  labelLine: string;
  valueLine: string;
  invoiceId: string;
}) {
  return `Thank you for your purchase.

Product: ${productName}
${labelLine}: ${valueLine}
Order ID: ${invoiceId}

Your invoice is attached as PDF.

Dashboard:
https://pagefoundry.de/dashboard

– PageFoundry`;
}
