import React from 'react';
import { Field, FieldType } from '@/lib/types';
import { InputField } from './input-field';
import { fetchSearchOptions } from '@/lib/api';
import { ActionMeta, SingleValue } from 'react-select';
import ReactSelect from 'react-select';
import { useEffect, useState } from 'react';

interface FormFieldProps {
  field: Field | any;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  name?: string;
  isRequired?: boolean;
  optionId?: string;
  showFieldLabel?: boolean;
}

export function FormField({
  field,
  value,
  onChange,
  onBlur,
  name,
  isRequired,
  optionId,
  showFieldLabel = false
}: FormFieldProps) {
  // Handle field with SEARCH type
  if (field.field_type === 'SEARCH') {
    return (
      <div className="grid gap-2">
        {showFieldLabel && (
          <label className="font-medium text-sm">
            {field.name}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <SearchableSelect 
          field={field} 
          value={value} 
          onChange={onChange} 
          optionId={optionId}
        />
      </div>
    );
  }

  // Default to use InputField for other field types
  return (
    <div className="grid gap-2">
      {showFieldLabel && (
        <label className="font-medium text-sm">
          {field.name}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <InputField
        id={field.id}
        name={field.name}
        description={field.description}
        fieldType={field.field_type as FieldType}
        value={value}
        onChange={onChange}
        options={field.options}
        required={isRequired}
      />
    </div>
  );
}

// SearchableSelect component for SEARCH field type
interface SearchableSelectProps {
  field: Field | any;
  value: any;
  onChange: (value: any) => void;
  optionId?: string;
}

function SearchableSelect({ field, value, onChange, optionId }: SearchableSelectProps) {
  const [options, setOptions] = useState<{value: string, label: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Extract the option_id from the field's configuration 
    const loadOptions = async () => {
      console.log("Field:", field);
      try {
        setIsLoading(true);
        
        // Check if configuration exists and has option_id
        if (!field.option_id && !optionId) {
          console.error("Field configuration is missing for SEARCH field:", field.id);
          setOptions([]);
          return;
        }
        
        // Use optionId from props or from field.option_id
        const optionIdToUse = optionId || field.option_id;
        
        // Fetch search options from API
        const response = await fetchSearchOptions(optionIdToUse);
        
        if (response.data && response.data.core_core_option_items) {
          const fetchedOptions = response.data.core_core_option_items.map((option: any) => ({
            value: option.id,
            label: option.name || option.code
          }));
          setOptions(fetchedOptions);
        } else {
          console.error("Failed to fetch options or empty response");
          setOptions([]);
        }
      } catch (error) {
        console.error("Error loading search options:", error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOptions();
  }, [field.id, field.option_id, optionId]);
  
  // Find the selected option based on the current value
  const selectedOption = options.find(option => option.value === value) || null;
  
  const handleChange = (selected: SingleValue<{value: string, label: string}>, action: ActionMeta<{value: string, label: string}>) => {
    onChange(selected ? selected.value : null);
  };
  
  // Sử dụng React Select component đã import ở trên
  
  return (
    <ReactSelect
      className="w-full focus:outline-none"
      classNamePrefix="react-select"
      value={selectedOption}
      onChange={handleChange}
      options={options}
      isLoading={isLoading}
      isClearable
      placeholder="Chọn hoặc tìm kiếm..."
      noOptionsMessage={() => "Không có tùy chọn"}
      loadingMessage={() => "Đang tải..."}
      styles={{
        control: (base) => ({
          ...base,
          borderWidth: 0,
          backgroundColor: 'rgb(248 250 252)',
          boxShadow: 'none',
          '&:hover': {
            borderColor: 'transparent',
          }
        }),
        menu: (base) => ({
          ...base,
          borderRadius: 8,
          overflow: 'hidden'
        })
      }}
    />
  );
}