import React from 'react';

/**
 * Composant de modal générique et réutilisable.
 * @param {boolean} isOpen - Contrôle si le modal est visible ou non.
 * @param {function} onClose - Fonction à appeler lorsque le modal doit être fermé.
 * @param {React.ReactNode} children - Le contenu à afficher à l'intérieur du modal.
 */
const Modal = ({ isOpen, onClose, children }) => {
  // Si le modal n'est pas ouvert, nous ne rendons rien.
  if (!isOpen) {
    return null;
  }

  return (
    // L'overlay du modal. Il couvre tout l'écran avec un fond semi-transparent.
    // Un clic sur cet overlay ferme le modal.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Le conteneur principal du modal. Un clic ici ne ferme pas le modal. */}
      {/* Nous utilisons 'e.stopPropagation()' pour éviter que le clic ne se propage à l'overlay. */}
      <div
        className="relative bg-white rounded-xl shadow-2xl max-h-full overflow-y-auto w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton pour fermer le modal. */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          aria-label="Fermer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Le contenu du modal passé via les props 'children'. */}
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
