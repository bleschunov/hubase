import React from 'react';
import { Controller } from 'react-hook-form';
import { TextField, Stack } from '@mui/material';

const LeadParamsForm: React.FC<LeadParamsFormProps> = ({ control }) => {
    return (
        <Stack spacing={2}>
            <Controller
                name="positions"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Должности"
                        placeholder="Введите должности"
                        multiline
                        rows={4}
                    />
                )}
            />
            <Controller
                name="max_lead_count"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Максимальное количество лидов"
                        type="number"
                    />
                )}
            />
        </Stack>
    );
};

export default LeadParamsForm;
