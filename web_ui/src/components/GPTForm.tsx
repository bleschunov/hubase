import React from 'react';
import {useFormContext, Controller} from 'react-hook-form';
import {Stack, TextField} from '@mui/material';
import LeadParamsForm from './LeadParamsForm';

interface IGPTForm {
    strategy: "gpt";
    companies: string;
    sites: string;
    positions: string;
    search_query_template: string;
    max_lead_count: number;
    prompt: string;
    openai_api_key: string;
    openai_api_base: string;
}

const GPTForm: React.FC<IGPTForm> = () => {
    const {control} = useFormContext<IGPTForm>();

    return (
        <Stack spacing={2}>
            <Controller
                name="prompt"
                control={control}
                defaultValue=""
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Промпт"
                        placeholder="Введите ваш запрос"
                    />
                )}
            />
            <Controller
                name="openai_api_key"
                control={control}
                defaultValue=""
                render={({field}) => (
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
                defaultValue=""
                render={({field}) => (
                    <TextField
                        {...field}
                        label="OpenAI API Base"
                        placeholder="Введите базовый URL OpenAI API"
                    />
                )}
            />
            <LeadParamsForm/>
        </Stack>
    );
};

export default GPTForm;
