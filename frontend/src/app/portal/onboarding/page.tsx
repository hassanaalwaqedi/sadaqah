"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { 
  UserCircleIcon, 
  AcademicCapIcon, 
  BanknotesIcon,
  HeartIcon,
  BeakerIcon,
  LightBulbIcon,
  ScaleIcon,
  DocumentCheckIcon,
  BriefcaseIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

const identitySchema = z.object({
  first_name_en: z.string().min(2, "First Name (EN) is required"),
  last_name_en: z.string().min(2, "Last Name (EN) is required"),
  phone: z.string().min(5, "Phone number is required"),
  nationality: z.string().min(2, "Nationality is required"),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  gender: z.enum(["male", "female"]),
});

type IdentityFormValues = z.infer<typeof identitySchema>;

const ROLES = [
  { id: "student", label: "Student", icon: AcademicCapIcon, description: "I am a student at a university." },
  { id: "scholarship", label: "Scholarship Applicant", icon: AcademicCapIcon, description: "I want to apply for scholarships." },
  { id: "donor", label: "Donor", icon: BanknotesIcon, description: "I want to donate and support causes." },
  { id: "volunteer", label: "Volunteer", icon: HeartIcon, description: "I want to volunteer my time." },
  { id: "researcher", label: "Researcher", icon: BeakerIcon, description: "I am involved in academic research." },
  { id: "innovation", label: "Innovation Participant", icon: LightBulbIcon, description: "I want to participate in innovation competitions." },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<IdentityFormValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      first_name_en: "",
      last_name_en: "",
      phone: "",
      nationality: "",
      country: "",
      city: "",
      gender: "male"
    }
  });

  const onSubmitIdentity = async (data: IdentityFormValues) => {
    setIsSubmitting(true);
    try {
      await apiClient.post("/onboarding/identity", data);
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Failed to save identity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const onSubmitInterests = async () => {
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/onboarding/interests", { interests: selectedRoles });
      toast.success("Profile completed successfully!");
      await apiClient.post("/auth/refresh");
      await refreshUser();
      router.push("/portal");
    } catch (error: any) {
      toast.error(error.message || "Failed to save interests");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Step {step} of 2
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmitIdentity)} className="space-y-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                  <UserCircleIcon className="h-6 w-6 mr-2 text-primary-600" />
                  Basic Identity Information
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Please provide your fundamental contact details.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name (English)</label>
                  <input
                    type="text"
                    {...register("first_name_en")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  {errors.first_name_en && <p className="mt-1 text-sm text-red-600">{errors.first_name_en.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name (English)</label>
                  <input
                    type="text"
                    {...register("last_name_en")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  {errors.last_name_en && <p className="mt-1 text-sm text-red-600">{errors.last_name_en.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    {...register("phone")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    {...register("gender")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationality</label>
                  <input
                    type="text"
                    {...register("nationality")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  {errors.nationality && <p className="mt-1 text-sm text-red-600">{errors.nationality.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country of Residence</label>
                  <input
                    type="text"
                    {...register("country")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    {...register("city")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {isSubmitting ? "Saving..." : "Continue to Step 2"}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  How would you like to use the platform?
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select all the roles that apply to you. You can update this later.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
                      selectedRoles.includes(role.id)
                        ? "border-primary-500 ring-2 ring-primary-500"
                        : "border-gray-300 hover:border-primary-400"
                    }`}
                  >
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900 flex items-center">
                          <role.icon className="h-5 w-5 mr-2 text-primary-500" />
                          {role.label}
                        </span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          {role.description}
                        </span>
                      </span>
                    </span>
                    <CheckBadgeIcon
                      className={`h-5 w-5 text-primary-600 ${
                        selectedRoles.includes(role.id) ? "opacity-100" : "opacity-0"
                      } transition-opacity`}
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onSubmitInterests}
                  disabled={isSubmitting || selectedRoles.length === 0}
                  className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Completing Profile..." : "Complete Profile"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
