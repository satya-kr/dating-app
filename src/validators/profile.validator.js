const { z } = require('zod');

const completeProfileSchema = z.object({
  lookingFor: z.enum(['date', 'friend', 'not_decided']),
  gender: z.enum(['male', 'female', 'transgender']),
  interestedIn: z.enum(['male', 'female', 'transgender', 'any']),
  interests: z.array(z.string()).min(1, 'Select at least 1 interest').max(5, 'Max 5 interests allowed'),
  state: z.string().min(2, 'State is required'),
  city: z.string().min(2, 'City is required'),
  bio: z.string()
    .refine((val) => val.trim().split(/\s+/).length >= 10, { message: 'Bio must be at least 10 words' })
    .refine((val) => val.trim().split(/\s+/).length <= 100, { message: 'Bio must be at most 100 words' }),
});

module.exports = { completeProfileSchema };
