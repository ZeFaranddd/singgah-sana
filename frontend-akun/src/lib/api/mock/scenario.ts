export const scenarios = {
  normal: "Normal",
  kosong: "Data kosong",
  gagal: "Server gagal (500)",
  lambat: "Respons lambat (3 dtk)",
  sesi: "Sesi berakhir (401)",
  dibatasi: "Akun dibatasi (403)",
} as const;
export type Scenario = keyof typeof scenarios;

const KEY = "ss-mock-scenario";

export function getScenario(): Scenario {
  try {
    const fromUrl = new URLSearchParams(location.search).get("mock");
    if (fromUrl && fromUrl in scenarios) sessionStorage.setItem(KEY, fromUrl);
    const v = sessionStorage.getItem(KEY);
    if (v && v in scenarios) return v as Scenario;
  } catch {
    /* storage dapat diblokir */
  }
  return "normal";
}
export function setScenario(s: Scenario) {
  try {
    sessionStorage.setItem(KEY, s);
  } catch {
    /* abaikan */
  }
}
