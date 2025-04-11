// PWA Installation hooks and helpers

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// PWA install event storage
let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Setup PWA install event listener
export function setupPwaInstallation() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Store the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    console.log('App can be installed, saved event');
  });

  // Event when PWA is installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
  });
}

// Check if the app can be installed
export function canInstallPwa(): boolean {
  return !!deferredPrompt;
}

// Prompt user to install the PWA
export async function promptInstallPwa(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('App cannot be installed');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const choiceResult = await deferredPrompt.userChoice;

  // We no longer need the prompt
  deferredPrompt = null;

  // Return true if the user accepted the installation
  return choiceResult.outcome === 'accepted';
}