import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { TooltipProps } from "recharts";

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`border rounded-lg shadow-sm bg-gray-800 border-gray-700 text-white ${className}`}>{children}</div>
);

export const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`font-semibold ${className}`}>{children}</h3>
);

export const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-400 ${className}`}>{children}</p>
);

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export const Badge = ({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) => {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors";
  const variantClasses = variant === "outline" ? "border-gray-500 text-gray-300" : "bg-blue-500 text-white";
  return <span className={`${baseClasses} ${variantClasses} ${className}`}>{children}</span>;
};

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={cn("h-4 w-4", className)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const Check = ({ className }: { className?: string }) => (
  <svg
    className={cn("h-4 w-4", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// --- Select Component Implementation ---

interface SelectContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedValue?: string;
  setSelectedValue: (value: string) => void;
  selectedLabel: ReactNode;
  setSelectedLabel: (label: ReactNode) => void;
}

const SelectContext = createContext<SelectContextProps | undefined>(undefined);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("useSelectContext must be used within a Select provider");
  }
  return context;
};

export const Select = ({
  children,
  value,
  onValueChange,
}: {
  children: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [selectedLabel, setSelectedLabel] = useState<ReactNode>(null);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    if (value === undefined) {
      setSelectedLabel(null);
      return;
    }
    React.Children.forEach(children, (child) => {
      if (React.isValidElement<{ children: ReactNode }>(child) && child.type === SelectContent) {
        React.Children.forEach(child.props.children, (item) => {
          if (React.isValidElement<{ value: string; children: ReactNode }>(item) && item.props.value === value) {
            setSelectedLabel(item.props.children);
          }
        });
      }
    });
  }, [value, children]);

  const contextValue = {
    open,
    setOpen,
    selectedValue,
    setSelectedValue: (val: string) => {
      setSelectedValue(val);
      if (onValueChange) {
        onValueChange(val);
      }
      setOpen(false);
    },
    selectedLabel,
    setSelectedLabel,
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { selectedLabel } = useSelectContext();
  return <span className="line-clamp-1">{selectedLabel ?? placeholder}</span>;
};

export const SelectTrigger = React.forwardRef<HTMLButtonElement, { children: ReactNode; className?: string }>(
  ({ className, children, ...props }, ref) => {
    const { setOpen, open } = useSelectContext();
    return (
      <button
        ref={ref}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-600 bg-[#2E364D] px-3 py-2 text-sm text-white ring-offset-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  ({ className, children, ...props }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { open, setOpen } = useSelectContext();

    React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open, setOpen]);

    if (!open) return null;

    return (
      <div
        ref={contentRef}
        className={cn(
          "absolute z-50 mt-1 max-h-96 min-w-[8rem] w-full overflow-hidden rounded-md border border-gray-700 bg-[#2E364D] text-white shadow-md",
          className
        )}
        {...props}
      >
        <div className="p-1">{children}</div>
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<HTMLDivElement, { children: ReactNode; className?: string; value: string }>(
  ({ className, children, value, ...props }, ref) => {
    const { selectedValue, setSelectedValue, setSelectedLabel } = useSelectContext();
    const isSelected = selectedValue === value;

    const handleSelect = () => {
      setSelectedValue(value);
      setSelectedLabel(children);
    };

    return (
      <div
        ref={ref}
        onClick={handleSelect}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-600 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export const TabsContext = createContext<{ activeTab: string; setActiveTab: (value: string) => void }>({
  activeTab: "",
  setActiveTab: () => {},
});

export const Tabs = ({
  children,
  defaultValue,
  className,
}: {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`inline-flex h-10 items-center justify-center rounded-md bg-[#2E364D] p-1 text-gray-400 ${className}`}
  >
    {children}
  </div>
);

export const TabsTrigger = ({ children, value }: { children: React.ReactNode; value: string }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-gray-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive ? "bg-blue-600 text-white shadow-sm" : ""
      }`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({
  children,
  value,
  className,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) => {
  const { activeTab } = useContext(TabsContext);
  return activeTab === value ? <div className={`mt-2 ${className}`}>{children}</div> : null;
};

export const Progress = ({ value, className }: { value: number | null | undefined; className?: string }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-700 ${className}`}>
    <div
      className="h-full w-full flex-1 bg-blue-500 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

export const CustomRechartsTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm bg-gray-800 border border-gray-700 rounded-lg shadow-lg text-white">
        <p className="font-bold">{label}</p>
        {payload.map((pld) => (
          <div key={pld.dataKey} style={{ color: pld.fill }}>
            {`${pld.name}: ${pld.value}`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};
