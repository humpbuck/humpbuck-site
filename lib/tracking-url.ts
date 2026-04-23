/**
 * Best-effort carrier tracking URL. Falls back to 17TRACK when unknown.
 */
export function trackingUrlForCarrier(
  carrier: string,
  trackingNumber: string,
): { url: string; label: string } {
  const num = trackingNumber.trim();
  const q = encodeURIComponent(num);
  const c = carrier.trim().toLowerCase();

  if (c.includes("usps") || c === "美国邮政")
    return { url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${q}`, label: "USPS" };
  if (c.includes("ups"))
    return { url: `https://www.ups.com/track?tracknum=${q}`, label: "UPS" };
  if (c.includes("fedex"))
    return { url: `https://www.fedex.com/fedextrack/?trknbr=${q}`, label: "FedEx" };
  // DHL eCommerce vs Express use different portals; 17TRACK reliably resolves eCommerce IDs.
  if (c.includes("ecommerce") && c.includes("dhl"))
    return {
      url: `https://t.17track.net/en#nums=${encodeURIComponent(num)}`,
      label: "DHL eCommerce",
    };
  if (c.includes("dhl"))
    return { url: `https://www.dhl.com/en/express/tracking.html?AWB=${q}`, label: "DHL" };
  if (c.includes("cainiao") || c.includes("菜鸟"))
    return {
      url: `https://global.cainiao.com/detail.htm?mailNo=${q}`,
      label: "Cainiao",
    };
  if (c.includes("yanwen") || c.includes("燕文"))
    return {
      url: `https://t.17track.net/en#nums=${encodeURIComponent(num)}`,
      label: "Yanwen",
    };
  if (c.includes("顺丰") || c.includes("sf express") || c === "sf")
    return { url: `https://www.sf-express.com/standard/en/standard/dynamic_function/waybill/#search/bill-number/${q}`, label: "SF Express" };
  if (c.includes("ems") || c.includes("中国邮政"))
    return { url: `https://www.ems.com.cn/queryList?mailNum=${q}`, label: "EMS" };

  return {
    url: `https://t.17track.net/en#nums=${encodeURIComponent(num)}`,
    label: "17TRACK",
  };
}
