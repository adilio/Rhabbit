import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { useStore } from "../lib/store";
import { IconDownload } from "./Icons";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaStatus() {
  const { habits } = useStore();
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh: () => setUpdateReady(true),
      onOfflineReady: () => setOfflineReady(true),
    });
    setUpdateSW(() => update);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (!online) {
    return <div className="pwa-banner" role="status"><span>Offline — your habits are safe and changes will sync later.</span></div>;
  }

  if (updateReady) {
    return (
      <div className="pwa-banner" role="status">
        <span>A fresh version of Rhabbit is ready.</span>
        <button onClick={() => void updateSW?.(true)}>Update now</button>
      </div>
    );
  }

  if (installPrompt && (habits?.length ?? 0) > 0) {
    return (
      <div className="pwa-banner pwa-install" role="status">
        <span>Keep Rhabbit close for quick daily check-ins.</span>
        <button onClick={() => void install()}><IconDownload /> Install app</button>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="pwa-banner" role="status">
        <span>Rhabbit is ready to use offline.</span>
        <button onClick={() => setOfflineReady(false)}>Got it</button>
      </div>
    );
  }

  return null;
}
