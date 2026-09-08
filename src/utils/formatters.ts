export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function getTicketId(issue: { id?: string; ticket_id?: string } | string | undefined | null): string {
  if (!issue) return '#CP-0000';
  if (typeof issue === 'string') {
    const clean = issue.replace(/[^a-zA-Z0-9]/g, '');
    return `#CP-${clean.substring(0, 6).toUpperCase() || '0000'}`;
  }
  if (issue.ticket_id) {
    return issue.ticket_id.startsWith('#') ? issue.ticket_id : `#${issue.ticket_id}`;
  }
  if (issue.id) {
    const clean = issue.id.replace(/[^a-zA-Z0-9]/g, '');
    return `#CP-${clean.substring(0, 6).toUpperCase() || '0000'}`;
  }
  return '#CP-0000';
}
