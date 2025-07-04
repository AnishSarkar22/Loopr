export function formatTimestamp(timestamp: string): string {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const today = new Date();

    // Format date part
    let datePart = '';
    if (date.toDateString() === today.toDateString()) {
        datePart = 'Today';
    } else {
        datePart = `${date.getMonth() + 1}/${date.getDate()}`;
    }

    // Format time part
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timePart = `${hours}:${minutes}`;

    return `${datePart} ${timePart}`;
}