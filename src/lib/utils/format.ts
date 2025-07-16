export function formatTimestamp(timestamp: string): string {
	if (!timestamp) return 'Never';

	const date = new Date(timestamp);
	const today = new Date();

	// Remove time for comparison
	const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

	let datePart = '';
	const diffDays = Math.floor((dateOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		datePart = 'Today';
	} else if (diffDays === 1) {
		datePart = 'Tomorrow';
	} else if (diffDays === -1) {
		datePart = 'Yesterday';
	} else {
		datePart = `${date.getMonth() + 1}/${date.getDate()}`;
	}

	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const timePart = `${hours}:${minutes}`;

	return `${datePart} ${timePart}`;
}
