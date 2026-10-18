/**
 * Phone vibration.
 *
 * Android: the Vibration API, so intensity can vary with duration.
 * iPhone: Safari has no Vibration API, but on iOS 18+ toggling a
 * `<input type="checkbox" switch>` plays a light system haptic tick, so
 * stronger feedback is a quick run of ticks instead of a longer buzz.
 * Both follow the phone's own vibration/haptics settings.
 */

let iosSwitch: HTMLLabelElement | null = null;
let lastTick = 0;

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function iosTick() {
  if (typeof document === "undefined") return;
  if (!iosSwitch) {
    iosSwitch = document.createElement("label");
    iosSwitch.setAttribute("aria-hidden", "true");
    iosSwitch.style.display = "none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.tabIndex = -1;
    iosSwitch.appendChild(input);
    document.body.appendChild(iosSwitch);
  }
  iosSwitch.click();
}

function vibrate(androidPattern: number | number[], iosTicks: number, gap = 70) {
  try {
    if (canVibrate()) {
      // Browsers only allow vibration after a real tap.
      if (navigator.userActivation?.hasBeenActive ?? true) navigator.vibrate(androidPattern);
      return;
    }
    for (let i = 0; i < iosTicks; i++) {
      if (i === 0) iosTick();
      else setTimeout(iosTick, i * gap);
    }
  } catch {
    /* no haptics on this device */
  }
}

/** Marking or clearing an X. Throttled so a fast drag feels like a zipper, not a blur. */
export function hapticTap() {
  const now = Date.now();
  if (now - lastTick < 35) return;
  lastTick = now;
  vibrate(12, 1);
}

/** Finding a cat: a little harder than an X. */
export function hapticFind() {
  vibrate(45, 2, 60);
}

/** A wrong guess. */
export function hapticStrike() {
  vibrate([70, 50, 70], 3, 90);
}

/** Winning: a celebratory rhythm. */
export function hapticWin() {
  vibrate([40, 60, 40, 60, 160], 5, 110);
}
