import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SCHOOLS = [
  {
    group: "Schools with English-Based Degree Programs",
    items: [
      "School of Fundamental Science and Engineering (Undergraduate)",
      "School of Creative Science and Engineering (Undergraduate)",
      "School of Political Science and Economics (Undergraduate)",
      "School of Social Sciences (Undergraduate)",
      "School of International Liberal Studies (SILS) (Undergraduate)",
      "School of Culture, Media and Society (Undergraduate)",
      "Graduate School of Fundamental Science and Engineering",
      "Graduate School of Creative Science and Engineering",
      "Graduate School of Advanced Science and Engineering",
      "Graduate School of Information, Production and Systems (IPS)",
      "Graduate School of Environment and Energy Engineering (WEEE)",
      "Graduate School of Political Science",
      "Graduate School of Economics",
      "Graduate School of Law",
      "Graduate School of Letters, Arts and Sciences",
      "Graduate School of Commerce",
      "Graduate School of Business and Finance (Waseda Business School)",
      "Graduate School of Social Sciences",
      "Graduate School of Sport Sciences",
      "Graduate School of Asia-Pacific Studies (GSAPS)",
      "Graduate School of International Culture and Communication Studies (GSICCS)"
    ]
  },
  {
    group: "Schools with Japanese-Only Degree Programs",
    items: [
      "School of Advanced Science and Engineering (Undergraduate)",
      "School of Law (Undergraduate)",
      "School of Humanities and Social Sciences (Undergraduate)",
      "School of Education (Undergraduate)",
      "School of Commerce (Undergraduate)",
      "School of Human Sciences (Undergraduate)",
      "School of Sport Sciences (Undergraduate)",
      "Waseda Law School (Professional Graduate School / J.D.)",
      "Graduate School of Accountancy (Professional Graduate School)",
      "Graduate School of Education",
      "Graduate School of Human Sciences",
      "Graduate School of Japanese Applied Linguistics (GSJAL)"
    ]
  }
];

export function SchoolCombobox({ 
  value, 
  onChange,
  className,
  placeholder = "Select your school..."
}: { 
  value: string; 
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5",
            className
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-in fade-in-80 zoom-in-95 max-h-[300px]"
        >
          <Command className="flex h-full w-full flex-col overflow-hidden bg-white">
            <div className="flex items-center border-b border-gray-100 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                placeholder="Find your school..."
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[250px] overflow-y-auto overflow-x-hidden p-1">
              <Command.Empty className="py-6 text-center text-sm">
                No school found.
              </Command.Empty>
              {SCHOOLS.map((group) => (
                <Command.Group 
                  key={group.group} 
                  heading={group.group}
                  className="overflow-hidden text-gray-900 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500"
                >
                  {group.items.map((school) => (
                    <Command.Item
                      key={school}
                      value={school}
                      onSelect={(currentValue) => {
                        onChange(currentValue);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 hover:cursor-pointer"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === school ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {school}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
