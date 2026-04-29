"use client";

/**
 * Web pages cannot read macOS/Windows "allow Chrome notifications" or know if a
 * banner was suppressed. We only document the steps; the extension popup
 * can show Chrome's Notification.permission.
 */
export function ExtensionNotificationHint() {
  return (
    <div className="mt-8 pt-8 border-t border-gray-200 text-left">
      <h2 className="text-sm font-semibold text-gray-900 mb-2">
        Browser extension alerts
      </h2>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">
        If you use the Acherons extension for Web Push, Chrome can still show{" "}
        <span className="font-medium">Notification permission: granted</span> while
        the system never shows a banner. Browsers do not expose “OS silenced
        Chrome” to websites, so you need to check system settings once.
      </p>
      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1.5 mb-3">
        <li>
          <span className="font-medium text-gray-800">macOS:</span> System
          Settings → Notifications → <span className="font-medium">Google Chrome</span>{" "}
          → turn notifications on and choose Banners or Alerts.
        </li>
        <li>
          <span className="font-medium text-gray-800">Windows:</span> Settings →
          System → Notifications → ensure Chrome is allowed.
        </li>
        <li>
          In the extension popup, use{" "}
          <span className="font-medium">Register Web Push</span> (it requests
          Chrome permission) and <span className="font-medium">Test notification</span>{" "}
          to confirm a banner appears.
        </li>
      </ul>
      <p className="text-xs text-gray-500">
        Optional: a short alert sound also plays in the extension when a push
        arrives, even if a banner is missed.
      </p>
    </div>
  );
}
