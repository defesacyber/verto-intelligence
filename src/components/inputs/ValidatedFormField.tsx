import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { ValidatedInput } from './ValidatedInput';
import { FieldTooltip } from './FieldTooltip';
import { ReactNode } from 'react';

interface ValidatedFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  tooltip?: string;
  description?: string;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ValidatedFormField<T extends FieldValues>({
  control,
  name,
  label,
  tooltip,
  description,
  placeholder,
  type = "number",
  min,
  max,
  icon,
  className,
  disabled,
}: ValidatedFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const isTouched = fieldState.isTouched || field.value !== undefined && field.value !== '' && field.value !== 0;
        const hasValue = type === "number" 
          ? field.value > 0 
          : field.value !== null && field.value !== undefined && field.value !== '';
        const isValid = !fieldState.error && hasValue;

        return (
          <FormItem className={className}>
            <FormLabel className="flex items-center">
              {icon}
              {label}
              {tooltip && <FieldTooltip content={tooltip} />}
            </FormLabel>
            <FormControl>
              <ValidatedInput
                type={type}
                placeholder={placeholder}
                min={min}
                max={max}
                disabled={disabled}
                isValid={isValid}
                isTouched={isTouched}
                error={fieldState.error?.message}
                {...field}
                value={type === "date" ? (field.value || '') : field.value}
                onChange={(e) => {
                  if (type === "number") {
                    field.onChange(Number(e.target.value));
                  } else {
                    field.onChange(e.target.value);
                  }
                }}
                onBlur={() => {
                  field.onBlur();
                }}
              />
            </FormControl>
            {description && (
              <FormDescription>{description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
