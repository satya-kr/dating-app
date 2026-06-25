const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(4, 'Name must be at least 4 characters').max(30, 'Name must be at most 30 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().length(10, 'Phone must be exactly 10 digits').regex(/^\d{10}$/, 'Phone must contain only digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
