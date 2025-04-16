import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Combobox } from "@workspace/ui/components/combobox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

import { useApi } from "../../lib/api";

interface Contact {
  name: string;
  email: string;
  phone: string;
}

interface ContactOption {
  value: string;
  label: string | React.ReactElement;
}

interface ContactComboboxProps {
  placeholder: string;
}

const getOptions = (data: { contacts: Contact[] }) => {
  const emailIcon = "📧";
  const phoneIcon = "📞";
  const options: ContactOption[] = [];
  console.log("data", data);
  if (!data?.contacts) {
    return options;
  }
  for (const contact of data?.contacts ?? []) {
    const { name, email, phone } = contact;
    if (!email && !phone) {
      continue;
    }

    let label = `${name}`;
    if (email && phone) {
      label += ` ${emailIcon} ${phoneIcon}`;
    } else if (email) {
      label += ` ${emailIcon}`;
    } else if (phone) {
      label += ` ${phoneIcon}`;
    }

    const labelComponent = (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{label}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{name}</p>
          {email && <p>{email}</p>}
          {phone && <p>{phone}</p>}
        </TooltipContent>
      </Tooltip>
    );
    options.push({
      value: JSON.stringify({ name, email, phone }),
      label: labelComponent,
    });
  }
  return options;
};
export function ContactCombobox({ placeholder }: ContactComboboxProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { getPeople } = useApi();

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ["people", searchQuery],
    queryFn: () => getPeople(searchQuery),
  });

  return (
    <Combobox
      debounceTime={300}
      isLoading={isLoading}
      placeholder={placeholder}
      options={getOptions(contactsData)}
      onSearch={setSearchQuery}
    />
  );
}
