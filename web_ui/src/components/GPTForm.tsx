import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Stack, TextField } from '@mui/material';
import PromptForm from './PromptForm';

interface GPTFormProps {
    setCompanyPromptContext: (value: string) => void;
    setPositionPromptContext: (value: string) => void;
}

interface IGPTForm {
    strategy: "gpt";
    companies: string;
    sites: string;
    positions: string;
    search_query_template: string;
    max_lead_count: number;
    openai_api_key: string;
    openai_api_base: string;
}

const GPTForm: React.FC<GPTFormProps> = ({ setCompanyPromptContext, setPositionPromptContext }) => {
    const { control } = useFormContext<IGPTForm>();

    return (
        <Stack spacing={2}>
            <PromptForm
                setCompanyPromptContext={setCompanyPromptContext}
                setPositionPromptContext={setPositionPromptContext}
            />
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
            <Controller
                name="openai_api_key"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="OpenAI API Key"
                        placeholder="Введите ваш API ключ OpenAI"
                        type="password"
                    />
                )}
            />
            <Controller
                name="openai_api_base"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="OpenAI API Base"
                        placeholder="Введите базовый URL OpenAI API"
                    />
                )}
            />
        </Stack>
    );
};

export default GPTForm;
