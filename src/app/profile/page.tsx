"use client";

import React, { useState } from "react";
import { User, Mail, Calendar, Save, Shield } from "lucide-react";

const mockUser = {
  id: "1",
  name: "Developer User", 
  email: "dev@example.com",
  joinedAt: new Date("2024-01-01"),
  role: "Developer",
  avatar: null,
  preferences: {
    theme: "dark",
    notifications: true,
    autoRefresh: true
  },
  stats: {
    totalProjects: 3,
    totalSimulations: 8,
    totalLogFiles: 24
  }
};

export default function ProfilePage() {
  const [user, setUser] = useState(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    notifications: user.preferences.notifications,
    autoRefresh: user.preferences.autoRefresh
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSave = () => {
    // TODO: Implement API call to update user profile
    setUser(prev => ({
      ...prev,
      name: formData.name,
      email: formData.email,
      preferences: {
        ...prev.preferences,
        notifications: formData.notifications,
        autoRefresh: formData.autoRefresh
      }
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      notifications: user.preferences.notifications,
      autoRefresh: user.preferences.autoRefresh
    });
    setIsEditing(false);
  };

  return (
    <div className="px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[#2864FF] hover:text-[#1E4ED8] text-sm font-medium"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="text-gray-400 hover:text-white text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-[#2864FF] hover:bg-[#1E4ED8] text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-1"
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-[#1C2337] border border-gray-600 rounded-full flex items-center justify-center">
                  <User size={32} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{user.name}</h3>
                  <p className="text-gray-400">{user.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-[#1C2337] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-300">{user.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-[#1C2337] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#2864FF] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-300">{user.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Member Since
                  </label>
                  <p className="text-gray-300">{user.joinedAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Email Notifications</h3>
                    <p className="text-gray-400 text-sm">Receive email updates about your simulations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="notifications"
                      checked={isEditing ? formData.notifications : user.preferences.notifications}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2864FF]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Auto Refresh</h3>
                    <p className="text-gray-400 text-sm">Automatically refresh data views</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="autoRefresh"
                      checked={isEditing ? formData.autoRefresh : user.preferences.autoRefresh}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2864FF]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Statistics</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2864FF]/20 rounded-lg flex items-center justify-center">
                    <Shield size={20} className="text-[#2864FF]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{user.stats.totalProjects}</p>
                    <p className="text-gray-400 text-sm">Projects</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Calendar size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{user.stats.totalSimulations}</p>
                    <p className="text-gray-400 text-sm">Simulations</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Mail size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{user.stats.totalLogFiles}</p>
                    <p className="text-gray-400 text-sm">Log Files</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#2E364D] border border-gray-600 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
              
              <div className="space-y-3">
                <button className="w-full text-left text-gray-300 hover:text-white text-sm py-2">
                  Change Password
                </button>
                <button className="w-full text-left text-gray-300 hover:text-white text-sm py-2">
                  Export Data
                </button>
                <hr className="border-gray-600" />
                <button className="w-full text-left text-red-400 hover:text-red-300 text-sm py-2">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}