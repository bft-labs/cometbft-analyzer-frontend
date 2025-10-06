"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Home, Search, User, ChevronDown } from "lucide-react";

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-[#2E364D] border border-gray-600 rounded-lg shadow-lg z-50">
      <div className="p-2">
        <div className="text-xs text-gray-400 font-medium mb-2">ACTIONS</div>
        <div className="space-y-1">
          <Link
            href="/projects/new"
            className="block px-3 py-2 text-sm text-white hover:bg-[#3A4255] rounded"
            onClick={onClose}
          >
            New project
          </Link>
          <Link
            href="/simulations/new"
            className="block px-3 py-2 text-sm text-white hover:bg-[#3A4255] rounded"
            onClick={onClose}
          >
            New simulation
          </Link>
        </div>
        
        <div className="text-xs text-gray-400 font-medium mb-2 mt-4">PAGES</div>
        <div className="space-y-1">
          <Link
            href="/projects"
            className="block px-3 py-2 text-sm text-white hover:bg-[#3A4255] rounded"
            onClick={onClose}
          >
            Projects
          </Link>
        </div>
      </div>
    </div>
  );
};

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const mockUser = {
    name: "Developer User",
    email: "dev@example.com"
  };

  return (
    <div className="absolute top-full right-0 mt-1 bg-[#2E364D] border border-gray-600 rounded-lg shadow-lg z-50 min-w-[200px]">
      <div className="p-3 border-b border-gray-600">
        <div className="text-sm font-medium text-white">{mockUser.name}</div>
        <div className="text-xs text-gray-400">{mockUser.email}</div>
      </div>
      <div className="p-2">
        <Link
          href="/profile"
          className="block px-3 py-2 text-sm text-white hover:bg-[#3A4255] rounded"
          onClick={onClose}
        >
          Profile
        </Link>
        <button
          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#3A4255] rounded"
          onClick={() => {
            // TODO: Implement sign out logic
            console.log("Sign out clicked");
            onClose();
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

const Header: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  return (
    <header className="bg-[#1C2337] border-b border-gray-700 h-14 flex items-center justify-between px-6">
      {/* Left - Home icon */}
      <div className="flex items-center">
        <Link href="/projects" className="p-2 hover:bg-[#2E364D] rounded-lg">
          <Home size={20} className="text-white" />
        </Link>
      </div>

      {/* Center - Search bar */}
      <div className="flex-1 max-w-md mx-4 relative">
        <div
          className="bg-[#2E364D] border border-gray-600 rounded-lg px-3 py-2 flex items-center cursor-pointer hover:border-gray-500 transition-colors"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Search size={16} className="text-gray-400 mr-2" />
          <span className="text-gray-400 text-sm flex-1">Search or jump to...</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
        
        <SearchDropdown 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
        />
      </div>

      {/* Right - User profile */}
      <div className="flex items-center relative">
        <button
          className="p-2 hover:bg-[#2E364D] rounded-lg flex items-center"
          onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
        >
          <User size={20} className="text-white" />
          <ChevronDown size={16} className="text-gray-400 ml-1" />
        </button>
        
        <UserDropdown 
          isOpen={isUserDropdownOpen} 
          onClose={() => setIsUserDropdownOpen(false)} 
        />
      </div>

      {/* Click outside to close dropdowns */}
      {(isSearchOpen || isUserDropdownOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsSearchOpen(false);
            setIsUserDropdownOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;