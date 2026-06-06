"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { UserCircleIcon, AcademicCapIcon, HomeModernIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

const onboardingSchema = z.object({
  phone_number: z.string().min(5, "Phone number is required"),
  nationality: z.string().min(2, "Nationality is required"),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  university_name: z.string().min(2, "University name is required"),
  faculty: z.string().min(2, "Faculty is required"),
  department: z.string().min(2, "Department is required"),
  academic_year: z.coerce.number().min(1).max(7),
  gpa: z.coerce.number().min(0, "GPA must be at least 0").max(4.0, "GPA cannot exceed 4.0"),
  housing_required: z.boolean(),
  family_income: z.coerce.number().min(0, "Income cannot be negative"),
  emergency_contact: z.string().min(5, "Emergency contact is required"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      phone_number: "",
      nationality: "",
      country: "",
      city: "",
      university_name: "",
      faculty: "",
      department: "",
      academic_year: 1,
      gpa: 0,
      housing_required: false,
      family_income: 0,
      emergency_contact: "",
    },
    mode: "onTouched",
  });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ["phone_number", "nationality", "country", "city"];
    if (step === 2) fieldsToValidate = ["university_name", "faculty", "department", "academic_year", "gpa"];
    if (step === 3) fieldsToValidate = ["family_income", "emergency_contact", "housing_required"];

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
        setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    setStep(s => s - 1);
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    try {
      await apiClient.post("/onboarding", data);
      await refreshUser(); // Update auth context so profile_completed is true
      toast.success("Profile completed successfully");
      router.push("/");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to submit profile. Please try again.");
    }
  };

  const StepIndicator = ({ current, target, label, icon: Icon }: { current: number, target: number, label: string, icon: any }) => (
    <div className={`flex flex-col items-center gap-2 ${current >= target ? 'text-primary-600' : 'text-surface-400'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
        current >= target ? 'bg-primary-50 border-primary-500 shadow-lg shadow-primary-500/20 dark:bg-primary-900/30' : 'border-surface-200 dark:border-surface-700'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold gradient-text mb-2">Welcome to Sadaqah</h1>
        <p className="text-surface-600 dark:text-surface-400">Please complete your profile before applying for scholarships.</p>
      </div>

      <div className="flex justify-between items-center mb-12 relative">
        <div className="absolute top-5 left-10 right-10 h-0.5 bg-surface-200 dark:bg-surface-700 -z-10"></div>
        <div 
          className="absolute top-5 left-10 h-0.5 bg-primary-500 -z-10 transition-all duration-500"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        ></div>
        
        <StepIndicator current={step} target={1} label="Personal" icon={UserCircleIcon} />
        <StepIndicator current={step} target={2} label="Academic" icon={AcademicCapIcon} />
        <StepIndicator current={step} target={3} label="Details" icon={HomeModernIcon} />
        <StepIndicator current={step} target={4} label="Review" icon={CheckBadgeIcon} />
      </div>

      <div className="glass-card p-8 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold border-b pb-2">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Phone Number</label>
                  <input type="tel" {...register("phone_number")} className={`form-input w-full ${errors.phone_number ? 'border-red-500' : ''}`} placeholder="+1 234 567 8900" />
                  {errors.phone_number && <p className="mt-1 text-sm text-red-500">{errors.phone_number.message}</p>}
                </div>
                <div>
                  <label className="form-label">Nationality</label>
                  <input type="text" {...register("nationality")} className={`form-input w-full ${errors.nationality ? 'border-red-500' : ''}`} placeholder="e.g. Canadian" />
                  {errors.nationality && <p className="mt-1 text-sm text-red-500">{errors.nationality.message}</p>}
                </div>
                <div>
                  <label className="form-label">Country of Residence</label>
                  <input type="text" {...register("country")} className={`form-input w-full ${errors.country ? 'border-red-500' : ''}`} placeholder="e.g. Canada" />
                  {errors.country && <p className="mt-1 text-sm text-red-500">{errors.country.message}</p>}
                </div>
                <div>
                  <label className="form-label">City</label>
                  <input type="text" {...register("city")} className={`form-input w-full ${errors.city ? 'border-red-500' : ''}`} placeholder="e.g. Toronto" />
                  {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Academic Info */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold border-b pb-2">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">University Name</label>
                  <input type="text" {...register("university_name")} className={`form-input w-full ${errors.university_name ? 'border-red-500' : ''}`} placeholder="Enter full university name" />
                  {errors.university_name && <p className="mt-1 text-sm text-red-500">{errors.university_name.message}</p>}
                </div>
                <div>
                  <label className="form-label">Faculty</label>
                  <input type="text" {...register("faculty")} className={`form-input w-full ${errors.faculty ? 'border-red-500' : ''}`} placeholder="e.g. Engineering" />
                  {errors.faculty && <p className="mt-1 text-sm text-red-500">{errors.faculty.message}</p>}
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <input type="text" {...register("department")} className={`form-input w-full ${errors.department ? 'border-red-500' : ''}`} placeholder="e.g. Computer Science" />
                  {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department.message}</p>}
                </div>
                <div>
                  <label className="form-label">Academic Year</label>
                  <select {...register("academic_year")} className="form-input w-full">
                    {[1,2,3,4,5,6,7].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Cumulative GPA (Out of 4.0)</label>
                  <input type="number" step="0.01" min="0" max="4.0" {...register("gpa")} className={`form-input w-full ${errors.gpa ? 'border-red-500' : ''}`} placeholder="3.85" />
                  {errors.gpa && <p className="mt-1 text-sm text-red-500">{errors.gpa.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Scholarship Info */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold border-b pb-2">Scholarship Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Total Family Income (Annual USD)</label>
                  <input type="number" {...register("family_income")} className={`form-input w-full ${errors.family_income ? 'border-red-500' : ''}`} placeholder="e.g. 45000" />
                  {errors.family_income && <p className="mt-1 text-sm text-red-500">{errors.family_income.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Emergency Contact</label>
                  <input type="text" {...register("emergency_contact")} className={`form-input w-full ${errors.emergency_contact ? 'border-red-500' : ''}`} placeholder="Name and phone number" />
                  {errors.emergency_contact && <p className="mt-1 text-sm text-red-500">{errors.emergency_contact.message}</p>}
                </div>
                <div className="md:col-span-2 flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border">
                  <input type="checkbox" id="housing" {...register("housing_required")} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                  <label htmlFor="housing" className="font-medium cursor-pointer">I require university housing allocation</label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2 text-primary-600">
                <CheckBadgeIcon className="w-6 h-6" /> Review Your Profile
              </h2>
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-surface-500">Phone:</span> {getValues("phone_number")}</div>
                  <div><span className="text-surface-500">Location:</span> {getValues("city")}, {getValues("country")}</div>
                  <div><span className="text-surface-500">University:</span> {getValues("university_name")}</div>
                  <div><span className="text-surface-500">Major:</span> {getValues("department")} (Year {getValues("academic_year")})</div>
                  <div><span className="text-surface-500">GPA:</span> {getValues("gpa")}</div>
                  <div><span className="text-surface-500">Housing Needed:</span> {getValues("housing_required") ? 'Yes' : 'No'}</div>
                </div>
              </div>
              <p className="text-sm text-surface-500 text-center">By submitting, you confirm that all provided information is accurate and true.</p>
            </div>
          )}

          <div className="mt-8 flex justify-between pt-6 border-t border-surface-200 dark:border-surface-700">
            {step > 1 ? (
              <button type="button" onClick={prevStep} disabled={isSubmitting} className="btn-outline px-6">Back</button>
            ) : <div></div>}
            
            {step < 4 ? (
              <button type="button" onClick={nextStep} className="btn-gradient px-8 shadow-lg shadow-primary-500/25">Continue</button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="btn-gradient px-8 shadow-lg shadow-primary-500/25 bg-emerald-500 hover:bg-emerald-600 border-none flex items-center gap-2">
                {isSubmitting ? 'Submitting...' : 'Complete Profile'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
