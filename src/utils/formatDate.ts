export function formatItemDate(timestamp: any): string {
  if (!timestamp) return '';
  
  // Handle Firestore Timestamp
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}
