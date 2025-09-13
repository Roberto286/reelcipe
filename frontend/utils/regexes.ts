// Password validation regex: requires at least 8 characters with uppercase, lowercase, digit, and special character
export const passwordRegex = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
);

// Email validation regex (basic)
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
