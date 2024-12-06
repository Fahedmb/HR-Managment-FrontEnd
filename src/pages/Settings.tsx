import React, { useEffect, useState } from "react";
import axios from "axios";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";

const Settings = () => {
  const [user, setUser] = useState({
    id: null,
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    email: "",
    position: "",
    department: "",
  });

  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Load user data from localStorage when component mounts
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser && storedUser.id) {
      setUser(storedUser);
    }
  }, []);

  // Handle input field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  // Handle form submission to update user data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token"); // Get JWT from localStorage
    if (!token) {
      setError("You are not logged in.");
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:9090/api/users/${user.id}`,
        {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          phoneNumber: user.phoneNumber,
          position: user.position,
          department: user.department,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Ensure the JWT is sent in the Authorization header
          },
        }
      );

      const updatedUser = response.data;
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Store updated user in localStorage
      setUser(updatedUser); // Update state with new user data
      setSuccessMessage("Profile updated successfully!");
      setError("");
    } catch (err) {
      // Handle error gracefully
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || "Failed to update profile. Please try again.";
        setError(errorMessage);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-270">
      <Breadcrumb pageName="Settings" />
      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-5 xl:col-span-3">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Personal Information
              </h3>
            </div>
            <div className="p-7">
              <form onSubmit={handleSubmit}>
                <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
                  <div className="w-full sm:w-1/2">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="firstName"
                    >
                      First Name
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={user.firstName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="w-full sm:w-1/2">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="lastName"
                    >
                      Last Name
                    </label>
                    <input
                      className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={user.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mb-5.5">
                  <label
                    className="mb-3 block text-sm font-medium text-black dark:text-white"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    type="text"
                    name="username"
                    id="username"
                    value={user.username}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-5.5">
                  <label
                    className="mb-3 block text-sm font-medium text-black dark:text-white"
                    htmlFor="position"
                  >
                    Position
                  </label>
                  <input
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    type="text"
                    name="position"
                    id="position"
                    value={user.position}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-5.5">
                  <label
                    className="mb-3 block text-sm font-medium text-black dark:text-white"
                    htmlFor="department"
                  >
                    Department
                  </label>
                  <input
                    className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                    type="text"
                    name="department"
                    id="department"
                    value={user.department}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex justify-end gap-4.5">
                  <button
                    className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                    type="button"
                    onClick={() => {
                      // Reset to stored data
                      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                      setUser(storedUser);
                      setError("");
                      setSuccessMessage("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
                    type="submit"
                  >
                    Save
                  </button>
                </div>

                {error && <p className="mt-4 text-red-500">{error}</p>}
                {successMessage && <p className="mt-4 text-green-500">{successMessage}</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
