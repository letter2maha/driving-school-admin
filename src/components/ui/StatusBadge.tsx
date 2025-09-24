interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'incomplete'
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800'
    },
    approved: {
      label: 'Approved',
      className: 'bg-green-100 text-green-800'
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800'
    },
    incomplete: {
      label: 'Incomplete',
      className: 'bg-gray-100 text-gray-800'
    }
  }

  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  )
}
