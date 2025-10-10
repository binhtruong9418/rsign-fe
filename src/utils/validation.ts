/**
 * Validates email format
 * @param email - Email string to validate
 * @returns True if email is valid
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param password - Password string to validate
 * @returns Object with validation result and message
 */
export const validatePassword = (
    password: string
): { isValid: boolean; message?: string } => {
    if (password.length < 6) {
        return {
            isValid: false,
            message: "Password must be at least 6 characters long",
        };
    }
    return { isValid: true };
};

/**
 * Validates required fields in a form
 * @param fields - Object with field names and values
 * @returns Array of error messages for invalid fields
 */
export const validateRequiredFields = (
    fields: Record<string, any>
): string[] => {
    const errors: string[] = [];

    Object.entries(fields).forEach(([key, value]) => {
        if (!value || (typeof value === "string" && value.trim() === "")) {
            errors.push(
                `${key.charAt(0).toUpperCase() + key.slice(1)} is required`
            );
        }
    });

    return errors;
};

/**
 * Validates file type and size
 * @param file - File to validate
 * @param maxSize - Maximum size in bytes (default: 10MB)
 * @param allowedTypes - Array of allowed MIME types
 * @returns Object with validation result and message
 */
export const validateFile = (
    file: File,
    maxSize: number = 10 * 1024 * 1024, // 10MB
    allowedTypes: string[] = ["image/*", "application/pdf", ".doc", ".docx"]
): { isValid: boolean; message?: string } => {
    if (file.size > maxSize) {
        return {
            isValid: false,
            message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        };
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    const isAllowed = allowedTypes.some((type) => {
        if (type.startsWith(".")) {
            return fileName.endsWith(type);
        }
        if (type.includes("*")) {
            return fileType.startsWith(type.replace("*", ""));
        }
        return fileType === type;
    });

    if (!isAllowed) {
        return { isValid: false, message: "File type not supported" };
    }

    return { isValid: true };
};
