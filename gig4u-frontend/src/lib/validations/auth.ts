import { z } from 'zod';

export const signupSchema = z
  .object({
    phone: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit phone'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[0-9]/, 'Must contain number'),
    confirmPassword: z.string(),
    userType: z.enum(['CLIENT', 'SP']),
    companyName: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.userType !== 'CLIENT' || !!d.companyName, {
    message: 'Company name required for clients',
    path: ['companyName'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter valid 10-digit phone'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
