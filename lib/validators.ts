export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username: string): boolean {
  return (
    username.length >= 3 &&
    username.length <= 30 &&
    /^[a-zA-Z0-9_]+$/.test(username)
  );
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validatePostContent(content: string): boolean {
  return content.trim().length > 0 && content.length <= 280;
}

export function validateCommentText(text: string): boolean {
  return text.trim().length > 0 && text.length <= 200;
}

export const AllowedCategories = [
  "general",
  "announcement",
  "question",
] as const;
export type AllowedCategory = (typeof AllowedCategories)[number];

export function validateCategory(category?: string | null): boolean {
  if (!category) return true;
  return AllowedCategories.includes(category as any);
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateSignupData(
  email: string,
  password: string,
  username: string
): ValidationResult {
  const errors: string[] = [];

  if (!validateEmail(email)) {
    errors.push("Invalid email format");
  }

  if (!validatePassword(password)) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!validateUsername(username)) {
    errors.push(
      "Username must be 3-20 characters long and contain only letters, numbers, and underscores"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
