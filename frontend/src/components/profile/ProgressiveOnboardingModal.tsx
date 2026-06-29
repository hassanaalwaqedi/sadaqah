import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { AcademicCapIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { apiClient } from "@/lib/api-client";
import { toast } from "react-hot-toast";

interface ProgressiveOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileType: "student" | "researcher" | "donor"; // Extensible
  onSuccess?: () => void;
}

export default function ProgressiveOnboardingModal({ isOpen, onClose, profileType, onSuccess }: ProgressiveOnboardingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simplified form for student profile for demonstration
  // In a real scenario, you'd render different forms based on `profileType`
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Endpoint depends on profileType
      // e.g., /profile/student
      await apiClient.post(`/profile/${profileType}`, data);
      toast.success(`${profileType} profile completed successfully!`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || `Failed to save ${profileType} profile`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded bg-white p-6 w-full shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center">
              <AcademicCapIcon className="h-6 w-6 mr-2 text-primary-600" />
              Complete {profileType.charAt(0).toUpperCase() + profileType.slice(1)} Profile
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            We need a bit more information before you can proceed with this action. 
            This information will be saved to your profile for future use.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {profileType === "student" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">University Name</label>
                  <input
                    type="text"
                    {...register("university_name", { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Faculty</label>
                  <input
                    type="text"
                    {...register("faculty", { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                    <input
                      type="number"
                      {...register("academic_year", { required: true, valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GPA</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("gpa", { required: true, valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="mr-3 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
