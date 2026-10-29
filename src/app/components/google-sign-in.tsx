import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";
export const googleSignInEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());

type CredentialResponse = { credential?: string };

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (configuration: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        auto_select: boolean;
        cancel_on_tap_outside: boolean;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

let googleScriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;
let credentialHandler: ((credential: string) => void) | null = null;

function loadGoogleIdentity(): Promise<void> {
  if (window.google) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    const script = existingScript ?? document.createElement("script");

    const onLoad = () => window.google ? resolve() : reject(new Error("No se pudo inicializar Google Identity Services."));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("No se pudo cargar Google Identity Services.")), { once: true });

    if (!existingScript) {
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return googleScriptPromise;
}

interface GoogleSignInProps {
  onCredential: (credential: string) => Promise<void>;
}

export function GoogleSignIn({ onCredential }: GoogleSignInProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [error, setError] = useState("");

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId || !buttonContainerRef.current) return;

    let active = true;

    const renderGoogleButton = async () => {
      try {
        await loadGoogleIdentity();
        if (!active || !window.google || !buttonContainerRef.current) return;

        credentialHandler = async (credential) => {
          setError("");
          try {
            await onCredentialRef.current(credential);
          } catch {
            setError("No se pudo verificar tu cuenta de Google. Inténtalo nuevamente.");
          }
        };

        if (initializedClientId !== clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (response.credential) credentialHandler?.(response.credential);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          initializedClientId = clientId;
        }

        buttonContainerRef.current.replaceChildren();
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: 320,
          locale: "es-419",
        });
      } catch (cause) {
        console.error(cause);
        if (active) setError("No se pudo cargar el acceso con Google.");
      }
    };

    void renderGoogleButton();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-2">
      <div ref={buttonContainerRef} className="min-h-10 flex justify-center" />
      {error && <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>}
    </div>
  );
}
