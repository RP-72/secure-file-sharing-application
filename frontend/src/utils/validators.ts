export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.toLowerCase());
};

export const validatePassword = (password: string): { 
  isValid: boolean; 
  message: string 
} => {
  if (password.length < 8) {
    return { 
      isValid: false, 
      message: 'Password must be at least 8 characters long' 
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter' 
    };
  }
  
  if (!/[a-z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one lowercase letter' 
    };
  }
  
  if (!/[0-9]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one number' 
    };
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one special character (!@#$%^&*)' 
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateFile = (file: File): { 
  isValid: boolean; 
  message: string 
} => {
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      message: 'File size must not exceed 10MB' 
    };
  }

  // Check file type
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'video/mp4',
    'application/zip'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      message: 'Invalid file type' 
    };
  }

  return { isValid: true, message: '' };
};

export const validateUsername = (username: string): { 
  isValid: boolean;
  message: string;
} => {
  // Remove whitespace
  username = username.trim();
  
  // Check length
  if (username.length < 3 || username.length > 30) {
    return {
      isValid: false,
      message: 'Username must be between 3 and 30 characters'
    };
  }

  // Check for valid characters
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      message: 'Username can only contain letters, numbers, dots, underscores and dashes'
    };
  }

  return { isValid: true, message: '' };
};

export const sanitizeUsername = (username: string): string => {
  return username.trim().toLowerCase();
};

export const sanitizeLoginInput = (input: string): string => {
  // This handles both email and username inputs for login
  return input.trim().toLowerCase();
}; 