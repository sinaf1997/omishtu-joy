import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { usersService } from '../users/users.service.js';
import { comparePassword } from '../../utils/password.js';
import { sendSuccess, sendError } from '../../utils/api-response.js';
import { UserJwtPayload } from '../../types/index.js';
import { LoginInput } from './auth.schema.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;

  const user = await usersService.findByEmail(email);
  if (!user) {
    sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    return;
  }

  if (!user.isActive) {
    sendError(res, 'User account is inactive', 403, 'ACCOUNT_INACTIVE');
    return;
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    return;
  }

  const payload: UserJwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'],
  };

  const token = jwt.sign(payload, env.JWT_SECRET, signOptions);

  sendSuccess(res, {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    return;
  }

  const user = await usersService.findById(req.user.id);
  if (!user) {
    sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
    return;
  }

  sendSuccess(res, {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}
