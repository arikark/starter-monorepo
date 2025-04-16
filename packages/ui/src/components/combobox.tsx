"use client";

import * as React from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { debounce } from "lodash-es";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

interface ComboboxProps extends React.ComponentProps<typeof Popover> {
  placeholder: string;
  options: { value: string; label: string | React.ReactNode }[];
  onSearch: (value: string) => void;
  debounceTime?: number;
  isLoading?: boolean;
}

export function Combobox({
  options,
  placeholder,
  onSearch,
  isLoading,
  debounceTime = 300,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  // Create debounced search function outside of useCallback
  const debouncedSearch = React.useMemo(
    () => debounce((value: string) => onSearch(value), debounceTime),
    [onSearch, debounceTime],
  );

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            onValueChange={debounceTime ? debouncedSearch : onSearch}
            placeholder="Search framework..."
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty className="flex justify-center items-center py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </CommandEmpty>
            ) : (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
