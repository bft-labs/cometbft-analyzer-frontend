"use client";

import React, { useState, useRef, useEffect } from "react";
import { getNodeShortId } from "@/utils/dataUtils";

interface MultiSelectDropdownProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
}

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  className = "",
  placeholder = "Select options",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleOptionClick = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getDisplayName = (value: string) => {
    const option = options.find((opt) => opt.value === value);
    if (option) {
      // 노드 ID인 경우 짧은 ID를 반환
      if (option.label.includes("↔")) {
        return getNodeShortId(option.label);
      }
      if (option.value.length > 20) {
        return getNodeShortId(option.value);
      }
    }
    return option ? option.label : value;
  };

  const selectedLabels = selected.length > 0 ? selected.map(getDisplayName).join(", ") : placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="h-10 w-full appearance-none rounded-md border border-gray-600 bg-[#2E364D] px-3 py-2 text-sm text-white ring-offset-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-between"
        onClick={handleToggle}
      >
        <span className="truncate">{selectedLabels}</span>
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-[#2E364D] border border-gray-600 shadow-lg">
          <ul className="max-h-60 overflow-auto rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((option) => (
              <li
                key={option.value}
                className="text-white cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-700"
                onClick={() => handleOptionClick(option.value)}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    readOnly
                    className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 block truncate">{option.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}