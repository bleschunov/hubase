import React from 'react';
import {useFormContext, Controller} from 'react-hook-form';
import {Stack, TextField} from '@mui/material';
import SearchEngineQueryForm from './SearchEngineQueryForm';
import LeadParamsForm from './LeadParamsForm';

interface IGPTForm {
    strategy: "gpt";
    companies: string;
    sites: string;
    positions: string;
    search_query_template: string;
    max_lead_count: number;
    companyPrompt: string;
    positionPrompt: string;
    openai_api_key: string;
    openai_api_base: string;
}

const GPTForm: React.FC = () => {
    const {control} = useFormContext<IGPTForm>();

    return (
        <Stack spacing={2}>
            <Controller
                name="companyPrompt"
                control={control}
                defaultValue=""
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Company Prompt"
                        variant="outlined"
                    />
                )}
            />
            <Controller
                name="positionPrompt"
                control={control}
                defaultValue=""
                render={({field}) => (
                    <TextField
                        {...field}
                        label="Position Prompt"
                        variant="outlined"
                    />
                )}
            />
            <SearchEngineQueryForm/>
            <LeadParamsForm/>
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
        </Stack>
    );
};

export default GPTForm;
