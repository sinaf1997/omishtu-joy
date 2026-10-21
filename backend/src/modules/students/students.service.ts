import crypto from 'crypto';
import { studentsRepository, StudentsRepository } from './students.repository.js';
import { hashPassword } from '../../utils/password.js';
import {
  StudentMember,
  StudentRecord,
  StudentStats,
  CreateStudentPayload,
  EmergencyContactResponse,
  EmergencyContactRecord,
} from './students.types.js';

export function getAddisAbabaYearCode(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Addis_Ababa',
    year: '2-digit',
  });
  return formatter.format(date);
}

function formatEmergencyContact(contact: EmergencyContactRecord): EmergencyContactResponse {
  const isPrimary = Boolean(contact.is_primary);
  const name = contact.full_name || contact.contact_name || '';
  const alt = contact.alternate_phone || contact.alt_phone || null;

  return {
    id: contact.id,
    studentId: contact.student_id,
    student_id: contact.student_id,
    fullName: name,
    full_name: name,
    relationship: contact.relationship,
    phone: contact.phone,
    alternatePhone: alt,
    alternate_phone: alt,
    isPrimary,
    is_primary: isPrimary,
    createdAt: contact.created_at,
    created_at: contact.created_at,
  };
}

function sanitizeStudent(record: StudentRecord, contacts: EmergencyContactRecord[] = []): StudentMember {
  const isActive = Boolean(record.is_active);
  const mustReset = Boolean(record.must_reset_password);
  const firstName = record.first_name || '';
  const lastName = record.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || record.student_code;
  const formattedContacts = contacts.map(formatEmergencyContact);

  return {
    id: record.id,
    studentCode: record.student_code,
    student_code: record.student_code,
    firstName,
    first_name: firstName,
    lastName,
    last_name: lastName,
    fullName,
    full_name: fullName,
    gender: record.gender || null,
    dateOfBirth: record.date_of_birth ? String(record.date_of_birth).slice(0, 10) : null,
    date_of_birth: record.date_of_birth ? String(record.date_of_birth).slice(0, 10) : null,
    phone: record.phone || null,
    email: record.email || null,
    address: record.address || null,
    city: record.city || null,
    registeredByStaffId: record.registered_by_staff_id || null,
    registered_by_staff_id: record.registered_by_staff_id || null,
    registeredByStaffName: record.registered_by_staff_name || null,
    registered_by_staff_name: record.registered_by_staff_name || null,
    registeredAt: record.registered_at || null,
    registered_at: record.registered_at || null,
    mustResetPassword: mustReset,
    must_reset_password: mustReset,
    isActive,
    is_active: isActive,
    lastLoginAt: record.last_login_at || null,
    last_login_at: record.last_login_at || null,
    emergencyContacts: formattedContacts,
    emergency_contacts: formattedContacts,
    createdAt: record.created_at,
    created_at: record.created_at,
    updatedAt: record.updated_at,
    updated_at: record.updated_at,
  };
}

export class StudentsService {
  constructor(private repo: StudentsRepository = studentsRepository) {}

  async createStudent(
    input: CreateStudentPayload & {
      studentCode?: string;
      student_code?: string;
      password: string;
    },
    staffUserId?: string
  ): Promise<StudentMember> {
    const isFullReg = Boolean(input.firstName || input.first_name || input.phone);

    // 1. FULL IN-PERSON SPRINT 2 REGISTRATION FLOW
    if (isFullReg) {
      const firstName = (input.firstName || input.first_name || '').trim();
      const lastName = (input.lastName || input.last_name || '').trim();
      const gender = (input.gender || 'male') as 'male' | 'female';
      const dateOfBirth = (input.dateOfBirth || input.date_of_birth || '').trim();
      const phone = (input.phone || '').trim();
      const email = input.email && input.email.trim() ? input.email.trim().toLowerCase() : null;
      const address = input.address && input.address.trim() ? input.address.trim() : null;
      const city = input.city && input.city.trim() ? input.city.trim() : null;
      const contactsInput = input.emergencyContacts || input.emergency_contacts || [];

      // Email uniqueness check (optional email)
      if (email) {
        const existingEmail = await this.repo.findStudentByEmail(email);
        if (existingEmail) {
          const err = new Error('A student with this email address is already registered');
          (err as unknown as { statusCode: number; code: string }).statusCode = 409;
          (err as unknown as { statusCode: number; code: string }).code = 'EMAIL_IN_USE';
          throw err;
        }
      }

      // Soft duplicate warning check: same phone & date of birth
      const allowWarning = Boolean(input.allowDuplicateWarning ?? input.allow_duplicate_warning);
      if (!allowWarning) {
        const dupStudent = await this.repo.findDuplicateByPhoneAndDob(phone, dateOfBirth);
        if (dupStudent) {
          const err = new Error(
            `A student with the same phone number and date of birth is already registered (Student ID: ${dupStudent.student_code})`
          );
          (err as unknown as { statusCode: number; code: string; existingStudentId: string }).statusCode = 409;
          (err as unknown as { statusCode: number; code: string; existingStudentId: string }).code = 'DUPLICATE_STUDENT_WARNING';
          (err as unknown as { statusCode: number; code: string; existingStudentId: string }).existingStudentId = dupStudent.student_code;
          throw err;
        }
      }

      if (!input.password || input.password.length < 8) {
        const err = new Error('Password must be at least 8 characters long');
        (err as unknown as { statusCode: number; code: string }).statusCode = 400;
        (err as unknown as { statusCode: number; code: string }).code = 'PASSWORD_TOO_SHORT';
        throw err;
      }

      const id = crypto.randomUUID();
      const passwordHash = await hashPassword(input.password);
      const yearCode = getAddisAbabaYearCode();

      const contacts = contactsInput.map((c, index) => ({
        id: crypto.randomUUID(),
        fullName: (c.fullName || c.full_name || '').trim(),
        relationship: c.relationship.trim(),
        phone: c.phone.trim(),
        alternatePhone: (c.alternatePhone || c.alternate_phone || '').trim() || null,
        isPrimary: index === 0,
      }));

      // Execute transaction
      const { studentCode } = await this.repo.createStudentTransaction(
        {
          id,
          firstName,
          lastName,
          gender,
          dateOfBirth,
          phone,
          email,
          address,
          city,
          passwordHash,
          registeredByStaffId: staffUserId || null,
          emergencyContacts: contacts,
        },
        yearCode
      );

      const created = await this.repo.findStudentById(id);
      const loadedContacts = await this.repo.getEmergencyContacts(id);
      if (!created) {
        throw new Error('Failed to retrieve newly created student record');
      }

      return sanitizeStudent(created, loadedContacts);
    }

    // 2. BACKWARD COMPATIBLE / DEV TEST CREATION FLOW
    const studentCode = (input.studentCode ?? input.student_code ?? '').trim().toUpperCase();
    if (!studentCode || studentCode.length < 3) {
      const err = new Error('Student ID must be at least 3 characters long');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'INVALID_STUDENT_CODE';
      throw err;
    }

    const existing = await this.repo.findStudentByCode(studentCode);
    if (existing) {
      const err = new Error('A student with this Student ID already exists');
      (err as unknown as { statusCode: number; code: string }).statusCode = 409;
      (err as unknown as { statusCode: number; code: string }).code = 'STUDENT_EXISTS';
      throw err;
    }

    if (!input.password || input.password.length < 8) {
      const err = new Error('Password must be at least 8 characters long');
      (err as unknown as { statusCode: number; code: string }).statusCode = 400;
      (err as unknown as { statusCode: number; code: string }).code = 'PASSWORD_TOO_SHORT';
      throw err;
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(input.password);

    await this.repo.createStudent({
      id,
      studentCode,
      passwordHash,
    });

    const created = await this.repo.findStudentById(id);
    if (!created) {
      throw new Error('Failed to retrieve newly created student record');
    }

    return sanitizeStudent(created);
  }

  async getStudentById(id: string): Promise<StudentMember> {
    const student = await this.repo.findStudentById(id);
    if (!student) {
      const err = new Error('Student record not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'STUDENT_NOT_FOUND';
      throw err;
    }

    const contacts = await this.repo.getEmergencyContacts(id);
    return sanitizeStudent(student, contacts);
  }

  async listStudents(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));

    const { students, total } = await this.repo.listStudentsPaginated({
      search: params.search,
      status: params.status,
      page,
      limit,
    });

    return {
      students: students.map((s) => sanitizeStudent(s)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getStudentStats(): Promise<StudentStats> {
    return this.repo.getStudentStats();
  }

  async toggleStudentStatus(id: string, isActive?: boolean): Promise<StudentMember> {
    const existing = await this.repo.findStudentById(id);
    if (!existing) {
      const err = new Error('Student record not found');
      (err as unknown as { statusCode: number; code: string }).statusCode = 404;
      (err as unknown as { statusCode: number; code: string }).code = 'STUDENT_NOT_FOUND';
      throw err;
    }

    const nextStatus = isActive !== undefined ? isActive : !Boolean(existing.is_active);
    await this.repo.updateStudentStatus(id, nextStatus);

    const updated = await this.repo.findStudentById(id);
    const contacts = await this.repo.getEmergencyContacts(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated student record');
    }

    return sanitizeStudent(updated, contacts);
  }
}

export const studentsService = new StudentsService();
