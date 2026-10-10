import { Html5Qrcode } from 'html5-qrcode';
import { useEffect } from 'react';

/**
 * Lecture d'un QR code avec la caméra du téléphone ou de la tablette
 * (US 7.3), avec la bibliothèque html5-qrcode
 * La caméra n'est accessible qu'en HTTPS (ou en local)
 * @param {object} props onScan (reçoit le texte lu dans le QR code)
 */
function QrScanner({ onScan }) {
  useEffect(() => {
    let done = false; // un seul billet lu par affichage de la caméra
    const scanner = new Html5Qrcode('qr-reader');
    // Caméra arrière du téléphone, 10 images par seconde
    const started = scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      (text) => {
        // La caméra lit le même QR code plusieurs fois par seconde
        if (!done) {
          done = true;
          onScan(text);
        }
      },
      () => {}, // pas de QR code dans l'image : on continue
    );
    // Nettoyage : la caméra est arrêtée quand l'écran du résultat
    // s'affiche ou quand on quitte la page, une fois son démarrage
    // terminé (sinon deux caméras s'affichent)
    return () => {
      started.then(() => scanner.stop()).catch(() => {});
    };
    // La caméra démarre une seule fois par affichage du composant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id="qr-reader" className="qr-reader"></div>;
}

export default QrScanner;
