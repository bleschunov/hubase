import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Stack, TextField } from '@mui/material';
import PromptForm from './PromptForm';
import SearchEngineQueryForm from './SearchEngineQueryForm';
import LeadParamsForm from './LeadParamsForm';

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
            <SearchEngineQueryForm control={control} />
            <LeadParamsForm control={control} />
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
