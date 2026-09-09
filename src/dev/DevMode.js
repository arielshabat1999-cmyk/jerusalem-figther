// Dev-mode gate. Normal players never see the DEV button or panel: this is
// the ONLY thing that decides whether any of it exists in the DOM at all.
// `?dev=1` in the URL turns it on for that load; it's remembered in
// localStorage (a key entirely separate from the player save) so it
// survives a reload/stage-advance without the query string still being
// present, but a normal player who never added ?dev=1 never sees anything.
const DEV_FLAG_KEY = 'jerusalemFighter.devMode.v1';

function computeIsDevMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === '1') {
      localStorage.setItem(DEV_FLAG_KEY, '1');
      return true;
    }
    if (params.get('dev') === '0') {
      localStorage.removeItem(DEV_FLAG_KEY);
      return false;
    }
    return localStorage.getItem(DEV_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

const devModeOn = computeIsDevMode();

export function isDevMode() {
  return devModeOn;
}
