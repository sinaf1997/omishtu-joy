import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createStudentApi } from '../../api/students.js';
import { StudentRecord } from '../../types/students.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Badge } from '../../components/ui/badge.js';
import {
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  Printer,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';

interface ContactFormData {
  fullName: string;
  relationship: string;
  phone: string;
  alternatePhone: string;
}

const phoneRegex = /^\+?[0-9\s-]+$/;
const isValidPhone = (val: string): boolean => {
  if (!phoneRegex.test(val)) return false;
  const digitsOnly = val.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 20;
};

const isValidDob = (val: string): boolean => {
  if (!val) return false;
  const dob = new Date(val);
  if (isNaN(dob.getTime())) return false;
  const now = new Date();
  if (dob >= now) return false;
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(now.getFullYear() - 5);
  return dob <= fiveYearsAgo;
};

export const StudentRegistrationPage: React.FC = () => {
  // Form Field States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Emergency Contacts (at least 1, max 3)
  const [contacts, setContacts] = useState<ContactFormData[]>([
    { fullName: '', relationship: '', phone: '', alternatePhone: '' },
  ]);

  // Submission & Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Soft Duplicate Warning Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<{ existingStudentId: string } | null>(null);

  // Success State
  const [createdStudent, setCreatedStudent] = useState<StudentRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleAddContact = () => {
    if (contacts.length < 3) {
      setContacts([
        ...contacts,
        { fullName: '', relationship: '', phone: '', alternatePhone: '' },
      ]);
    }
  };

  const handleRemoveContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const handleContactChange = (index: number, field: keyof ContactFormData, value: string) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim() || firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    if (!gender) {
      newErrors.gender = 'Please select a gender';
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!isValidDob(dateOfBirth)) {
      newErrors.dateOfBirth = 'Date of birth must be in the past and student at least 5 years old';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(phone)) {
      newErrors.phone = 'Phone must be between 7 and 20 digits (digits with optional +, spaces, dashes)';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate emergency contacts
    contacts.forEach((contact, idx) => {
      if (!contact.fullName.trim() || contact.fullName.trim().length < 2) {
        newErrors[`contact_${idx}_fullName`] = 'Contact name is required (min 2 chars)';
      }
      if (!contact.relationship.trim()) {
        newErrors[`contact_${idx}_relationship`] = 'Relationship is required';
      }
      if (!contact.phone.trim()) {
        newErrors[`contact_${idx}_phone`] = 'Phone number is required';
      } else if (!isValidPhone(contact.phone)) {
        newErrors[`contact_${idx}_phone`] = 'Phone must be between 7 and 20 digits';
      }
      if (contact.alternatePhone.trim() && !isValidPhone(contact.alternatePhone)) {
        newErrors[`contact_${idx}_alternatePhone`] = 'Alternate phone must be between 7 and 20 digits';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeRegistration = async (allowDuplicate = false) => {
    setSubmitting(true);
    setApiError(null);

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: gender as 'male' | 'female',
      dateOfBirth,
      phone: phone.trim(),
      email: email.trim() ? email.trim() : null,
      address: address.trim() ? address.trim() : null,
      city: city.trim() ? city.trim() : null,
      password,
      confirmPassword,
      emergencyContacts: contacts.map((c, i) => ({
        fullName: c.fullName.trim(),
        relationship: c.relationship.trim(),
        phone: c.phone.trim(),
        alternatePhone: c.alternatePhone.trim() ? c.alternatePhone.trim() : null,
        isPrimary: i === 0,
      })),
      allowDuplicateWarning: allowDuplicate,
    };

    try {
      const student = await createStudentApi(payload);
      setCreatedStudent(student);
      setDuplicateWarning(null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: {
            status?: number;
            data?: {
              error?: {
                code?: string;
                message?: string;
                details?: { existingStudentId?: string };
              };
            };
          };
        };
        const errData = axiosErr.response?.data?.error;
        if (errData?.code === 'DUPLICATE_STUDENT_WARNING') {
          const matchId =
            errData.details?.existingStudentId ||
            errData.message?.match(/otc\/\d+\/\d+/)?.[0] ||
            'Existing Student';
          setDuplicateWarning({ existingStudentId: matchId });
          return;
        }
        setApiError(errData?.message || 'Failed to register student');
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected error occurred during student registration');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await executeRegistration(false);
  };

  const handleCopyStudentId = () => {
    const idToCopy = createdStudent?.studentCode || createdStudent?.student_code;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleResetForNewStudent = () => {
    setFirstName('');
    setLastName('');
    setGender('');
    setDateOfBirth('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setPassword('');
    setConfirmPassword('');
    setContacts([{ fullName: '', relationship: '', phone: '', alternatePhone: '' }]);
    setErrors({});
    setApiError(null);
    setDuplicateWarning(null);
    setCreatedStudent(null);
  };

  // SUCCESS SCREEN
  if (createdStudent) {
    const sId = createdStudent.studentCode || createdStudent.student_code || '';
    const sName = `${createdStudent.firstName || createdStudent.first_name || ''} ${
      createdStudent.lastName || createdStudent.last_name || ''
    }`.trim() || sId;

    return (
      <div className="max-w-2xl mx-auto py-6 space-y-6">
        <Card className="border-border bg-card shadow-lg text-center">
          <CardHeader className="pt-8 pb-4">
            <div className="h-16 w-16 rounded-full bg-secondary text-primary mx-auto flex items-center justify-center mb-2 shadow-inner">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Student Registration Successful
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              The student profile has been created and registered in the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2 pb-8 px-6">
            {/* Student ID Showcase */}
            <div className="p-6 rounded-2xl bg-secondary border border-border space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Generated Student ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl sm:text-4xl font-mono font-extrabold text-foreground tracking-wider">
                  {sId}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyStudentId}
                  className="rounded-full h-9 px-3.5 flex items-center gap-1.5 bg-card text-xs font-medium"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-4 w-4 text-primary" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs font-medium text-foreground pt-1">
                Student: <strong>{sName}</strong>
              </p>
            </div>

            {/* Receptionist Reminder Alert */}
            <div className="p-4 rounded-xl bg-card border border-border text-left flex items-start gap-3 shadow-xs">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Receptionist Action Required
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Password is the one you just set. Tell the student their Student ID number and remind them to log in at the Student Portal to change their initial password.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to={`/staff/reception/students/${createdStudent.id}/slip`} className="w-full sm:w-auto">
                <Button
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 px-5 font-semibold text-xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print welcome slip</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetForNewStudent}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full py-2.5 px-5 text-xs font-medium"
              >
                <UserPlus className="h-4 w-4" />
                <span>Register another student</span>
              </Button>
              <Link to={`/staff/reception/students/${createdStudent.id}`} className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 rounded-full py-2.5 px-5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>View student profile</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/staff/reception/students"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to student list</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          In-Person Student Registration
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Complete student intake details, emergency contacts, and receptionist-assisted password setup
        </p>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <span className="font-medium">{apiError}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Personal Details */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-3.5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                1. Personal Details
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Official name, gender, and date of birth
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first-name" className="text-xs font-medium text-foreground">
                  First Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="e.g. Abebe"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`text-xs ${errors.firstName ? 'border-primary' : ''}`}
                  disabled={submitting}
                />
                {errors.firstName && (
                  <span className="text-[11px] font-medium text-primary block">{errors.firstName}</span>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last-name" className="text-xs font-medium text-foreground">
                  Last Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="e.g. Bikila"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`text-xs ${errors.lastName ? 'border-primary' : ''}`}
                  disabled={submitting}
                />
                {errors.lastName && (
                  <span className="text-[11px] font-medium text-primary block">{errors.lastName}</span>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-xs font-medium text-foreground">
                  Gender <span className="text-primary">*</span>
                </Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className={`w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring ${
                    errors.gender ? 'border-primary' : ''
                  }`}
                  disabled={submitting}
                >
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <span className="text-[11px] font-medium text-primary block">{errors.gender}</span>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-xs font-medium text-foreground">
                  Date of Birth <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={`text-xs ${errors.dateOfBirth ? 'border-primary' : ''}`}
                    disabled={submitting}
                  />
                </div>
                {errors.dateOfBirth && (
                  <span className="text-[11px] font-medium text-primary block">{errors.dateOfBirth}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Contact Details */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-3.5">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                2. Contact Details
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Primary phone number, optional email, and local address
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                  Phone Number <span className="text-primary">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. +251 91 122 3344"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`text-xs ${errors.phone ? 'border-primary' : ''}`}
                  disabled={submitting}
                />
                {errors.phone && (
                  <span className="text-[11px] font-medium text-primary block">{errors.phone}</span>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">
                  Email Address <span className="text-muted-foreground text-[10px]">(Optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. abebe@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`text-xs ${errors.email ? 'border-primary' : ''}`}
                  disabled={submitting}
                />
                {errors.email && (
                  <span className="text-[11px] font-medium text-primary block">{errors.email}</span>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-medium text-foreground">
                  City
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="e.g. Addis Ababa"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-xs"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-medium text-foreground">
                  Street / Subcity Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="e.g. Bole Subcity, Woreda 03"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-xs"
                  disabled={submitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Emergency Contacts */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-3.5 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold text-foreground">
                  3. Emergency Contact(s)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                At least one emergency contact is required (up to 3 contacts)
              </CardDescription>
            </div>
            {contacts.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddContact}
                disabled={submitting}
                className="text-xs rounded-full h-8 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add another contact</span>
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {contacts.map((contact, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-border bg-card space-y-3 relative"
              >
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Contact #{index + 1}
                    </span>
                    {index === 0 && (
                      <Badge variant="outline" className="text-[10px] bg-secondary text-primary font-semibold">
                        Primary Contact
                      </Badge>
                    )}
                  </div>
                  {contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContact(index)}
                      disabled={submitting}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-foreground">
                      Full Name <span className="text-primary">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. Almaz Kebede"
                      value={contact.fullName}
                      onChange={(e) => handleContactChange(index, 'fullName', e.target.value)}
                      className={`text-xs ${errors[`contact_${index}_fullName`] ? 'border-primary' : ''}`}
                      disabled={submitting}
                    />
                    {errors[`contact_${index}_fullName`] && (
                      <span className="text-[11px] font-medium text-primary block">
                        {errors[`contact_${index}_fullName`]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-foreground">
                      Relationship <span className="text-primary">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="e.g. Mother / Spouse / Brother"
                      value={contact.relationship}
                      onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                      className={`text-xs ${errors[`contact_${index}_relationship`] ? 'border-primary' : ''}`}
                      disabled={submitting}
                    />
                    {errors[`contact_${index}_relationship`] && (
                      <span className="text-[11px] font-medium text-primary block">
                        {errors[`contact_${index}_relationship`]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-foreground">
                      Phone Number <span className="text-primary">*</span>
                    </Label>
                    <Input
                      type="tel"
                      placeholder="e.g. +251 92 334 4556"
                      value={contact.phone}
                      onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                      className={`text-xs ${errors[`contact_${index}_phone`] ? 'border-primary' : ''}`}
                      disabled={submitting}
                    />
                    {errors[`contact_${index}_phone`] && (
                      <span className="text-[11px] font-medium text-primary block">
                        {errors[`contact_${index}_phone`]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-foreground">
                      Alternate Phone <span className="text-muted-foreground text-[10px]">(Optional)</span>
                    </Label>
                    <Input
                      type="tel"
                      placeholder="e.g. +251 11 234 5678"
                      value={contact.alternatePhone}
                      onChange={(e) => handleContactChange(index, 'alternatePhone', e.target.value)}
                      className={`text-xs ${errors[`contact_${index}_alternatePhone`] ? 'border-primary' : ''}`}
                      disabled={submitting}
                    />
                    {errors[`contact_${index}_alternatePhone`] && (
                      <span className="text-[11px] font-medium text-primary block">
                        {errors[`contact_${index}_alternatePhone`]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SECTION 4: Portal Access & Credentials */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-3.5">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                4. Portal Access
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Initial credentials for the Student Portal
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Student ID
              </Label>
              <Input
                type="text"
                disabled
                value="Generated automatically on save (otc/NNNNN/YY)"
                className="bg-secondary text-muted-foreground font-mono text-xs cursor-not-allowed border-dashed"
              />
              <span className="text-[11px] text-muted-foreground block">
                The Student ID will be generated atomically by the backend upon saving.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="student-pass" className="text-xs font-medium text-foreground">
                  Password <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="student-pass"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter student's chosen password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pr-9 text-xs ${errors.password ? 'border-primary' : ''}`}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-[11px] font-medium text-primary block">{errors.password}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-pass" className="text-xs font-medium text-foreground">
                  Confirm Password <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-pass"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password to confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pr-9 text-xs ${errors.confirmPassword ? 'border-primary' : ''}`}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="text-[11px] font-medium text-primary block">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground leading-relaxed">
              Ask the student which password to use. They can change it later in their profile.
            </div>
          </CardContent>

          <CardFooter className="border-t border-border pt-4 pb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link to="/staff/reception/students" className="w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                className="w-full sm:w-auto rounded-full text-xs"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto rounded-full text-xs font-semibold px-6 py-2"
            >
              {submitting ? 'Registering Student...' : 'Register student'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* SOFT DUPLICATE WARNING MODAL */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-xs">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2.5 text-primary">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <CardTitle className="text-base font-bold text-foreground">
                  Potential Duplicate Student
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-foreground leading-relaxed">
                A student with the same phone number and date of birth is already registered in the system:
              </p>
              <div className="p-3 rounded-lg bg-secondary border border-border text-center font-mono font-bold text-sm text-foreground">
                Existing Student ID: {duplicateWarning.existingStudentId}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Families or guardians sometimes share a contact number. If this is a different student, you may register them anyway.
              </p>
            </CardContent>
            <CardFooter className="border-t border-border pt-4 pb-4 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDuplicateWarning(null)}
                disabled={submitting}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => executeRegistration(true)}
                disabled={submitting}
                className="rounded-full text-xs font-semibold px-4"
              >
                {submitting ? 'Registering...' : 'Register anyway'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};
