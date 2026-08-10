import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GooglePickerProps {
  accessToken: string;
  onPick: (file: any) => void;
  onCancel?: () => void;
}

export default function GooglePicker({ accessToken, onPick, onCancel }: GooglePickerProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load the Google API script if it's not already loaded
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && window.gapi) {
      window.gapi.load('picker', { callback: createPicker });
    }
  }, [scriptLoaded, accessToken]);

  const createPicker = () => {
    if (!window.google?.picker) return;

    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          onPick(file);
        } else if (data.action === window.google.picker.Action.CANCEL) {
          if (onCancel) onCancel();
        }
      })
      .setOrigin(pickerOrigin)
      .build();
      
    picker.setVisible(true);
  };

  return null; // This is a headless component that just triggers the modal
}
