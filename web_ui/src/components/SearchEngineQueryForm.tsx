import React from 'react';
import { Controller } from 'react-hook-form';
import { TextField, Stack } from '@mui/material';

const SearchEngineQueryForm: React.FC<SearchEngineQueryFormProps> = ({ control }) => {
    return (
        <Stack spacing={2}>
            <Controller
                name="companies"
                control={control}
                render={({ field }) => (
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
                render={({ field }) => (
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

export default SearchEngineQueryForm;
