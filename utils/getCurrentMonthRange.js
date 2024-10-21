export default function getCurrentMonthRange() {
    // Get the current date
    const today = new Date();
  
    // Get the year and month (0-indexed, so January is 0, etc.)
    const year = today.getFullYear();
    const month = today.getMonth();
  
    // Create a Date object for the first day of the current month
    const firstDay = new Date(year, month, 1);
  
    // Create a Date object for the last day of the current month
    const lastDay = new Date(year, month + 1, 0); // month + 1 sets it to the next month, day 0 goes to the last day of the previous month
  
    // Format the date range
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const firstDayFormatted = formatter.format(firstDay);
    const lastDayFormatted = formatter.format(lastDay);
  
    // Format the year (current year)
    const currentYear = firstDay.getFullYear();
  
    // Return the result as a string
    return `${firstDayFormatted} - ${lastDayFormatted}, ${currentYear}`;
  }
  
  console.log(getCurrentMonthRange());  // Output: Sep 1 - Sep 30, 2024 (for example)
  