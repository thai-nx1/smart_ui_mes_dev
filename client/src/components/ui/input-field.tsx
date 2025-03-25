import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { fieldTypeColors, FieldType, FieldOption } from "@/lib/types";

interface InputFieldProps {
  id: string;
  name: string;
  description?: string | null;
  fieldType: FieldType;
  value: any;
  onChange: (value: any) => void;
  options?: FieldOption[];
  required?: boolean;
  error?: string;
}

export function InputField({
  id,
  name,
  description,
  fieldType,
  value,
  onChange,
  options = [],
  required = false,
  error,
}: InputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Default options if none provided
  const fieldOptions = options.length > 0 
    ? options 
    : Array(4).fill(0).map((_, i) => ({ 
        id: `option-${i+1}`, 
        label: `Lựa chọn ${i+1}`, 
        value: `${i+1}`
      }));

  const renderField = () => {
    switch (fieldType) {
      case "TEXT":
        return (
          <Input
            id={id}
            value={value || ""}
            onChange={handleChange}
            className={cn(error && "border-red-500")}
            placeholder="Nhập văn bản"
            required={required}
          />
        );
      
      case "PARAGRAPH":
        return (
          <Textarea
            id={id}
            value={value || ""}
            onChange={handleChange}
            className={cn(error && "border-red-500")}
            placeholder="Nhập đoạn văn bản dài"
            rows={3}
            required={required}
          />
        );
      
      case "NUMBER":
        return (
          <Input
            id={id}
            type="number"
            value={value || ""}
            onChange={handleChange}
            className={cn(error && "border-red-500")}
            placeholder="0"
            required={required}
          />
        );
      
      case "SINGLE_CHOICE":
        return (
          <RadioGroup
            value={value || ""}
            onValueChange={onChange}
            className="mt-2 space-y-2"
          >
            {fieldOptions.map((option) => (
              <div 
                key={option.id} 
                className={cn(
                  "flex items-center space-x-2",
                  error && "border-red-500 p-2 rounded"
                )}
              >
                <RadioGroupItem id={`${id}-${option.id}`} value={option.value} />
                <Label htmlFor={`${id}-${option.id}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case "MULTI_CHOICE":
        return (
          <div className="mt-2 space-y-2">
            {fieldOptions.map((option) => (
              <div 
                key={option.id} 
                className={cn(
                  "flex items-center space-x-2",
                  error && "border-red-500 p-2 rounded"
                )}
              >
                <Checkbox
                  id={`${id}-${option.id}`}
                  checked={(value || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    
                    if (checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(currentValues.filter(v => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${id}-${option.id}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
      
      case "DATE":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                  error && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP", { locale: vi }) : "Chọn một ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date?.toISOString() || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      
      default:
        return <Input value={value || ""} onChange={handleChange} />;
    }
  };

  const { bg, text } = fieldTypeColors[fieldType];

  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          {fieldType !== "SINGLE_CHOICE" && fieldType !== "MULTI_CHOICE" && (
            <Label htmlFor={id} className="font-medium">
              {name}
            </Label>
          )}
          {(fieldType === "SINGLE_CHOICE" || fieldType === "MULTI_CHOICE") && (
            <span className="block text-sm font-medium text-gray-700">{name}</span>
          )}
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
          {error && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </div>
        <Badge variant={fieldType.toLowerCase() as any} className={`${bg} ${text}`}>
          {fieldType.replace('_', ' ')}
        </Badge>
      </div>
      <div className="mt-1">{renderField()}</div>
    </div>
  );
}
