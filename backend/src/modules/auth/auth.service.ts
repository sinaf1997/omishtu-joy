import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { usersRepository } from '../users/users.repository.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { UserJwtPayload, PortalType, AuthUser } from '../../types/index.js';

export interface AuthSessionResponse {
  token: string;
  user: AuthUser;
}

export class AuthService {
  private generateToken(payload: UserJwtPayload): string {
    const signOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.JWT_SECRET, signOptions);
  }

  async loginStaff(email: string, password: string): Promise<AuthSessionResponse> {
    const staff = await usersRepository.findStaffByEmail(email);

    // Generic error message for both non-existent user and wrong password
    const invalidCredentialsError = new Error('Invalid email or password');
    (invalidCredentialsError as unknown as { statusCode: number; code: string }).statusCode = 401;
    (invalidCredentialsError as unknown as { statusCode: number; code: string }).code = 'INVALID_CREDENTIALS';

    if (!staff) {
      throw invalidCredentialsError;
    }

    if (!staff.is_active) {
      const inactiveError = new Error('Staff account is inactive. Please contact the center owner.');
      (inactiveError as unknown as { statusCode: number; code: string }).statusCode = 403;
      (inactiveError as unknown as { statusCode: number; code: string }).code = 'ACCOUNT_INACTIVE';
      throw inactiveError;
    }

    const isMatch = await comparePassword(password, staff.password_hash);
    if (!isMatch) {
      throw invalidCredentialsError;
    }

    await usersRepository.updateStaffLastLogin(staff.id);

    const mustReset = Boolean(staff.must_reset_password);
    const token = this.generateToken({
      id: staff.id,
      role: staff.role_name,
      portal: 'staff',
      mustResetPassword: mustReset,
    });

    return {
      token,
      user: {
        id: staff.id,
        fullName: staff.full_name,
        email: staff.email,
        role: staff.role_name,
        portal: 'staff',
        mustResetPassword: mustReset,
        isActive: true,
      },
    };
  }

  async loginStudent(studentCode: string, password: string): Promise<AuthSessionResponse> {
    const student = await usersRepository.findStudentByCode(studentCode);

    // Generic error message for both non-existent student ID and wrong password
    const invalidCredentialsError = new Error('Invalid Student ID or password');
    (invalidCredentialsError as unknown as { statusCode: number; code: string }).statusCode = 401;
    (invalidCredentialsError as unknown as { statusCode: number; code: string }).code = 'INVALID_CREDENTIALS';

    if (!student) {
      throw invalidCredentialsError;
    }

    if (!student.is_active) {
      const inactiveError = new Error('Student account is inactive. Please contact reception.');
      (inactiveError as unknown as { statusCode: number; code: string }).statusCode = 403;
      (inactiveError as unknown as { statusCode: number; code: string }).code = 'ACCOUNT_INACTIVE';
      throw inactiveError;
    }

    const isMatch = await comparePassword(password, student.password_hash);
    if (!isMatch) {
      throw invalidCredentialsError;
    }

    await usersRepository.updateStudentLastLogin(student.id);

    const mustReset = Boolean(student.must_reset_password);
    const token = this.generateToken({
      id: student.id,
      role: 'student',
      portal: 'student',
      mustResetPassword: mustReset,
    });

    return {
      token,
      user: {
        id: student.id,
        studentCode: student.student_code,
        role: 'student',
        portal: 'student',
        mustResetPassword: mustReset,
        isActive: true,
      },
    };
  }

  async changePassword(
    userId: string,
    portal: PortalType,
    currentPass: string,
    newPass: string
  ): Promise<AuthSessionResponse> {
    if (portal === 'staff') {
      const staff = await usersRepository.findStaffById(userId);
      if (!staff) {
        const notFound = new Error('Staff member not found');
        (notFound as unknown as { statusCode: number; code: string }).statusCode = 404;
        (notFound as unknown as { statusCode: number; code: string }).code = 'USER_NOT_FOUND';
        throw notFound;
      }

      const isCurrentValid = await comparePassword(currentPass, staff.password_hash);
      if (!isCurrentValid) {
        const err = new Error('Current password does not match');
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'INCORRECT_PASSWORD';
        throw err;
      }

      const newHash = await hashPassword(newPass);
      await usersRepository.updateStaffPassword(userId, newHash);

      const token = this.generateToken({
        id: staff.id,
        role: staff.role_name,
        portal: 'staff',
        mustResetPassword: false,
      });

      return {
        token,
        user: {
          id: staff.id,
          fullName: staff.full_name,
          email: staff.email,
          role: staff.role_name,
          portal: 'staff',
          mustResetPassword: false,
          isActive: true,
        },
      };
    } else {
      const student = await usersRepository.findStudentById(userId);
      if (!student) {
        const notFound = new Error('Student account not found');
        (notFound as unknown as { statusCode: number; code: string }).statusCode = 404;
        (notFound as unknown as { statusCode: number; code: string }).code = 'USER_NOT_FOUND';
        throw notFound;
      }

      const isCurrentValid = await comparePassword(currentPass, student.password_hash);
      if (!isCurrentValid) {
        const err = new Error('Current password does not match');
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'INCORRECT_PASSWORD';
        throw err;
      }

      const newHash = await hashPassword(newPass);
      await usersRepository.updateStudentPassword(userId, newHash);

      const token = this.generateToken({
        id: student.id,
        role: 'student',
        portal: 'student',
        mustResetPassword: false,
      });

      return {
        token,
        user: {
          id: student.id,
          studentCode: student.student_code,
          role: 'student',
          portal: 'student',
          mustResetPassword: false,
          isActive: true,
        },
      };
    }
  }

  async getMe(userId: string, portal: PortalType): Promise<AuthUser> {
    if (portal === 'staff') {
      const staff = await usersRepository.findStaffById(userId);
      if (!staff || !staff.is_active) {
        const notFound = new Error('Staff member not found or inactive');
        (notFound as unknown as { statusCode: number; code: string }).statusCode = 404;
        (notFound as unknown as { statusCode: number; code: string }).code = 'USER_NOT_FOUND';
        throw notFound;
      }

      return {
        id: staff.id,
        fullName: staff.full_name,
        email: staff.email,
        role: staff.role_name,
        portal: 'staff',
        mustResetPassword: Boolean(staff.must_reset_password),
        isActive: Boolean(staff.is_active),
      };
    } else {
      const student = await usersRepository.findStudentById(userId);
      if (!student || !student.is_active) {
        const notFound = new Error('Student account not found or inactive');
        (notFound as unknown as { statusCode: number; code: string }).statusCode = 404;
        (notFound as unknown as { statusCode: number; code: string }).code = 'USER_NOT_FOUND';
        throw notFound;
      }

      return {
        id: student.id,
        studentCode: student.student_code,
        role: 'student',
        portal: 'student',
        mustResetPassword: Boolean(student.must_reset_password),
        isActive: Boolean(student.is_active),
      };
    }
  }
}

export const authService = new AuthService();
