import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { TextField, Stack } from '@mui/material';
import { INERForm, IGPTForm } from '../models/CsvResponse';

const SearchEngineQueryTemplateForm: React.FC = () => {
    const { control } = useFormContext<INERForm | IGPTForm>();
    return (
        <Stack spacing={2}>
            <Controller
                name="search_query_template"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Шаблон поискового запроса"
                        placeholder="Введите шаблон"
                    />
                )}
            />
        </Stack>
    );
};

export default SearchEngineQueryTemplateForm;
