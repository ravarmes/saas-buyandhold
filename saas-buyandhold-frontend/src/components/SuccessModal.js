import React from 'react';

const SuccessModal = ({ isOpen, onClose, title, message, details }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="bg-green-50 px-6 py-4 rounded-t-lg border-b border-green-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-green-800">
                {title || 'Sucesso!'}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 text-base leading-relaxed">
            {message || 'Operação realizada com sucesso!'}
          </p>
          
          {details && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Detalhes:</h4>
              <div className="text-sm text-gray-600">
                {Array.isArray(details) ? (
                  <ul className="space-y-1">
                    {details.map((detail, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{details}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;