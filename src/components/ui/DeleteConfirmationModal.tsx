'use client'

import { useState } from 'react'
import { XMarkIcon, ExclamationTriangleIcon, TrashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  userName: string
  deleteType: 'soft' | 'hard'
  isLoading?: boolean
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  deleteType,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const isSoftDelete = deleteType === 'soft'
  const confirmTextRequired = isSoftDelete ? 'SOFT DELETE' : 'HARD DELETE'

  const handleConfirm = () => {
    if (confirmText === confirmTextRequired) {
      onConfirm(reason)
    }
  }

  const handleClose = () => {
    setReason('')
    setConfirmText('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isSoftDelete ? (
              <ArchiveBoxIcon className="h-6 w-6 text-orange-500" />
            ) : (
              <TrashIcon className="h-6 w-6 text-red-500" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {isSoftDelete ? 'Soft Delete User' : 'Hard Delete User'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className={`p-4 rounded-lg border-l-4 ${
            isSoftDelete 
              ? 'bg-orange-50 border-orange-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${
                isSoftDelete ? 'text-orange-500' : 'text-red-500'
              }`} />
              <div>
                <h4 className={`font-medium ${
                  isSoftDelete ? 'text-orange-800' : 'text-red-800'
                }`}>
                  {isSoftDelete ? 'Soft Delete Warning' : 'Hard Delete Warning'}
                </h4>
                <p className={`text-sm mt-1 ${
                  isSoftDelete ? 'text-orange-700' : 'text-red-700'
                }`}>
                  {isSoftDelete ? (
                    <>
                      This will mark <strong>{userName}</strong> as deleted but keep all their data.
                      The user will be hidden from the application list but can be restored later.
                    </>
                  ) : (
                    <>
                      This will <strong>permanently delete</strong> all data for <strong>{userName}</strong>.
                      This action cannot be undone and will remove all user information, profiles, and related data.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for deletion (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for deletion..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Confirmation Text */}
          <div>
            <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
              Type <code className="bg-gray-100 px-2 py-1 rounded text-sm">{confirmTextRequired}</code> to confirm:
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmTextRequired}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText !== confirmTextRequired || isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              confirmText !== confirmTextRequired || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : isSoftDelete
                ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </div>
            ) : (
              `${isSoftDelete ? 'Soft Delete' : 'Hard Delete'} User`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
