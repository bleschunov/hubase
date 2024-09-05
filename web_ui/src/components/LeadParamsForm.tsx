import React from 'react';
import {Controller, useFormContext} from 'react-hook-form';
import {TextField, Stack} from '@mui/material';


const LeadParamsForm: React.FC = () => {
    const {control} = useFormContext();
    return (
        <Stack spacing={2}>
            <Controller
                name="companies"
                control={control}
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Компании"
                        placeholder="Введите названия компаний"
                        multiline
                        rows={4}
                    />
                )}
            />
            <Controller
                name="sites"
                control={control}
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Сайты"
                        placeholder="Введите URL сайтов"
                        multiline
                        rows={4}
                    />
                )}
            />
            <Controller
                name="positions"
                control={control}
                render={({field}) => (
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
                render={({field}) => (
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
