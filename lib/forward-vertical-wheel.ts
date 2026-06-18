/** Let vertical wheel scroll the page when the pointer is over a horizontal scroller. */
export function attachForwardVerticalWheel(el: HTMLElement) {
  const onWheel = (event: WheelEvent) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    window.scrollBy({ top: event.deltaY, behavior: "auto" });
  };

  el.addEventListener("wheel", onWheel, { passive: false });
  return () => el.removeEventListener("wheel", onWheel);
}
