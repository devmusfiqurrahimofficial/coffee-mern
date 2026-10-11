import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../../firebase.config";
import { Datacontex } from "../../contexApi/AuthContexApi";

export default function Profile() {
  const { user, setUser } = useContext(Datacontex);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { register, handleSubmit: handleFormSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      name: user?.displayName || "",
      username: user?.email?.split("@")[0] || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      photoURL: user?.photoURL || "",
    },
  });

  useEffect(() => {
    reset({
      name: user?.displayName || "",
      username: user?.email?.split("@")[0] || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      photoURL: user?.photoURL || "",
    });
  }, [reset, user]);

  const formData = watch();

  const onSubmit = async (data) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("No authenticated user found for profile save.");
      setSaveError("Please sign in before saving your profile.");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      let photoUrl = data.photoURL;

      if (data.photoURL && data.photoURL.startsWith("blob:")) {
        const fileName = `${currentUser.uid}-${Date.now()}`;
        const storageRef = ref(storage, `profiles/${fileName}`);
        const response = await fetch(data.photoURL);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        photoUrl = await getDownloadURL(storageRef);
      }

      await updateProfile(currentUser, {
        displayName: data.name,
        photoURL: photoUrl,
      });

      const profileData = {
        uid: currentUser.uid,
        displayName: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        username: data.username,
        photoURL: photoUrl,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", currentUser.uid), profileData, { merge: true });

      const updatedUser = {
        ...user,
        displayName: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        username: data.username,
        photoURL: photoUrl,
      };

      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Profile save failed:", error);
      setSaveError(error.message || "Unknown error while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset({
      name: user?.displayName || "",
      username: user?.email?.split("@")[0] || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      photoURL: user?.photoURL || "",
    });
    setIsEditing(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setValue("photoURL", previewUrl);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-5 py-10">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700" />

        <div className="px-6 pb-8 sm:px-10">
          <div className="-mt-16 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <div className="relative shrink-0">
                <img
                  src={formData.photoURL || user?.photoURL || "https://i.pravatar.cc/160?img=12"}
                  alt={user?.displayName || "Profile"}
                  className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md"
                />

                {isEditing && (
                  <label className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-blue-600 p-2 text-white shadow-md hover:bg-blue-700">
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    <span className="text-sm">📷</span>
                  </label>
                )}
              </div>

              <div className="pb-1">
                <h1 className="text-2xl font-bold text-slate-800">
                  {user?.displayName || "Your Name"}
                </h1>
                <p className="text-slate-500">{user?.email || "No email available"}</p>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  {formData.bio || "Add a short bio to tell people more about yourself."}
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          {saveError && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <form onSubmit={handleFormSubmit(onSubmit)} className="mt-10">
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Full Name"
                name="name"
                register={register("name")}
                disabled={!isEditing}
              />

              <Input
                label="Username"
                name="username"
                register={register("username")}
                disabled={!isEditing}
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                register={register("email")}
                disabled={!isEditing}
              />

              <Input
                label="Phone Number"
                name="phone"
                register={register("phone")}
                disabled={!isEditing}
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  About Me
                </label>
                <textarea
                  name="bio"
                  rows="4"
                  {...register("bio")}
                  disabled={!isEditing}
                  className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function Input({ label, name, type = "text", disabled, register }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <input
        type={type}
        name={name}
        {...register}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
      />
    </div>
  );
}